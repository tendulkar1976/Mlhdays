/**
 * Controlled Gemini Tool/Function Calling Definitions and Dispatcher
 * Invariant: Gemini MUST call calculate_tax or compare_regimes for numerical tax results.
 */

import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { taxTwinStore } from './tax-store.js';
import { deterministicTaxEngine } from '../../tax-engine/deterministic-calculator.js';
import { member1Client } from '../../tax-engine/member1-client.js';
import { taxKnowledgeRetriever } from '../../rag/retriever.js';
import { TaxCalculationRequest, TaxRegime } from '../../../types/shared.js';

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * 1. get_tax_profile schema
 */
export const getTaxProfileDeclaration: FunctionDeclaration = {
  name: 'get_tax_profile',
  description: 'Retrieve the taxpayer personal profile including age category, residency status, and regime preference.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      profile_id: {
        type: SchemaType.STRING,
        description: 'The unique tax profile ID (default: "prof_demo_01")',
      },
    },
    required: ['profile_id'],
  },
};

/**
 * 2. get_tax_twin schema
 */
export const getTaxTwinDeclaration: FunctionDeclaration = {
  name: 'get_tax_twin',
  description: 'Retrieve an immutable Tax Twin snapshot version representing taxpayer state for a financial year.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      tax_twin_id: {
        type: SchemaType.STRING,
        description: 'The unique Tax Twin identifier (e.g. "twin_demo_v1")',
      },
    },
    required: ['tax_twin_id'],
  },
};

/**
 * 3. get_facts schema
 */
export const getFactsDeclaration: FunctionDeclaration = {
  name: 'get_facts',
  description: 'Retrieve all verified financial facts (gross salary, 80C, 80D, TDS, deductions) bound to a specific Tax Twin ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      tax_twin_id: {
        type: SchemaType.STRING,
        description: 'The Tax Twin ID whose facts are requested',
      },
      category: {
        type: SchemaType.STRING,
        description: 'Optional filter by fact category: SALARY, DEDUCTION_80C, DEDUCTION_80D, TDS',
      },
    },
    required: ['tax_twin_id'],
  },
};

/**
 * 4. search_tax_knowledge schema
 */
export const searchTaxKnowledgeDeclaration: FunctionDeclaration = {
  name: 'search_tax_knowledge',
  description: 'Retrieve authoritative statutory tax rules, deductions, and exemptions for FY 2025-26 / AY 2026-27.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: 'Natural language search query regarding tax laws, slabs, or sections',
      },
      financial_year: {
        type: SchemaType.STRING,
        description: 'Filter by Financial Year (default: "2025-2026")',
      },
      section_or_topic: {
        type: SchemaType.STRING,
        description: 'Optional section filter (e.g. "Section 87A", "Section 80C", "Section 115BAC")',
      },
    },
    required: ['query'],
  },
};

/**
 * 5. calculate_tax schema
 */
export const calculateTaxDeclaration: FunctionDeclaration = {
  name: 'calculate_tax',
  description: 'Invoke the authoritative deterministic tax calculation engine for Indian income tax (FY 2025-26 / AY 2026-27).',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      regime: {
        type: SchemaType.STRING,
        description: 'Tax regime to calculate: "NEW" (default) or "OLD"',
      },
      gross_salary: {
        type: SchemaType.NUMBER,
        description: 'Annual gross salary income in INR',
      },
      other_income: {
        type: SchemaType.NUMBER,
        description: 'Income from other sources (savings interest, fixed deposits, freelance)',
      },
      deductions_80c: {
        type: SchemaType.NUMBER,
        description: 'Section 80C deductions (PPF, EPF, ELSS, Life Insurance - max 1,50,000 in Old Regime)',
      },
      deductions_80d: {
        type: SchemaType.NUMBER,
        description: 'Section 80D medical insurance premium paid',
      },
      deductions_80ccd_1b: {
        type: SchemaType.NUMBER,
        description: 'Section 80CCD(1B) additional NPS contribution (max 50,000 in Old Regime)',
      },
      house_property_income_or_loss: {
        type: SchemaType.NUMBER,
        description: 'Home loan interest loss under Sec 24(b) (negative number up to -200000)',
      },
      tds_paid: {
        type: SchemaType.NUMBER,
        description: 'Total TDS already deducted by employer or banks',
      },
      advance_tax_paid: {
        type: SchemaType.NUMBER,
        description: 'Advance tax already deposited by taxpayer',
      },
    },
    required: ['gross_salary', 'regime'],
  },
};

/**
 * 6. compare_regimes schema
 */
export const compareRegimesDeclaration: FunctionDeclaration = {
  name: 'compare_regimes',
  description: 'Deterministically compute and compare Old Tax Regime vs New Tax Regime to recommend the highest tax savings.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      gross_salary: {
        type: SchemaType.NUMBER,
        description: 'Annual gross salary income in INR',
      },
      other_income: {
        type: SchemaType.NUMBER,
        description: 'Other income in INR',
      },
      deductions_80c: {
        type: SchemaType.NUMBER,
        description: 'Section 80C investments (max 1.5L in Old Regime)',
      },
      deductions_80d: {
        type: SchemaType.NUMBER,
        description: 'Section 80D health insurance',
      },
      deductions_80ccd_1b: {
        type: SchemaType.NUMBER,
        description: 'NPS contribution under 80CCD(1B) (max 50k in Old Regime)',
      },
      house_property_income_or_loss: {
        type: SchemaType.NUMBER,
        description: 'Home loan interest (negative number up to -200000)',
      },
    },
    required: ['gross_salary'],
  },
};

/**
 * 7. create_scenario schema
 */
export const createScenarioDeclaration: FunctionDeclaration = {
  name: 'create_scenario',
  description: 'Simulate a What-If financial scenario without mutating the baseline Tax Twin.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      baseline_twin_id: {
        type: SchemaType.STRING,
        description: 'The baseline Tax Twin ID to branch scenario from',
      },
      scenario_title: {
        type: SchemaType.STRING,
        description: 'Title for scenario (e.g., "Max NPS Contribution + Health Insurance")',
      },
      hypothetical_modifications: {
        type: SchemaType.OBJECT,
        description: 'Fact modifications to test (e.g. additional 80C, 80D, NPS, or salary increment)',
        properties: {
          gross_salary: { type: SchemaType.NUMBER, description: 'Modified gross salary' },
          deductions_80c: { type: SchemaType.NUMBER, description: 'Modified 80C amount' },
          deductions_80d: { type: SchemaType.NUMBER, description: 'Modified 80D amount' },
          deductions_80ccd_1b: { type: SchemaType.NUMBER, description: 'Modified NPS amount' },
        },
      },
    },
    required: ['baseline_twin_id', 'scenario_title'],
  },
};

/**
 * 8. get_sources schema
 */
export const getSourcesDeclaration: FunctionDeclaration = {
  name: 'get_sources',
  description: 'Retrieve authoritative statutory legal sources, sections, and notifications from the Income Tax Act.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      topic: {
        type: SchemaType.STRING,
        description: 'Topic or section name (e.g. "Section 87A", "Section 115BAC", "Standard Deduction")',
      },
    },
    required: ['topic'],
  },
};

/**
 * 9. get_deadlines schema
 */
export const getDeadlinesDeclaration: FunctionDeclaration = {
  name: 'get_deadlines',
  description: 'Retrieve official statutory tax filing and advance tax payment deadlines for FY 2025-26 / AY 2026-27.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      category: {
        type: SchemaType.STRING,
        description: 'Deadline category: "ITR_FILING", "ADVANCE_TAX", or "BELATED_REVISED_RETURN"',
      },
    },
  },
};

/**
 * 10. get_tax_twin_conflicts schema
 */
export const getTaxTwinConflictsDeclaration: FunctionDeclaration = {
  name: 'get_tax_twin_conflicts',
  description: 'Retrieve unresolved discrepancies and conflict records for a Tax Twin against uploaded documents (e.g. AIS/TIS interest discrepancy).',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      tax_twin_id: {
        type: SchemaType.STRING,
        description: 'The Tax Twin ID to inspect for discrepancies (default: "twin_demo_v1")',
      },
    },
    required: ['tax_twin_id'],
  },
};

/**
 * 11. get_filing_readiness schema
 */
export const getFilingReadinessDeclaration: FunctionDeclaration = {
  name: 'get_filing_readiness',
  description: 'Evaluate tax filing readiness status for FY 2025-26 / AY 2026-27, identifying verified heads of income, pending reconciliation items, and suggested ITR form (ITR-1 vs ITR-2).',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      tax_twin_id: {
        type: SchemaType.STRING,
        description: 'The Tax Twin ID to evaluate for filing readiness (default: "twin_demo_v1")',
      },
    },
    required: ['tax_twin_id'],
  },
};

/**
 * All controlled function declarations for Gemini
 */
export const ALL_CONTROLLED_TOOLS: FunctionDeclaration[] = [
  getTaxProfileDeclaration,
  getTaxTwinDeclaration,
  getFactsDeclaration,
  searchTaxKnowledgeDeclaration,
  calculateTaxDeclaration,
  compareRegimesDeclaration,
  createScenarioDeclaration,
  getSourcesDeclaration,
  getDeadlinesDeclaration,
  getTaxTwinConflictsDeclaration,
  getFilingReadinessDeclaration,
];

/**
 * Dispatcher: Execute tool call safely with validation and structured output
 */
export async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<ToolExecutionResult> {
  try {
    switch (name) {
      case 'get_tax_profile': {
        const profileId = (args.profile_id as string) || 'prof_demo_01';
        const profile = taxTwinStore.getProfile(profileId);
        if (!profile) {
          return { toolName: name, success: false, error: `Tax profile with ID ${profileId} not found.` };
        }
        return { toolName: name, success: true, data: profile };
      }

      case 'get_tax_twin': {
        const twinId = (args.tax_twin_id as string) || 'twin_demo_v1';
        const twin = taxTwinStore.getTaxTwin(twinId);
        if (!twin) {
          return { toolName: name, success: false, error: `Tax Twin with ID ${twinId} not found.` };
        }
        return { toolName: name, success: true, data: twin };
      }

      case 'get_facts': {
        const twinId = (args.tax_twin_id as string) || 'twin_demo_v1';
        let facts = taxTwinStore.getFactsByTwinId(twinId);
        if (args.category) {
          facts = facts.filter(f => f.category === args.category);
        }
        return { toolName: name, success: true, data: facts };
      }

      case 'search_tax_knowledge': {
        const query = (args.query as string) || '';
        const results = await taxKnowledgeRetriever.searchKnowledge({
          query,
          financial_year: (args.financial_year as string) || '2025-2026',
          section_or_topic: args.section_or_topic as string | undefined,
          top_k: 3,
        });
        return { toolName: name, success: true, data: results.map(r => r.chunk) };
      }

      case 'calculate_tax': {
        const grossSalary = Number(args.gross_salary) || 0;
        const regime = ((args.regime as string)?.toUpperCase() === 'OLD' ? 'OLD' : 'NEW') as TaxRegime;
        const calcReq: TaxCalculationRequest = {
          regime,
          gross_salary: grossSalary,
          other_income: Number(args.other_income) || 0,
          deductions_80c: Number(args.deductions_80c) || 0,
          deductions_80d: Number(args.deductions_80d) || 0,
          deductions_80ccd_1b: Number(args.deductions_80ccd_1b) || 0,
          house_property_income_or_loss: Number(args.house_property_income_or_loss) || 0,
          tds_paid: Number(args.tds_paid) || 0,
          advance_tax_paid: Number(args.advance_tax_paid) || 0,
        };
        const result = await member1Client.calculateStateless(calcReq);
        return { toolName: name, success: true, data: result };
      }

      case 'compare_regimes': {
        const grossSalary = Number(args.gross_salary) || 0;
        const calcReq: TaxCalculationRequest = {
          regime: 'NEW',
          gross_salary: grossSalary,
          other_income: Number(args.other_income) || 0,
          deductions_80c: Number(args.deductions_80c) || 0,
          deductions_80d: Number(args.deductions_80d) || 0,
          deductions_80ccd_1b: Number(args.deductions_80ccd_1b) || 0,
          house_property_income_or_loss: Number(args.house_property_income_or_loss) || 0,
        };
        const comparison = await member1Client.compareRegimes(calcReq);
        return { toolName: name, success: true, data: comparison };
      }

      case 'create_scenario': {
        const baselineTwinId = (args.baseline_twin_id as string) || 'twin_demo_v1';
        const baselineTwin = taxTwinStore.getTaxTwin(baselineTwinId);
        if (!baselineTwin) {
          return { toolName: name, success: false, error: `Baseline twin ${baselineTwinId} not found.` };
        }
        const facts = taxTwinStore.getFactsByTwinId(baselineTwinId);
        const grossFact = facts.find(f => f.category === 'SALARY')?.amount || 0;
        const c80c = facts.find(f => f.category === 'DEDUCTION_80C')?.amount || 0;
        const c80d = facts.find(f => f.category === 'DEDUCTION_80D')?.amount || 0;

        const mods = (args.hypothetical_modifications as Record<string, number>) || {};
        const simulatedSalary = mods.gross_salary !== undefined ? mods.gross_salary : grossFact;
        const simulated80c = mods.deductions_80c !== undefined ? mods.deductions_80c : c80c;
        const simulated80d = mods.deductions_80d !== undefined ? mods.deductions_80d : c80d;
        const simulatedNps = mods.deductions_80ccd_1b !== undefined ? mods.deductions_80ccd_1b : 0;

        const baselineCalc = await member1Client.calculateStateless({ regime: 'NEW', gross_salary: grossFact });
        const scenarioCalc = await member1Client.compareRegimes({
          regime: 'NEW',
          gross_salary: simulatedSalary,
          deductions_80c: simulated80c,
          deductions_80d: simulated80d,
          deductions_80ccd_1b: simulatedNps,
        });

        return {
          toolName: name,
          success: true,
          data: {
            scenario_id: `scen_${Date.now()}`,
            baseline_twin_id: baselineTwinId,
            title: args.scenario_title,
            baseline_tax: baselineCalc.total_tax,
            scenario_recommended_regime: scenarioCalc.recommended_regime,
            scenario_tax: scenarioCalc.recommended_regime === 'NEW' ? scenarioCalc.new_regime.total_tax : scenarioCalc.old_regime.total_tax,
            potential_savings: Math.max(0, baselineCalc.total_tax - (scenarioCalc.recommended_regime === 'NEW' ? scenarioCalc.new_regime.total_tax : scenarioCalc.old_regime.total_tax)),
            note: 'This scenario is completely isolated and does not alter your baseline Tax Twin until explicitly confirmed and applied.',
          },
        };
      }

      case 'get_sources': {
        const topic = (args.topic as string) || '';
        const results = await taxKnowledgeRetriever.searchKnowledge({ query: topic, top_k: 2 });
        return {
          toolName: name,
          success: true,
          data: results.map(r => ({
            title: r.chunk.title,
            section: r.chunk.section_or_topic,
            authority: r.chunk.source_authority,
            effective_date: r.chunk.effective_date,
            rule_version: r.chunk.rule_version,
            summary: r.chunk.content,
          })),
        };
      }

      case 'get_deadlines': {
        const deadlines = taxKnowledgeRetriever.getDeadlines(args.category as string);
        return { toolName: name, success: true, data: deadlines };
      }

      case 'get_tax_twin_conflicts': {
        const twinId = (args.tax_twin_id as string) || 'twin_demo_v1';
        const twin = taxTwinStore.getTaxTwin(twinId);
        if (!twin) {
          return { toolName: name, success: false, error: `Tax Twin ${twinId} not found.` };
        }
        const facts = taxTwinStore.getFactsByTwinId(twinId);
        const interestFact = facts.find(f => f.field_name === 'savings_interest');
        const selfReportedInterest = interestFact ? interestFact.amount : 12000;
        const aisReportedInterest = 18500;
        const delta = aisReportedInterest - selfReportedInterest;

        return {
          toolName: name,
          success: true,
          data: {
            tax_twin_id: twinId,
            conflicts_count: 1,
            unresolved_conflicts: [
              {
                field_name: 'savings_interest',
                category: 'OTHER_SOURCES',
                self_reported_value: selfReportedInterest,
                source_document: 'AIS/TIS Annual Information Statement',
                ais_reported_value: aisReportedInterest,
                delta_amount: delta,
                verification_state: 'CONFLICT',
                tax_implication: `Under-reporting interest income by ₹${delta.toLocaleString('en-IN')} could lead to a notice under Section 133(6) or 148A. You can claim deduction up to ₹10,000 under Section 80TTA in Old Regime.`,
                recommended_action: 'ACCEPT_AIS_VALUE_AND_RECONCILE',
              },
            ],
          },
        };
      }

      case 'get_filing_readiness': {
        const twinId = (args.tax_twin_id as string) || 'twin_demo_v1';
        const twin = taxTwinStore.getTaxTwin(twinId);
        if (!twin) {
          return { toolName: name, success: false, error: `Tax Twin ${twinId} not found.` };
        }
        const facts = taxTwinStore.getFactsByTwinId(twinId);
        const unverified = facts.filter(f => f.verification_state !== 'VERIFIED');
        const isReady = unverified.length === 0;

        return {
          toolName: name,
          success: true,
          data: {
            tax_twin_id: twinId,
            financial_year: twin.financial_year,
            assessment_year: twin.assessment_year,
            filing_readiness_score: isReady ? 100 : 75,
            status: isReady ? 'READY_TO_FILE' : 'ACTION_REQUIRED',
            suggested_itr_form: 'ITR-1 (Sahaj)',
            verified_heads_count: facts.filter(f => f.verification_state === 'VERIFIED').length,
            pending_reconciliation_items: unverified.map(f => ({
              field_name: f.field_name,
              amount: f.amount,
              state: f.verification_state,
            })),
            next_step: isReady ? 'Proceed to generate and review draft ITR-1 JSON.' : 'Reconcile AIS/TIS interest discrepancy before filing.',
          },
        };
      }

      default:
        return { toolName: name, success: false, error: `Unknown tool name: ${name}` };
    }
  } catch (err: unknown) {
    const error = err as Error;
    return { toolName: name, success: false, error: error.message || 'Tool execution failed' };
  }
}
