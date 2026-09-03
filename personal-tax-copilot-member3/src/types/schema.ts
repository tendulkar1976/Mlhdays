/**
 * SCHEMA.md and SHARED_CONTRACTS.md direct TypeScript representations.
 * Maintains strict compliance with the shared team specifications.
 */

export type VerificationState =
  | "VERIFIED"
  | "NEEDS_CONFIRMATION"
  | "CONFLICT"
  | "EXPERT_REVIEW";

export type TaxRegime = "NEW" | "OLD";

export type TaxpayerCategory =
  | "SALARIED"
  | "FREELANCER_CONSULTANT"
  | "INVESTOR"
  | "STUDENT_FIRST_TIME"
  | "BUSINESS";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_masked?: string;
  created_at: string;
}

export interface TaxProfile {
  id: string;
  user_id: string;
  full_name?: string;
  category: TaxpayerCategory;
  pan_masked: string;
  residency_status: "RESIDENT" | "NON_RESIDENT" | "RESIDENT_NOT_ORDINARY";
  age_category: "BELOW_60" | "SENIOR_60_TO_80" | "SUPER_SENIOR_ABOVE_80";
  created_at: string;
  updated_at: string;
}

export interface TaxTwin {
  id: string;
  tax_profile_id: string;
  version: number; // v1, v2, v3...
  is_active_baseline: boolean;
  notes?: string;
  created_at: string;
  hash?: string; // immutability proof/hash
}

export type FactCategory =
  | "INCOME_SALARY"
  | "INCOME_HOUSE_PROPERTY"
  | "INCOME_CAPITAL_GAINS"
  | "INCOME_OTHER"
  | "DEDUCTION_80C"
  | "DEDUCTION_80D"
  | "DEDUCTION_80CCD_NPS"
  | "DEDUCTION_24B_HOME_LOAN"
  | "DEDUCTION_OTHER"
  | "TAX_CREDIT_TDS"
  | "TAX_CREDIT_ADVANCE_TAX";

export interface FinancialFact {
  id: string;
  tax_twin_id: string; // Critical invariant: attached to immutable Tax Twin
  category: FactCategory;
  field_name: string;
  display_label: string;
  amount: number;
  verification_state: VerificationState;
  confidence: number; // 0.0 - 1.0 (e.g. 0.98 = 98%)
  source_document?: string;
  notes?: string;
  created_at: string;
}
