export interface TaxDeadlineItem {
  id: string;
  title: string;
  due_date: string;
  category: "FILING" | "ADVANCE_TAX" | "TAX_AUDIT";
  days_remaining: number;
  status: "UPCOMING" | "URGENT" | "PASSED";
}

import { TaxTwin, FinancialFact, VerificationState, TaxRegime } from "./schema";

export interface TaxSlabBracket {
  slab_index: number;
  from_amount: number;
  to_amount: number | null; // null represents above threshold (e.g. above 24L)
  rate_percent: number;
  taxable_amount_in_slab: number;
  tax_amount_in_slab: number;
}

export interface CalculationTraceStep {
  step: number;
  section_or_rule: string;
  label: string;
  amount: number;
  running_balance: number;
  explanation: string;
}

/**
 * Shared calculation response contract matching TRD.md and SHARED_CONTRACTS.md:
 * calculation_id, tax_twin_id, tax_period, rule_version, taxable_income,
 * tax_before_rebate, rebate, surcharge, cess, total_tax, assumptions, warnings, calculation_trace
 */
export interface TaxCalculationResult {
  calculation_id: string;
  tax_twin_id: string;
  tax_period: string; // e.g. "FY 2025-26"
  assessment_year: string; // e.g. "AY 2026-27"
  rule_version: string; // e.g. "IN-ITD-2025.26-V1.0"
  regime: TaxRegime;
  gross_total_income: number;
  deductions_total: number;
  standard_deduction: number;
  taxable_income: number;
  tax_before_rebate: number;
  rebate: number; // Section 87A rebate
  tax_after_rebate: number;
  surcharge: number;
  cess: number; // Health & Education cess @ 4%
  total_tax: number;
  effective_tax_rate_percent: number;
  slabs: TaxSlabBracket[];
  assumptions: string[];
  warnings: string[];
  calculation_trace: CalculationTraceStep[];
  created_at: string;
}

export interface RegimeComparisonResult {
  tax_period: string;
  assessment_year: string;
  rule_version: string;
  new_regime: TaxCalculationResult;
  old_regime: TaxCalculationResult;
  difference: number; // positive = old regime tax is higher; negative = new regime higher
  recommended_regime: "NEW" | "OLD" | "EQUAL";
  recommendation_rationale: string;
  net_tax_benefit_amount: number;
}

export interface WhatIfScenarioInput {
  scenario_name: string;
  baseline_twin_id: string;
  description: string;
  proposed_modifications: {
    category: string;
    field_name: string;
    display_label: string;
    delta_amount: number;
  }[];
}

export interface WhatIfScenarioResult {
  scenario_id: string;
  baseline_twin_id: string;
  name: string;
  description: string;
  proposed_modifications: {
    category: string;
    field_name: string;
    display_label: string;
    original_amount: number;
    proposed_amount: number;
    delta_amount: number;
  }[];
  baseline_calculation: RegimeComparisonResult;
  simulated_calculation: RegimeComparisonResult;
  net_tax_delta: number; // negative number means tax reduced (savings)
  is_applied: boolean;
  created_at: string;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  document_type: "FORM_16" | "ANNUAL_INFORMATION_STATEMENT" | "FORM_26AS" | "RENT_RECEIPT" | "OTHER";
  status: "PROCESSING" | "EXTRACTED" | "FAILED";
  extracted_facts_count: number;
  extracted_items: {
    field_name: string;
    display_label: string;
    extracted_amount: number;
    confidence: number; // 0.0 to 1.0
    suggested_state: VerificationState;
    provenance_box_or_section?: string;
  }[];
}

export interface ReconciliationRecord {
  id: string;
  fact_id: string;
  field_label: string;
  existing_twin_value: number;
  document_extracted_value: number;
  delta_amount: number;
  confidence: number;
  verification_state: VerificationState;
  source_document_title: string;
  conflict_explanation?: string;
}

export interface ActionPlanItem {
  id: string;
  title: string;
  description: string;
  category: "VERIFICATION" | "SAVINGS" | "FILING" | "COMPLIANCE";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  potential_savings_inr?: number;
  deadline?: string;
  statutory_reference?: string;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  tool_execution?: {
    tool_name: string;
    status: "executing" | "completed";
    summary: string;
  };
  citations?: {
    source_title: string;
    section?: string;
    url?: string;
  }[];
}
