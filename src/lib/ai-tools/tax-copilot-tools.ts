import { calculateRegimeTax } from '../tax-engine/calculator';
import { compareTaxRegimes } from '../tax-engine/comparator';
import { getStatutoryRules } from '../tax-rules/registry';
import { IncomeCategory, TaxRegime, StatelessCalculationRequest } from '../types';

/**
 * Gemini Function Calling Tool Definitions and Executable Handlers
 * for Member 2 (Gemini AI, RAG & Document Intelligence).
 */

export const TaxCopilotToolDeclarations = [
  {
    name: 'calculate_tax_stateless',
    description: 'Calculate Indian income tax deterministically under New or Old tax regime with full breakdown and trace.',
    parameters: {
      type: 'OBJECT',
      properties: {
        financialYear: { type: 'STRING', description: 'e.g. "2025-2026"' },
        regimePreference: { type: 'STRING', enum: ['NEW', 'OLD', 'COMPARE'] },
        grossSalary: { type: 'NUMBER', description: 'Gross annual salary income in INR' },
        otherIncome: { type: 'NUMBER', description: 'Income from other sources (interest, etc.) in INR' },
        section80C: { type: 'NUMBER', description: 'Section 80C investments in INR (PF, PPF, ELSS)' },
        section80D: { type: 'NUMBER', description: 'Section 80D health insurance premium in INR' },
        hraExemption: { type: 'NUMBER', description: 'HRA exemption in INR' },
        homeLoanInterest: { type: 'NUMBER', description: 'Section 24(b) home loan interest in INR' },
      },
      required: ['grossSalary'],
    },
  },
  {
    name: 'get_statutory_tax_slabs',
    description: 'Retrieve official statutory tax slabs and Section 87A rebate rules for a given Financial Year.',
    parameters: {
      type: 'OBJECT',
      properties: {
        financialYear: { type: 'STRING', description: 'e.g. "2025-2026"' },
      },
      required: ['financialYear'],
    },
  },
];

/**
 * Tool Execution Router for Gemini Agent
 */
export async function executeTaxCopilotTool(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'calculate_tax_stateless': {
      const incomeSources = [
        {
          category: IncomeCategory.SALARY,
          grossAmount: Number(args.grossSalary || 0),
        },
      ];
      if (args.otherIncome && args.otherIncome > 0) {
        incomeSources.push({
          category: IncomeCategory.OTHER_SOURCES,
          grossAmount: Number(args.otherIncome),
        });
      }

      const deductions = {
        section80C: Number(args.section80C || 0),
        section80D: Number(args.section80D || 0),
        hraExemption: Number(args.hraExemption || 0),
        section24b: Number(args.homeLoanInterest || 0),
      };

      const comparison = compareTaxRegimes(
        incomeSources,
        deductions,
        30,
        true,
        args.financialYear || '2025-2026'
      );

      return {
        summary: comparison.summary,
        recommendation: comparison.recommendationDetails,
        recommendedRegime: comparison.recommendedRegime,
        taxDifference: comparison.taxDifference,
        newRegime: {
          grossIncome: comparison.newRegime.grossTotalIncome,
          taxableIncome: comparison.newRegime.netTaxableIncome,
          taxLiability: comparison.newRegime.totalTaxLiability,
          standardDeduction: comparison.newRegime.standardDeduction,
          rebate87A: comparison.newRegime.rebate87A,
        },
        oldRegime: {
          grossIncome: comparison.oldRegime.grossTotalIncome,
          taxableIncome: comparison.oldRegime.netTaxableIncome,
          taxLiability: comparison.oldRegime.totalTaxLiability,
          totalDeductions: comparison.oldRegime.totalExemptionsAndDeductions,
        },
      };
    }

    case 'get_statutory_tax_slabs': {
      const rules = getStatutoryRules(args.financialYear || '2025-2026');
      return {
        ruleVersion: rules.ruleVersion,
        financialYear: rules.financialYear,
        assessmentYear: rules.assessmentYear,
        newRegime: rules.newRegime,
        oldRegimeSlabs: rules.oldRegime.slabsGeneral,
        rebate87A: rules.newRegime.rebate87A,
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
