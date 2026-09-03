export interface TaxDeadlineItem {
  id: string;
  title: string;
  due_date: string; // e.g. "2026-07-31"
  category: "FILING" | "ADVANCE_TAX" | "TAX_AUDIT";
  days_remaining: number;
  status: "UPCOMING" | "URGENT" | "PASSED";
}
import {
  TaxProfile,
  TaxTwin,
  FinancialFact,
  TaxpayerCategory,
} from "@/types/schema";
import {
  RegimeComparisonResult,
  WhatIfScenarioInput,
  WhatIfScenarioResult,
  DocumentUploadResponse,
  ReconciliationRecord,
  ActionPlanItem,
  AIChatMessage,
} from "@/types/tax";

export interface OnboardingPayload {
  category: TaxpayerCategory;
  residency_status: "RESIDENT" | "NON_RESIDENT" | "RESIDENT_NOT_ORDINARY";
  age_category: "BELOW_60" | "SENIOR_60_TO_80" | "SUPER_SENIOR_ABOVE_80";
  pan_masked?: string;
  gross_salary: number;
  other_income: number;
  deduction_80c?: number;
  deduction_80d?: number;
  deduction_24b?: number;
  deduction_80ccd_nps?: number;
}

export interface TaxCopilotApiClient {
  getTaxProfile(): Promise<TaxProfile>;
  getTaxTwins(): Promise<TaxTwin[]>;
  getTaxTwin(id: string): Promise<{ twin: TaxTwin; facts: FinancialFact[] }>;
  initializeTaxTwin(payload: OnboardingPayload): Promise<{ twin: TaxTwin; facts: FinancialFact[] }>;
  calculateStateless(facts: Partial<FinancialFact>[]): Promise<RegimeComparisonResult>;
  calculateTwin(twinId: string): Promise<RegimeComparisonResult>;
  compareRegimes(twinId: string): Promise<RegimeComparisonResult>;
  getWhatIfScenarios(twinId: string): Promise<WhatIfScenarioResult[]>;
  runWhatIfSimulation(input: WhatIfScenarioInput): Promise<WhatIfScenarioResult>;
  applyWhatIfScenario(scenarioId: string): Promise<{ new_twin: TaxTwin; message: string }>;
  getDocuments(): Promise<DocumentUploadResponse[]>;
  uploadDocument(formData: FormData): Promise<DocumentUploadResponse>;
  getReconciliationRecords(twinId: string): Promise<ReconciliationRecord[]>;
  confirmReconciliation(updates: { fact_id: string; confirmed_value: number }[]): Promise<{ new_twin: TaxTwin; message: string }>;
  getActionPlan(): Promise<ActionPlanItem[]>;
  getDeadlines(): Promise<TaxDeadlineItem[]>;
  sendAIChat(messages: { role: "user" | "assistant"; content: string }[]): Promise<AIChatMessage>;
  getHealth(): Promise<{ status: string; rule_version: string; timestamp: string }>;
}