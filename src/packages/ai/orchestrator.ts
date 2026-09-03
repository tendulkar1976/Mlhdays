/**
 * Central AI Orchestrator with Controlled Tool Calling and Guardrails
 * Invariant: Gemini explains and orchestrates; calculations are strictly deterministic.
 */

import { geminiClient } from './gemini-client.js';
import { COPILOT_SYSTEM_PROMPT, STATUTORY_TAX_DISCLAIMER } from './prompts.js';
import { ALL_CONTROLLED_TOOLS, executeToolCall } from './tools/definitions.js';
import { AIChatMessage, AIChatResponse, AIOrchestrationTrace, ToolExecutionRecord } from '../../types/shared.js';
import { taxKnowledgeRetriever } from '../rag/retriever.js';
import { deterministicTaxEngine } from '../tax-engine/deterministic-calculator.js';

export class AIOrchestrator {
  /**
   * Process a conversational user prompt through Gemini with automatic tool execution
   */
  public async processMessage(
    userMessage: string,
    history: AIChatMessage[] = [],
    taxTwinId = 'twin_demo_v1'
  ): Promise<AIChatResponse> {
    const startTime = Date.now();
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const toolsCalled: string[] = [];
    const citations: AIChatResponse['citations'] = [];
    const toolExecutions: ToolExecutionRecord[] = [];

    const trace: AIOrchestrationTrace = {
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      latency_ms: 0,
      model_used: 'gemini-2.5-flash',
      tools_invoked: [],
    };

    // Check if live Gemini client is available
    if (geminiClient.isLiveClientAvailable()) {
      try {
        const model = geminiClient.getModel({
          systemInstruction: COPILOT_SYSTEM_PROMPT,
          tools: ALL_CONTROLLED_TOOLS,
        });

        const chat = model.startChat({
          history: history.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
          })),
        });

        // 1. Send user message
        let response = await geminiClient.generateWithRetry(async () => {
          return await chat.sendMessage(userMessage);
        });

        // 2. Loop for tool execution if model calls functions
        let maxToolLoops = 5;
        while (response.response.functionCalls() && maxToolLoops > 0) {
          maxToolLoops--;
          const functionCalls = response.response.functionCalls();
          if (!functionCalls || functionCalls.length === 0) break;

          const toolResponses: Array<{
            functionResponse: {
              name: string;
              response: { output: unknown };
            };
          }> = [];

          for (const call of functionCalls) {
            toolsCalled.push(call.name);
            const toolResult = await executeToolCall(call.name, (call.args as Record<string, unknown>) || {});

            const execRecord: ToolExecutionRecord = {
              tool_name: call.name,
              arguments: (call.args as Record<string, unknown>) || {},
              execution_status: toolResult.success ? 'SUCCESS' : 'ERROR',
              result: toolResult.data,
              result_summary: toolResult.success ? JSON.stringify(toolResult.data).substring(0, 100) : toolResult.error,
            };

            toolExecutions.push(execRecord);
            trace.tools_invoked.push(execRecord);

            toolResponses.push({
              functionResponse: {
                name: call.name,
                response: { output: toolResult.data || { error: toolResult.error } },
              },
            });
          }

          // Send function responses back to Gemini
          response = await geminiClient.generateWithRetry(async () => {
            return await chat.sendMessage(toolResponses as unknown as string);
          });
        }

        const finalText = response.response.text();
        trace.latency_ms = Date.now() - startTime;
        const respId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        return {
          id: respId,
          role: 'assistant',
          content: finalText,
          response_id: respId,
          message: finalText,
          tools_called: toolsCalled,
          tool_execution: toolExecutions,
          citations: citations,
          disclaimer: STATUTORY_TAX_DISCLAIMER,
          trace: trace,
        };
      } catch (err) {
        // In case of transient failure or fallback, use grounded fallback handler
        return this.processFallbackMessage(userMessage, taxTwinId, trace, startTime);
      }
    }

    // Direct grounded deterministic orchestrator fallback (for offline or testing)
    return this.processFallbackMessage(userMessage, taxTwinId, trace, startTime);
  }

  /**
   * Deterministic intent router & fallback handler
   */
  private async processFallbackMessage(
    userMessage: string,
    taxTwinId = 'twin_demo_v1',
    trace: AIOrchestrationTrace,
    startTime: number
  ): Promise<AIChatResponse> {
    const lower = userMessage.toLowerCase();
    const toolsCalled: string[] = [];
    const toolExecutions: ToolExecutionRecord[] = [];
    let replyText = '';
    const citations: AIChatResponse['citations'] = [];

    // Extract potential salary amount from message (e.g. "salary is 1500000" or "earning 15 lakhs")
    const salaryMatch = lower.match(/(?:salary|earning|income|make)\s*(?:is|of|around)?\s*₹?\s*(\d[\d,]+)/i) ||
                        lower.match(/(\d+)\s*(?:lakh|lakhs|lac|lacs)/i);

    let grossSalary = 0;
    if (salaryMatch) {
      if (salaryMatch[0].includes('lakh') || salaryMatch[0].includes('lac')) {
        grossSalary = parseFloat(salaryMatch[1]) * 100000;
      } else {
        grossSalary = parseFloat(salaryMatch[1].replace(/,/g, ''));
      }
    }

    // 1. Conflict / Mismatch / AIS intent
    if (lower.includes('conflict') || lower.includes('mismatch') || lower.includes('ais') || lower.includes('tis') || (lower.includes('interest') && lower.includes('difference'))) {
      toolsCalled.push('get_tax_twin_conflicts');
      const conflictRes = await executeToolCall('get_tax_twin_conflicts', { tax_twin_id: taxTwinId });
      const conflictData = conflictRes.data as {
        unresolved_conflicts: Array<{
          field_name: string;
          self_reported_value: number;
          ais_reported_value: number;
          delta_amount: number;
          tax_implication: string;
        }>;
      };

      const execRecord: ToolExecutionRecord = {
        tool_name: 'get_tax_twin_conflicts',
        arguments: { tax_twin_id: taxTwinId },
        execution_status: 'SUCCESS',
        result: conflictData,
      };
      toolExecutions.push(execRecord);
      trace.tools_invoked.push(execRecord);

      const conflict = conflictData.unresolved_conflicts[0];
      replyText = `### ⚠️ Tax Twin Discrepancy Detected (AIS vs Self-Reported)

* **Field**: Savings Account Interest (\`savings_interest\`)
* **Self-Reported Value**: ₹${conflict.self_reported_value.toLocaleString('en-IN')}
* **AIS/TIS Value**: ₹${conflict.ais_reported_value.toLocaleString('en-IN')}
* **Unreported Delta**: **₹${conflict.delta_amount.toLocaleString('en-IN')}**
* **Verification Status**: \`CONFLICT\`

**Tax Implication**:
${conflict.tax_implication}

**Recommended Action**:
Accept the AIS/TIS value of **₹${conflict.ais_reported_value.toLocaleString('en-IN')}** to avoid statutory scrutiny and create a new verified Tax Twin version before filing your ITR.`;
    }
    // 2. Filing Readiness intent
    else if (lower.includes('readiness') || lower.includes('ready to file') || lower.includes('can i file') || lower.includes('filing status')) {
      toolsCalled.push('get_filing_readiness');
      const readinessRes = await executeToolCall('get_filing_readiness', { tax_twin_id: taxTwinId });
      const readinessData = readinessRes.data as {
        filing_readiness_score: number;
        status: string;
        suggested_itr_form: string;
        pending_reconciliation_items: Array<{ field_name: string; amount: number; state: string }>;
        next_step: string;
      };

      const execRecord: ToolExecutionRecord = {
        tool_name: 'get_filing_readiness',
        arguments: { tax_twin_id: taxTwinId },
        execution_status: 'SUCCESS',
        result: readinessData,
      };
      toolExecutions.push(execRecord);
      trace.tools_invoked.push(execRecord);

      replyText = `### 📊 Tax Filing Readiness Assessment (AY 2026-27)

* **Filing Readiness Score**: **${readinessData.filing_readiness_score}%**
* **Overall Status**: \`${readinessData.status}\`
* **Suggested ITR Form**: **${readinessData.suggested_itr_form}**
* **Pending Action**: Reconcile ${readinessData.pending_reconciliation_items.length} unverified item(s) (\`${readinessData.pending_reconciliation_items.map(i => i.field_name).join(', ')}\`).

**Next Step**: ${readinessData.next_step}`;
    }
    // 3. Regime comparison intent
    else if (lower.includes('compare') || lower.includes('which regime') || lower.includes('better regime') || (lower.includes('regime') && lower.includes('should i choose'))) {
      toolsCalled.push('compare_regimes');
      const calcSalary = grossSalary > 0 ? grossSalary : 1450000;
      const comp = deterministicTaxEngine.compareRegimes({
        regime: 'NEW',
        gross_salary: calcSalary,
        deductions_80c: 150000,
        deductions_80d: 25000,
      });

      const execRecord: ToolExecutionRecord = {
        tool_name: 'compare_regimes',
        arguments: { gross_salary: calcSalary },
        execution_status: 'SUCCESS',
        result: comp,
      };
      toolExecutions.push(execRecord);
      trace.tools_invoked.push(execRecord);

      replyText = `### Tax Regime Comparison for FY 2025-26 (AY 2026-27)
For a gross salary of **₹${calcSalary.toLocaleString('en-IN')}**:

* **New Tax Regime (Section 115BAC)**:
  * Standard Deduction: ₹75,000
  * Taxable Income: ₹${comp.new_regime.taxable_income.toLocaleString('en-IN')}
  * Total Tax Payable: **₹${comp.new_regime.total_tax.toLocaleString('en-IN')}**
* **Old Tax Regime**:
  * Total Deductions (Standard + 80C + 80D): ₹${comp.old_regime.total_exemptions_deductions.toLocaleString('en-IN')}
  * Taxable Income: ₹${comp.old_regime.taxable_income.toLocaleString('en-IN')}
  * Total Tax Payable: **₹${comp.old_regime.total_tax.toLocaleString('en-IN')}**

**Recommendation**: **${comp.recommended_regime} Tax Regime** is more beneficial for you, saving **₹${comp.tax_savings.toLocaleString('en-IN')}** in taxes.`;
    }
    // 4. Tax calculation intent
    else if (lower.includes('how much tax') || lower.includes('calculate tax') || lower.includes('tax payable') || lower.includes('my tax')) {
      toolsCalled.push('calculate_tax');
      const calcSalary = grossSalary > 0 ? grossSalary : 1450000;
      const res = deterministicTaxEngine.calculateNewRegime({
        regime: 'NEW',
        gross_salary: calcSalary,
      });

      const execRecord: ToolExecutionRecord = {
        tool_name: 'calculate_tax',
        arguments: { gross_salary: calcSalary, regime: 'NEW' },
        execution_status: 'SUCCESS',
        result: res,
      };
      toolExecutions.push(execRecord);
      trace.tools_invoked.push(execRecord);

      replyText = `### Tax Calculation Breakdown (New Regime — FY 2025-26)
* **Gross Salary**: ₹${calcSalary.toLocaleString('en-IN')}
* **Standard Deduction (Section 16ia)**: ₹75,000
* **Net Taxable Income**: ₹${res.taxable_income.toLocaleString('en-IN')}
* **Tax before Rebate**: ₹${res.tax_before_rebate.toLocaleString('en-IN')}
* **Section 87A Rebate**: ₹${res.rebate_87a.toLocaleString('en-IN')}
* **4% Health & Education Cess**: ₹${res.cess.toLocaleString('en-IN')}
* **Total Tax Payable**: **₹${res.total_tax.toLocaleString('en-IN')}**

${res.rebate_87a > 0 ? '🎉 *You are eligible for the full Section 87A rebate under the New Regime (income up to ₹12 Lakhs is tax-free).*' : ''}`;
    }
    // 5. Deadlines intent
    else if (lower.includes('deadline') || lower.includes('due date') || lower.includes('last date') || lower.includes('when to file')) {
      toolsCalled.push('get_deadlines');
      const deadlines = taxKnowledgeRetriever.getDeadlines();
      const execRecord: ToolExecutionRecord = {
        tool_name: 'get_deadlines',
        arguments: {},
        execution_status: 'SUCCESS',
        result: deadlines,
      };
      toolExecutions.push(execRecord);
      trace.tools_invoked.push(execRecord);

      replyText = `### Statutory Tax Deadlines for FY 2025-26 (AY 2026-27):
* **ITR Filing Deadline for Individuals (Non-Audit)**: **July 31, 2026** (Section 139(1))
* **Advance Tax Installments**:
  * 1st Installment (15%): June 15, 2025
  * 2nd Installment (45%): September 15, 2025
  * 3rd Installment (75%): December 15, 2025
  * 4th Installment (100%): March 15, 2026
* **Belated / Revised Return**: **December 31, 2026** (Section 139(4)/(5))`;
    }
    // 6. Tax knowledge search intent
    else {
      toolsCalled.push('search_tax_knowledge');
      const results = await taxKnowledgeRetriever.searchKnowledge({ query: userMessage, top_k: 2 });
      const execRecord: ToolExecutionRecord = {
        tool_name: 'search_tax_knowledge',
        arguments: { query: userMessage },
        execution_status: 'SUCCESS',
        result: results.map(r => r.chunk),
      };
      toolExecutions.push(execRecord);
      trace.tools_invoked.push(execRecord);

      if (results.length > 0) {
        replyText = `Based on the statutory rules for **FY 2025-26 / AY 2026-27**:\n\n` +
          results.map(r => `#### ${r.chunk.title} (${r.chunk.section_or_topic})\n${r.chunk.content}`).join('\n\n');

        for (const r of results) {
          citations.push({
            title: r.chunk.title,
            section: r.chunk.section_or_topic,
            source: r.chunk.source_authority,
            rule_version: r.chunk.rule_version,
          });
        }
      } else {
        replyText = `I am your AI Personal Tax Copilot for Indian taxpayers for FY 2025-26 (AY 2026-27). You can ask me to calculate your tax, compare Old vs New regimes, explain Section 80C/80D/87A deductions, check filing deadlines, or extract and reconcile your Form 16, AIS, and 26AS.`;
      }
    }

    trace.latency_ms = Date.now() - startTime;
    const respId = `msg_fallback_${Date.now()}`;

    return {
      id: respId,
      role: 'assistant',
      content: replyText,
      response_id: respId,
      message: replyText,
      tools_called: toolsCalled,
      tool_execution: toolExecutions,
      citations: citations,
      disclaimer: STATUTORY_TAX_DISCLAIMER,
      trace: trace,
    };
  }
}

export const aiOrchestrator = new AIOrchestrator();
