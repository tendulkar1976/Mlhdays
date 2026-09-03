import { z } from 'zod';

export enum TaxRegime {
  NEW = 'NEW',
  OLD = 'OLD',
}

export enum VerificationState {
  VERIFIED = 'VERIFIED',
  NEEDS_CONFIRMATION = 'NEEDS_CONFIRMATION',
  CONFLICT = 'CONFLICT',
  EXPERT_REVIEW = 'EXPERT_REVIEW',
}

export enum IncomeCategory {
  SALARY = 'SALARY',
  HOUSE_PROPERTY = 'HOUSE_PROPERTY',
  CAPITAL_GAINS = 'CAPITAL_GAINS',
  BUSINESS_PROFESSION = 'BUSINESS_PROFESSION',
  OTHER_SOURCES = 'OTHER_SOURCES',
}

// Zod schema for single income source entry
export const IncomeSourceInputSchema = z.object({
  category: z.nativeEnum(IncomeCategory),
  employerOrPayer: z.string().optional(),
  tanNumber: z.string().optional(),
  grossAmount: z.number().nonnegative(),
  taxDeductedAtSource: z.number().nonnegative().optional().default(0),
  metadata: z.record(z.any()).optional(),
});

export type IncomeSourceInput = z.infer<typeof IncomeSourceInputSchema>;

// Zod schema for deductions (Chapter VI-A, Sec 24b, etc.)
export const DeductionsInputSchema = z.object({
  section80C: z.number().nonnegative().optional().default(0),      // Max 1.5L in Old Regime
  section80D: z.number().nonnegative().optional().default(0),      // Health Insurance
  section80CCD1B: z.number().nonnegative().optional().default(0),  // Additional NPS up to 50k
  section80CCD2: z.number().nonnegative().optional().default(0),    // Employer NPS (allowed in both)
  section80E: z.number().nonnegative().optional().default(0),      // Education Loan Interest
  section80G: z.number().nonnegative().optional().default(0),      // Donations
  section80TTA_TTB: z.number().nonnegative().optional().default(0),// Savings Interest
  section24b: z.number().nonnegative().optional().default(0),      // Home Loan Interest on SOP (Old regime max 2L)
  hraExemption: z.number().nonnegative().optional().default(0),    // HRA Exemption Sec 10(13A)
  otherExemptions: z.number().nonnegative().optional().default(0), // Other LTA/allowances
});

export type DeductionsInput = z.infer<typeof DeductionsInputSchema>;

// Stateless calculation request payload schema
export const StatelessCalculationRequestSchema = z.object({
  financialYear: z.string().default('2025-2026'),
  assessmentYear: z.string().default('2026-2027'),
  regimePreference: z.enum(['NEW', 'OLD', 'COMPARE']).default('COMPARE'),
  incomeSources: z.array(IncomeSourceInputSchema).min(1, 'At least one income source is required'),
  deductions: DeductionsInputSchema.optional().default({}),
  age: z.number().int().min(18).max(120).optional().default(30), // For Old Regime senior citizen slabs
  isResident: z.boolean().optional().default(true),
});

export type StatelessCalculationRequest = z.infer<typeof StatelessCalculationRequestSchema>;

// Detailed calculation trace item
export interface CalculationTraceStep {
  step: number;
  title: string;
  description: string;
  amount: number;
  formula?: string;
  notes?: string;
}

// Single regime calculation result
export interface RegimeCalculationResult {
  regime: TaxRegime;
  ruleVersion: string;
  financialYear: string;
  assessmentYear: string;
  grossTotalIncome: number;
  standardDeduction: number;
  totalExemptionsAndDeductions: number;
  netTaxableIncome: number;
  taxOnSlabs: number;
  rebate87A: number;
  taxAfterRebate: number;
  surcharge: number;
  marginalRelief: number;
  cess: number;
  totalTaxLiability: number;
  effectiveTaxRatePercentage: number;
  assumptions: string[];
  warnings: string[];
  calculationTrace: CalculationTraceStep[];
}

// Shared calculation response
export interface CalculationResponse {
  calculationId: string;
  taxTwinId?: string | null;
  taxPeriod: {
    financialYear: string;
    assessmentYear: string;
  };
  ruleVersion: string;
  activeRegime: TaxRegime;
  result: RegimeCalculationResult;
  comparison?: {
    recommendedRegime: TaxRegime;
    taxDifference: number; // Positive = New regime saves this much compared to Old; negative = Old saves
    oldRegime: RegimeCalculationResult;
    newRegime: RegimeCalculationResult;
    summary: string;
  };
  timestamp: string;
}
