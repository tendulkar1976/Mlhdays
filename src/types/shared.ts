/**
 * Shared Type Definitions & Contracts for AI Tax Copilot
 * Authoritative Source of Truth: SHARED_CONTRACTS.md, SCHEMA.md, TRD.md
 */

export type VerificationState = 'VERIFIED' | 'NEEDS_CONFIRMATION' | 'CONFLICT' | 'EXPERT_REVIEW';

export type TaxRegime = 'OLD' | 'NEW';

export type ResidentStatus = 'RESIDENT' | 'NON_RESIDENT' | 'RESIDENT_BUT_NOT_ORDINARY';

export interface TaxPeriod {
  financial_year: string; // e.g. "2025-2026"
  assessment_year: string; // e.g. "2026-2027"
}

export interface TaxProfile {
  id: string;
  user_id: string;
  pan_masked?: string; // e.g. "ABCDE****F"
  full_name: string;
  date_of_birth?: string;
  age_category: 'GENERAL' | 'SENIOR' | 'SUPER_SENIOR';
  residency_status: ResidentStatus;
  preferred_regime?: TaxRegime;
  created_at: string;
  updated_at: string;
}

export interface TaxTwin {
  id: string;
  tax_profile_id: string;
  version: number;
  financial_year: string;
  assessment_year: string;
  is_baseline: boolean;
  created_at: string;
  created_by: 'USER' | 'SYSTEM_RECONCILIATION' | 'SCENARIO_APPLY' | 'DOCUMENT_EXTRACT';
  notes?: string;
}

export interface FinancialFact {
  id: string;
  tax_twin_id: string; // Critical invariant: facts.tax_twin_id -> tax_twins.id
  category: 'SALARY' | 'HOUSE_PROPERTY' | 'CAPITAL_GAINS' | 'OTHER_SOURCES' | 'BUSINESS' | 'DEDUCTION_80C' | 'DEDUCTION_80D' | 'DEDUCTION_80CCD' | 'OTHER_DEDUCTION' | 'TDS' | 'ADVANCE_TAX';
  field_name: string;
  amount: number;
  verification_state: VerificationState;
  source_document_id?: string;
  confidence_score?: number; // 0.0 to 1.0
  notes?: string;
}

export interface IncomeSource {
  id: string;
  tax_twin_id: string; // Critical invariant
  source_type: 'SALARY' | 'RENTAL' | 'INTEREST_SAVINGS' | 'INTEREST_FD' | 'DIVIDEND' | 'CAPITAL_GAINS_STCG' | 'CAPITAL_GAINS_LTCG' | 'FREELANCE';
  payer_name?: string;
  gross_amount: number;
  exemptions_amount: number;
  net_amount: number;
  tds_deducted: number;
}

export interface TransactionRecord {
  id: string;
  tax_twin_id: string; // Critical invariant
  transaction_date: string;
  description: string;
  amount: number;
  category: string;
  is_tax_deductible: boolean;
  deduction_section?: string;
}

export interface ExtractedField<T = string | number> {
  field_name: string;
  value: T;
  raw_text?: string;
  confidence: number; // 0.0 to 1.0
  verification_state: VerificationState;
  source_box_or_section?: string;
  needs_user_review: boolean;
}

export interface Form16Extraction {
  document_id: string;
  assessment_year: ExtractedField<string>;
  financial_year: ExtractedField<string>;
  employer_name: ExtractedField<string>;
  employer_tan: ExtractedField<string>;
  employer_pan: ExtractedField<string>;
  employee_pan: ExtractedField<string>;
  employee_name: ExtractedField<string>;
  gross_salary: ExtractedField<number>;
  exemptions_under_section_10: ExtractedField<number>;
  standard_deduction_16ia: ExtractedField<number>;
  professional_tax_16iii: ExtractedField<number>;
  income_chargeable_salaries: ExtractedField<number>;
  deductions_chapter_via: {
    section_80c?: ExtractedField<number>;
    section_80ccc?: ExtractedField<number>;
    section_80ccd_1?: ExtractedField<number>;
    section_80ccd_1b?: ExtractedField<number>;
    section_80ccd_2?: ExtractedField<number>;
    section_80d?: ExtractedField<number>;
    section_80e?: ExtractedField<number>;
    section_80g?: ExtractedField<number>;
    section_80tta?: ExtractedField<number>;
    other_deductions?: ExtractedField<number>;
    total_deductions: ExtractedField<number>;
  };
  total_taxable_income: ExtractedField<number>;
  tax_payable: ExtractedField<number>;
  rebate_87a: ExtractedField<number>;
  surcharge: ExtractedField<number>;
  health_and_education_cess: ExtractedField<number>;
  total_tax_due: ExtractedField<number>;
  tds_deducted: ExtractedField<number>;
  overall_extraction_confidence: number;
  requires_expert_review: boolean;
  fields_needing_confirmation: string[];
}

export interface TaxCalculationRequest {
  tax_twin_id?: string;
  tax_period?: TaxPeriod;
  regime: TaxRegime;
  gross_salary: number;
  exemptions_sec_10?: number;
  standard_deduction?: number;
  house_property_income_or_loss?: number; // up to -2,00,000 for self-occupied in Old Regime
  other_income?: number; // savings bank interest, FD, etc.
  deductions_80c?: number; // max 1,50,000
  deductions_80d?: number; // health insurance
  deductions_80ccd_1b?: number; // NPS additional max 50,000
  deductions_80ccd_2?: number; // Employer NPS
  deductions_80tta?: number; // max 10,000
  other_chapter_via_deductions?: number;
  tds_paid?: number;
  advance_tax_paid?: number;
  age_category?: 'GENERAL' | 'SENIOR' | 'SUPER_SENIOR';
}

export interface TaxSlabBreakdown {
  slab_range: string;
  rate_percent: number;
  taxable_amount_in_slab: number;
  tax_in_slab: number;
}

export interface TaxCalculationResult {
  calculation_id: string;
  tax_twin_id?: string;
  tax_period: TaxPeriod;
  regime: TaxRegime;
  rule_version: string;
  gross_total_income: number;
  total_exemptions_deductions: number;
  taxable_income: number;
  tax_before_rebate: number;
  rebate_87a: number;
  tax_after_rebate: number;
  surcharge: number;
  cess: number; // 4% Health & Education Cess
  total_tax: number;
  tds_and_advance_tax_credits: number;
  net_tax_payable_or_refundable: number; // Positive = Payable, Negative = Refundable
  slab_breakdown: TaxSlabBreakdown[];
  assumptions: string[];
  warnings: string[];
  calculation_trace: {
    step: string;
    description: string;
    computed_value: number | string;
  }[];
}

export interface RegimeComparisonResult {
  comparison_id: string;
  tax_twin_id?: string;
  tax_period: TaxPeriod;
  rule_version: string;
  old_regime: TaxCalculationResult;
  new_regime: TaxCalculationResult;
  recommended_regime: TaxRegime;
  tax_savings: number; // difference in tax
  key_factors: string[];
  explanation: string;
}

export interface TaxKnowledgeChunk {
  id: string;
  title: string;
  section_or_topic: string;
  financial_year: string;
  assessment_year: string;
  effective_date: string;
  rule_version: string;
  source_authority: string; // e.g. "Income Tax Department", "Finance Act 2025", "CBDT Circular"
  source_url?: string;
  content: string;
  keywords: string[];
  embedding?: number[];
}

export interface TaxKnowledgeSearchFilter {
  query: string;
  financial_year?: string;
  assessment_year?: string;
  section_or_topic?: string;
  top_k?: number;
}

export interface ReconciliationDiscrepancy {
  field_name: string;
  twin_fact_id?: string;
  current_twin_value?: number | string;
  extracted_doc_value?: number | string;
  source_document_id: string;
  difference_amount?: number;
  confidence: number;
  verification_state: VerificationState;
  explanation: string;
  recommended_action: 'ACCEPT_DOCUMENT_VALUE' | 'KEEP_TWIN_VALUE' | 'USER_MANUAL_INPUT' | 'REQUEST_EXPERT_REVIEW';
}

export interface ReconciliationResult {
  tax_twin_id: string;
  document_id: string;
  total_fields_checked: number;
  matched_count: number;
  discrepancies: ReconciliationDiscrepancy[];
  requires_user_confirmation: boolean;
  can_auto_reconcile: boolean;
  proposed_new_twin_version?: number;
}

export interface StatutoryDeadline {
  id: string;
  category: 'ITR_FILING' | 'ADVANCE_TAX' | 'TAX_AUDIT' | 'TDS_RETURN' | 'BELATED_REVISED_RETURN';
  financial_year: string;
  assessment_year: string;
  due_date: string;
  applicable_to: string;
  description: string;
  consequences_of_delay: string;
  source_authority: string;
}

export interface AIOrchestrationTrace {
  trace_id: string;
  timestamp: string;
  latency_ms: number;
  model_used: string;
  tools_invoked: {
    tool_name: string;
    arguments: Record<string, unknown>;
    execution_status: 'SUCCESS' | 'ERROR';
    result_summary?: string;
  }[];
  prompt_tokens?: number;
  response_tokens?: number;
  safety_flags_triggered?: string[];
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface ToolExecutionRecord {
  tool_name: string;
  arguments: Record<string, unknown>;
  execution_status: 'SUCCESS' | 'ERROR';
  result?: unknown;
  result_summary?: string;
}

export interface AIChatResponse {
  id: string; // Frontend contract: id
  role: 'assistant'; // Frontend contract: role
  content: string; // Frontend contract: content
  response_id: string; // Backward compatibility
  message: string; // Backward compatibility
  tools_called: string[];
  tool_execution?: ToolExecutionRecord[]; // Frontend contract: tool_execution
  citations: {
    title: string;
    section: string;
    source: string;
    rule_version: string;
  }[];
  disclaimer: string;
  trace: AIOrchestrationTrace;
}
