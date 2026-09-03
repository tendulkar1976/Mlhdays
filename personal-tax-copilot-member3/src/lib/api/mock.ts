import { TaxCopilotApiClient, OnboardingPayload } from "./types";
import { TaxProfile, TaxTwin, FinancialFact } from "@/types/schema";
import {
  RegimeComparisonResult,
  WhatIfScenarioInput,
  WhatIfScenarioResult,
  DocumentUploadResponse,
  ReconciliationRecord,
  ActionPlanItem,
  AIChatMessage,
  TaxDeadlineItem,
} from "@/types/tax";

let MOCK_FACTS_V1: FinancialFact[] = [
  {
    id: "fact_v1_01",
    tax_twin_id: "twin_v1",
    category: "INCOME_SALARY",
    field_name: "gross_salary",
    display_label: "Gross Salary (Sec 17(1))",
    amount: 1450000,
    verification_state: "NEEDS_CONFIRMATION",
    confidence: 0.85,
    source_document: "Self-declared during Onboarding",
    created_at: "2026-04-01T10:30:00Z",
  },
  {
    id: "fact_v1_02",
    tax_twin_id: "twin_v1",
    category: "INCOME_OTHER",
    field_name: "savings_bank_interest",
    display_label: "Savings Bank Interest",
    amount: 12000,
    verification_state: "NEEDS_CONFIRMATION",
    confidence: 0.85,
    source_document: "Self-declared during Onboarding",
    created_at: "2026-04-01T10:30:00Z",
  },
  {
    id: "fact_v1_03",
    tax_twin_id: "twin_v1",
    category: "DEDUCTION_80C",
    field_name: "provident_fund_and_elss",
    display_label: "Section 80C Deductions",
    amount: 150000,
    verification_state: "NEEDS_CONFIRMATION",
    confidence: 0.80,
    source_document: "Self-declared during Onboarding",
    created_at: "2026-04-01T10:30:00Z",
  },
  {
    id: "fact_v1_04",
    tax_twin_id: "twin_v1",
    category: "DEDUCTION_80D",
    field_name: "mediclaim_self_family",
    display_label: "Section 80D Health Insurance",
    amount: 25000,
    verification_state: "NEEDS_CONFIRMATION",
    confidence: 0.80,
    source_document: "Self-declared during Onboarding",
    created_at: "2026-04-01T10:30:00Z",
  },
];

const MOCK_PROFILE: TaxProfile = {
  id: "prof_in_001",
  user_id: "usr_taxpayer_01",
  full_name: "Aditya Sharma",
  category: "SALARIED",
  pan_masked: "ABCDE••••F",
  residency_status: "RESIDENT",
  age_category: "BELOW_60",
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-15T12:30:00Z",
};

let MOCK_TWINS: TaxTwin[] = [
  {
    id: "twin_v1",
    tax_profile_id: "prof_in_001",
    version: 1,
    is_active_baseline: false,
    notes: "Initial progressive onboarding snapshot",
    created_at: "2026-04-01T10:30:00Z",
    hash: "0x9f83...a1b2",
  },
  {
    id: "twin_v2",
    tax_profile_id: "prof_in_001",
    version: 2,
    is_active_baseline: true,
    notes: "Updated with verified Form 16 & AIS reconciliation",
    created_at: "2026-05-12T14:15:00Z",
    hash: "0x4e71...c3d4",
  },
];

let MOCK_FACTS: FinancialFact[] = [
  {
    id: "fact_01",
    tax_twin_id: "twin_v2",
    category: "INCOME_SALARY",
    field_name: "gross_salary",
    display_label: "Gross Salary (Sec 17(1))",
    amount: 1450000,
    verification_state: "VERIFIED",
    confidence: 0.99,
    source_document: "Form 16 Part B (Employer Ltd)",
    created_at: "2026-05-12T14:15:00Z",
  },
  {
    id: "fact_02",
    tax_twin_id: "twin_v2",
    category: "INCOME_OTHER",
    field_name: "savings_bank_interest",
    display_label: "Savings Bank Interest",
    amount: 18500,
    verification_state: "VERIFIED",
    confidence: 0.96,
    source_document: "AIS / TIS (State Bank of India)",
    created_at: "2026-05-12T14:15:00Z",
  },
  {
    id: "fact_03",
    tax_twin_id: "twin_v2",
    category: "DEDUCTION_80C",
    field_name: "provident_fund_and_elss",
    display_label: "EPF & Tax Saving ELSS",
    amount: 150000,
    verification_state: "VERIFIED",
    confidence: 0.95,
    source_document: "Form 16 & Mutual Fund CAMS Statement",
    created_at: "2026-05-12T14:15:00Z",
  },
  {
    id: "fact_04",
    tax_twin_id: "twin_v2",
    category: "DEDUCTION_80D",
    field_name: "mediclaim_self_family",
    display_label: "Medical Insurance (80D)",
    amount: 25000,
    verification_state: "NEEDS_CONFIRMATION",
    confidence: 0.78,
    source_document: "Policy Receipt Uploaded",
    notes: "Requires confirmation of premium payment mode (non-cash)",
    created_at: "2026-05-12T14:15:00Z",
  },
  {
    id: "fact_05",
    tax_twin_id: "twin_v2",
    category: "INCOME_HOUSE_PROPERTY",
    field_name: "home_loan_interest_self_occupied",
    display_label: "Home Loan Interest (Sec 24b)",
    amount: 200000,
    verification_state: "NEEDS_CONFIRMATION",
    confidence: 0.82,
    source_document: "Provisional Home Loan Certificate",
    created_at: "2026-05-12T14:15:00Z",
  },
  {
    id: "fact_06",
    tax_twin_id: "twin_v2",
    category: "TAX_CREDIT_TDS",
    field_name: "tds_salary",
    display_label: "TDS Deducted by Employer (26AS)",
    amount: 85000,
    verification_state: "VERIFIED",
    confidence: 0.99,
    source_document: "Form 26AS / AIS",
    created_at: "2026-05-12T14:15:00Z",
  },
];

const MOCK_REGIME_COMPARISON: RegimeComparisonResult = {
  tax_period: "FY 2025-26",
  assessment_year: "AY 2026-27",
  rule_version: "IN-ITD-2025.26-V1.0",
  new_regime: {
    calculation_id: "calc_new_202526_01",
    tax_twin_id: "twin_v2",
    tax_period: "FY 2025-26",
    assessment_year: "AY 2026-27",
    rule_version: "IN-ITD-2025.26-V1.0",
    regime: "NEW",
    gross_total_income: 1468500,
    deductions_total: 75000,
    standard_deduction: 75000,
    taxable_income: 1393500,
    tax_before_rebate: 99025,
    rebate: 0,
    tax_after_rebate: 99025,
    surcharge: 0,
    cess: 3961,
    total_tax: 102986,
    effective_tax_rate_percent: 7.01,
    slabs: [
      { slab_index: 1, from_amount: 0, to_amount: 400000, rate_percent: 0, taxable_amount_in_slab: 400000, tax_amount_in_slab: 0 },
      { slab_index: 2, from_amount: 400000, to_amount: 800000, rate_percent: 5, taxable_amount_in_slab: 400000, tax_amount_in_slab: 20000 },
      { slab_index: 3, from_amount: 800000, to_amount: 1200000, rate_percent: 10, taxable_amount_in_slab: 400000, tax_amount_in_slab: 40000 },
      { slab_index: 4, from_amount: 1200000, to_amount: 1600000, rate_percent: 15, taxable_amount_in_slab: 193500, tax_amount_in_slab: 29025 },
      { slab_index: 5, from_amount: 1600000, to_amount: 2000000, rate_percent: 20, taxable_amount_in_slab: 0, tax_amount_in_slab: 0 },
      { slab_index: 6, from_amount: 2000000, to_amount: 2400000, rate_percent: 25, taxable_amount_in_slab: 0, tax_amount_in_slab: 0 },
      { slab_index: 7, from_amount: 2400000, to_amount: null, rate_percent: 30, taxable_amount_in_slab: 0, tax_amount_in_slab: 0 },
    ],
    assumptions: [
      "Standard deduction of ₹75,000 claimed under Sec 16(ia) in New Regime",
      "No Chapter VI-A deductions (80C, 80D, 24b) eligible under Sec 115BAC",
    ],
    warnings: [
      "Total taxable income is ₹13,93,500, which exceeds the ₹12,00,000 threshold for Sec 87A rebate.",
    ],
    calculation_trace: [
      { step: 1, section_or_rule: "Sec 17(1)", label: "Gross Salary & Other Income", amount: 1468500, running_balance: 1468500, explanation: "Consolidated salary and savings interest facts" },
      { step: 2, section_or_rule: "Sec 16(ia)", label: "Standard Deduction (New Regime)", amount: -75000, running_balance: 1393500, explanation: "Statutory baseline standard deduction for salaried individuals" },
      { step: 3, section_or_rule: "Sec 115BAC(1A)", label: "Slab Tax Computation", amount: 99025, running_balance: 99025, explanation: "Progressive slabs computation across 0-4L, 4-8L, 8-12L, 12-16L" },
      { step: 4, section_or_rule: "Sec 87A", label: "Tax Rebate", amount: 0, running_balance: 99025, explanation: "Rebate Nil (Taxable income > ₹12,00,000)" },
      { step: 5, section_or_rule: "Finance Act", label: "Health & Education Cess (4%)", amount: 3961, running_balance: 102986, explanation: "4% cess applied on tax after rebate" },
    ],
    created_at: "2026-05-12T14:16:00Z",
  },
  old_regime: {
    calculation_id: "calc_old_202526_01",
    tax_twin_id: "twin_v2",
    tax_period: "FY 2025-26",
    assessment_year: "AY 2026-27",
    rule_version: "IN-ITD-2025.26-V1.0",
    regime: "OLD",
    gross_total_income: 1468500,
    deductions_total: 425000,
    standard_deduction: 50000,
    taxable_income: 1043500,
    tax_before_rebate: 125550,
    rebate: 0,
    tax_after_rebate: 125550,
    surcharge: 0,
    cess: 5022,
    total_tax: 130572,
    effective_tax_rate_percent: 8.89,
    slabs: [
      { slab_index: 1, from_amount: 0, to_amount: 250000, rate_percent: 0, taxable_amount_in_slab: 250000, tax_amount_in_slab: 0 },
      { slab_index: 2, from_amount: 250000, to_amount: 500000, rate_percent: 5, taxable_amount_in_slab: 250000, tax_amount_in_slab: 12500 },
      { slab_index: 3, from_amount: 500000, to_amount: 1000000, rate_percent: 20, taxable_amount_in_slab: 500000, tax_amount_in_slab: 100000 },
      { slab_index: 4, from_amount: 1000000, to_amount: null, rate_percent: 30, taxable_amount_in_slab: 43500, tax_amount_in_slab: 13050 },
    ],
    assumptions: [
      "Standard deduction of ₹50,000 under Sec 16(ia) in Old Regime",
      "Chapter VI-A deductions claimed: 80C (₹1,50,000), 80D (₹25,000), Sec 24(b) (₹2,00,000)",
    ],
    warnings: [
      "Section 24(b) home loan interest deduction requires lender interest certificate before filing.",
    ],
    calculation_trace: [
      { step: 1, section_or_rule: "Sec 17(1)", label: "Gross Total Income", amount: 1468500, running_balance: 1468500, explanation: "Consolidated salary and other income" },
      { step: 2, section_or_rule: "Sec 16(ia)", label: "Standard Deduction (Old Regime)", amount: -50000, running_balance: 1418500, explanation: "Standard deduction for salaried under Old Regime" },
      { step: 3, section_or_rule: "Sec 24(b)", label: "Home Loan Interest Loss", amount: -200000, running_balance: 1218500, explanation: "Maximum loss allowable for self-occupied property" },
      { step: 4, section_or_rule: "Chapter VI-A", label: "Deductions (80C + 80D)", amount: -175000, running_balance: 1043500, explanation: "₹1,50,000 under 80C and ₹25,000 under 80D" },
      { step: 5, section_or_rule: "Schedule I", label: "Old Regime Slabs Tax", amount: 125550, running_balance: 125550, explanation: "Tax calculated under Old Regime slabs" },
      { step: 6, section_or_rule: "Finance Act", label: "Health & Education Cess (4%)", amount: 5022, running_balance: 130572, explanation: "4% cess applied on tax" },
    ],
    created_at: "2026-05-12T14:16:00Z",
  },
  difference: 27586,
  recommended_regime: "NEW",
  recommendation_rationale: "The New Tax Regime provides a net savings of ₹27,586 due to lower progressive slab rates, even after accounting for your ₹4,25,000 in Old Regime deductions.",
  net_tax_benefit_amount: 27586,
};

export class MockTaxCopilotApiClient implements TaxCopilotApiClient {
  async getTaxProfile(): Promise<TaxProfile> {
    return { ...MOCK_PROFILE };
  }

  async getTaxTwins(): Promise<TaxTwin[]> {
    return [...MOCK_TWINS];
  }

  async getTaxTwin(id: string): Promise<{ twin: TaxTwin; facts: FinancialFact[] }> {
    const twin = MOCK_TWINS.find((t) => t.id === id) || MOCK_TWINS[MOCK_TWINS.length - 1];
    const facts = twin.id === 'twin_v1' ? MOCK_FACTS_V1 : MOCK_FACTS.filter((f) => f.tax_twin_id === twin.id);
    return { twin, facts };
  }

  async initializeTaxTwin(payload: OnboardingPayload): Promise<{ twin: TaxTwin; facts: FinancialFact[] }> {
    const twinV1: TaxTwin = {
      id: "twin_v1",
      tax_profile_id: MOCK_PROFILE.id,
      version: 1,
      is_active_baseline: true,
      notes: "Baseline progressive onboarding snapshot",
      created_at: new Date().toISOString(),
      hash: "0x8a9b...f1e2",
    };

    const initialFacts: FinancialFact[] = [
      {
        id: "fact_init_salary",
        tax_twin_id: twinV1.id,
        category: "INCOME_SALARY",
        field_name: "gross_salary",
        display_label: "Gross Salary Income",
        amount: payload.gross_salary,
        verification_state: "NEEDS_CONFIRMATION",
        confidence: 0.85,
        source_document: "Self-declared in Onboarding",
        created_at: new Date().toISOString(),
      },
    ];

    if (payload.other_income > 0) {
      initialFacts.push({
        id: "fact_init_other",
        tax_twin_id: twinV1.id,
        category: "INCOME_OTHER",
        field_name: "other_income",
        display_label: "Other Sources / Interest",
        amount: payload.other_income,
        verification_state: "NEEDS_CONFIRMATION",
        confidence: 0.85,
        source_document: "Self-declared in Onboarding",
        created_at: new Date().toISOString(),
      });
    }

    if (payload.deduction_80c && payload.deduction_80c > 0) {
      initialFacts.push({
        id: "fact_init_80c",
        tax_twin_id: twinV1.id,
        category: "DEDUCTION_80C",
        field_name: "section_80c",
        display_label: "Section 80C Deductions",
        amount: payload.deduction_80c,
        verification_state: "NEEDS_CONFIRMATION",
        confidence: 0.8,
        source_document: "Self-declared in Onboarding",
        created_at: new Date().toISOString(),
      });
    }

    if (payload.deduction_80d && payload.deduction_80d > 0) {
      initialFacts.push({
        id: "fact_init_80d",
        tax_twin_id: twinV1.id,
        category: "DEDUCTION_80D",
        field_name: "section_80d",
        display_label: "Section 80D Health Insurance",
        amount: payload.deduction_80d,
        verification_state: "NEEDS_CONFIRMATION",
        confidence: 0.8,
        source_document: "Self-declared in Onboarding",
        created_at: new Date().toISOString(),
      });
    }

    MOCK_TWINS = [twinV1];
    MOCK_FACTS = initialFacts;

    return { twin: twinV1, facts: initialFacts };
  }

  async calculateStateless(facts: Partial<FinancialFact>[]): Promise<RegimeComparisonResult> {
    return { ...MOCK_REGIME_COMPARISON };
  }

  async calculateTwin(twinId: string): Promise<RegimeComparisonResult> {
    return { ...MOCK_REGIME_COMPARISON };
  }

  async compareRegimes(twinId: string): Promise<RegimeComparisonResult> {
    return { ...MOCK_REGIME_COMPARISON };
  }

  async getWhatIfScenarios(twinId: string): Promise<WhatIfScenarioResult[]> {
    return [
      {
        scenario_id: "scen_nps_50k",
        baseline_twin_id: twinId,
        name: "Additional ₹50,000 in NPS (Tier 1)",
        description: "Evaluating tax impact of additional voluntary contribution under Section 80CCD(1B)",
        proposed_modifications: [
          {
            category: "DEDUCTION_80CCD_NPS",
            field_name: "nps_tier1_voluntary",
            display_label: "NPS Tier-1 Voluntary Contribution",
            original_amount: 0,
            proposed_amount: 50000,
            delta_amount: 50000,
          },
        ],
        baseline_calculation: MOCK_REGIME_COMPARISON,
        simulated_calculation: {
          ...MOCK_REGIME_COMPARISON,
          old_regime: {
            ...MOCK_REGIME_COMPARISON.old_regime,
            deductions_total: MOCK_REGIME_COMPARISON.old_regime.deductions_total + 50000,
            taxable_income: MOCK_REGIME_COMPARISON.old_regime.taxable_income - 50000,
            total_tax: 114972,
          },
        },
        net_tax_delta: -15600,
        is_applied: false,
        created_at: "2026-05-15T11:00:00Z",
      },
    ];
  }

  async runWhatIfSimulation(input: WhatIfScenarioInput): Promise<WhatIfScenarioResult> {
    const deltaTotal = input.proposed_modifications.reduce((sum, m) => sum + m.delta_amount, 0);
    const mod = input.proposed_modifications[0];
    const category = mod?.category || "DEDUCTION_80CCD_NPS";

    let oldTaxDelta = -Math.round(deltaTotal * 0.312); // ~30% + 4% cess slab
    let newTaxDelta = 0; // Most Chapter VI-A deductions are Nil in New Regime
    let rationale = "This simulation evaluates your proposed financial modification against statutory provisions without altering your active Tax Twin.";
    let statutoryRef = "Section 80CCD(1B)";

    if (category === "DEDUCTION_80CCD_NPS") {
      oldTaxDelta = -Math.round(Math.min(50000, deltaTotal) * 0.312);
      newTaxDelta = 0; // Not deductible in New Regime (115BAC)
      rationale = `An additional voluntary contribution of ₹${deltaTotal.toLocaleString('en-IN')} in NPS Tier-1 reduces your taxable income under Section 80CCD(1B) for the Old Regime, saving ₹${Math.abs(oldTaxDelta).toLocaleString('en-IN')}. However, Section 80CCD(1B) is not eligible under the New Regime (Section 115BAC), leaving New Regime tax unchanged.`;
      statutoryRef = "Section 80CCD(1B)";
    } else if (category === "DEDUCTION_80D") {
      oldTaxDelta = -Math.round(Math.min(25000, deltaTotal) * 0.312);
      newTaxDelta = 0;
      rationale = `Health insurance premium of ₹${deltaTotal.toLocaleString('en-IN')} claimed under Section 80D provides ₹${Math.abs(oldTaxDelta).toLocaleString('en-IN')} tax relief in the Old Regime. It does not qualify under the New Regime.`;
      statutoryRef = "Section 80D";
    } else if (category === "INCOME_HOUSE_PROPERTY") {
      oldTaxDelta = -Math.round(Math.min(200000, deltaTotal) * 0.312);
      newTaxDelta = 0;
      rationale = `Home loan interest of ₹${deltaTotal.toLocaleString('en-IN')} under Section 24(b) reduces Old Regime taxable income up to ₹2,00,000, saving ₹${Math.abs(oldTaxDelta).toLocaleString('en-IN')} in tax. New Regime does not permit deduction for self-occupied home loan interest.`;
      statutoryRef = "Section 24(b)";
    }

    const baselineCalc = MOCK_REGIME_COMPARISON;
    const simOldTax = Math.max(0, baselineCalc.old_regime.total_tax + oldTaxDelta);
    const simNewTax = Math.max(0, baselineCalc.new_regime.total_tax + newTaxDelta);

    const isNewCheaper = simNewTax <= simOldTax;
    const recommendedRegime = isNewCheaper ? "NEW" : "OLD";
    const netBenefit = Math.abs(simOldTax - simNewTax);

    return {
      scenario_id: `scen_sim_${Date.now()}`,
      baseline_twin_id: input.baseline_twin_id,
      name: input.scenario_name,
      description: input.description || rationale,
      proposed_modifications: input.proposed_modifications.map((m) => ({
        category: m.category,
        field_name: m.field_name,
        display_label: m.display_label,
        original_amount: 0,
        proposed_amount: m.delta_amount,
        delta_amount: m.delta_amount,
      })),
      baseline_calculation: baselineCalc,
      simulated_calculation: {
        ...baselineCalc,
        recommended_regime: recommendedRegime,
        difference: netBenefit,
        net_tax_benefit_amount: netBenefit,
        old_regime: {
          ...baselineCalc.old_regime,
          total_tax: simOldTax,
        },
        new_regime: {
          ...baselineCalc.new_regime,
          total_tax: simNewTax,
        },
      },
      net_tax_delta: isNewCheaper ? newTaxDelta : oldTaxDelta,
      is_applied: false,
      created_at: new Date().toISOString(),
    };
  }

  async applyWhatIfScenario(scenarioId: string): Promise<{ new_twin: TaxTwin; message: string }> {
    const newVersion = MOCK_TWINS.length + 1;
    const newTwinId = `twin_v${newVersion}`;
    const newTwin: TaxTwin = {
      id: newTwinId,
      tax_profile_id: MOCK_PROFILE.id,
      version: newVersion,
      is_active_baseline: true,
      notes: `Applied What-If Scenario (${scenarioId}). Baseline updated.`,
      created_at: new Date().toISOString(),
      hash: "0x3c5a...9e1f",
    };

    MOCK_TWINS = MOCK_TWINS.map((t) => ({ ...t, is_active_baseline: false }));
    MOCK_TWINS.push(newTwin);

    return {
      new_twin: newTwin,
      message: `Scenario applied successfully. Generated Tax Twin v${newVersion}.`,
    };
  }

  async getDocuments(): Promise<DocumentUploadResponse[]> {
    return [
      {
        document_id: "doc_f16_01",
        filename: "Form16_FY2025-26_Employer.pdf",
        document_type: "FORM_16",
        status: "EXTRACTED",
        extracted_facts_count: 5,
        extracted_items: [
          { field_name: "gross_salary", display_label: "Gross Salary (17(1))", extracted_amount: 1450000, confidence: 0.99, suggested_state: "VERIFIED", provenance_box_or_section: "Part B Line 1" },
          { field_name: "standard_deduction", display_label: "Standard Deduction", extracted_amount: 75000, confidence: 0.99, suggested_state: "VERIFIED", provenance_box_or_section: "Part B Line 2(a)" },
          { field_name: "tds_total", display_label: "TDS Deducted", extracted_amount: 85000, confidence: 0.99, suggested_state: "VERIFIED", provenance_box_or_section: "Part A Table" },
        ],
      },
    ];
  }

  async uploadDocument(formData: FormData): Promise<DocumentUploadResponse> {
    return {
      document_id: `doc_up_${Date.now()}`,
      filename: "Uploaded_Document.pdf",
      document_type: "FORM_16",
      status: "EXTRACTED",
      extracted_facts_count: 3,
      extracted_items: [
        { field_name: "gross_salary", display_label: "Gross Salary", extracted_amount: 1450000, confidence: 0.98, suggested_state: "VERIFIED" },
        { field_name: "sec_80c", display_label: "Section 80C Deduction", extracted_amount: 150000, confidence: 0.95, suggested_state: "VERIFIED" },
        { field_name: "hra_exemption", display_label: "HRA Exemption (10(13A))", extracted_amount: 120000, confidence: 0.72, suggested_state: "NEEDS_CONFIRMATION" },
      ],
    };
  }

  async getReconciliationRecords(twinId: string): Promise<ReconciliationRecord[]> {
    return [
      {
        id: "recon_01",
        fact_id: "fact_01",
        field_label: "Gross Salary (Sec 17(1))",
        existing_twin_value: 1450000,
        document_extracted_value: 1450000,
        delta_amount: 0,
        confidence: 0.99,
        verification_state: "VERIFIED",
        source_document_title: "Form 16 Part B",
      },
      {
        id: "recon_02",
        fact_id: "fact_02",
        field_label: "Savings Bank Interest",
        existing_twin_value: 12000,
        document_extracted_value: 18500,
        delta_amount: 6500,
        confidence: 0.96,
        verification_state: "CONFLICT",
        source_document_title: "AIS (Annual Information Statement)",
        conflict_explanation: "AIS reports ₹18,500 interest across 3 bank accounts vs ₹12,000 self-reported.",
      },
      {
        id: "recon_03",
        fact_id: "fact_04",
        field_label: "Health Insurance Premium (80D)",
        existing_twin_value: 25000,
        document_extracted_value: 25000,
        delta_amount: 0,
        confidence: 0.78,
        verification_state: "NEEDS_CONFIRMATION",
        source_document_title: "Insurance Premium Certificate",
        conflict_explanation: "Premium payment confirmation slip needs verification for cashless payment.",
      },
    ];
  }

  async confirmReconciliation(updates: { fact_id: string; confirmed_value: number }[]): Promise<{ new_twin: TaxTwin; message: string }> {
    const newVersion = MOCK_TWINS.length + 1;
    const newTwinId = `twin_v${newVersion}`;
    const newTwin: TaxTwin = {
      id: newTwinId,
      tax_profile_id: MOCK_PROFILE.id,
      version: newVersion,
      is_active_baseline: true,
      notes: `Reconciled with AIS (${updates.length} facts resolved). Cryptographically sealed.`,
      created_at: new Date().toISOString(),
      hash: "0x7b2f...e89a",
    };

    // Mark previous twins as inactive
    MOCK_TWINS = MOCK_TWINS.map((t) => ({ ...t, is_active_baseline: false }));
    MOCK_TWINS.push(newTwin);

    // Clone facts from active baseline to new twin, applying updates and changing state to VERIFIED
    const newFacts: FinancialFact[] = MOCK_FACTS.map((f) => {
      const update = updates.find((u) => u.fact_id === f.id);
      if (update) {
        return {
          ...f,
          id: `fact_${newVersion}_${f.field_name}`,
          tax_twin_id: newTwinId,
          amount: update.confirmed_value,
          verification_state: "VERIFIED",
          confidence: 0.99,
          notes: "Reconciled against AIS reported figure",
          created_at: new Date().toISOString(),
        };
      }
      return {
        ...f,
        id: `fact_${newVersion}_${f.field_name}`,
        tax_twin_id: newTwinId,
        created_at: new Date().toISOString(),
      };
    });

    MOCK_FACTS = newFacts;

    return {
      new_twin: newTwin,
      message: `Reconciliation successful. Generated immutable Tax Twin v${newVersion}. Previous version v${newVersion - 1} preserved intact.`,
    };
  }

  async getDeadlines(): Promise<TaxDeadlineItem[]> {
    return [
      {
        id: "dl_01",
        title: "ITR Filing Due Date (Individuals)",
        due_date: "2026-07-31",
        category: "FILING",
        days_remaining: 120,
        status: "UPCOMING",
      },
      {
        id: "dl_02",
        title: "Advance Tax Q2 (45% Cumulative)",
        due_date: "2026-09-15",
        category: "ADVANCE_TAX",
        days_remaining: 165,
        status: "UPCOMING",
      },
      {
        id: "dl_03",
        title: "Revised / Belated Return for AY 2026-27",
        due_date: "2026-12-31",
        category: "FILING",
        days_remaining: 272,
        status: "UPCOMING",
      },
    ];
  }

  async getActionPlan(): Promise<ActionPlanItem[]> {
    return [
      {
        id: "act_01",
        title: "Reconcile Savings Bank Interest Conflict",
        description: "AIS reports ₹18,500 interest vs ₹12,000 previously entered. Reconcile to prevent CP-2000 mismatch notice.",
        category: "COMPLIANCE",
        status: "PENDING",
        statutory_reference: "Sec 139(9) & AIS rules",
        deadline: "2026-07-31",
      },
      {
        id: "act_02",
        title: "Confirm 80D Health Insurance Payment Proof",
        description: "Upload non-cash bank receipt for ₹25,000 mediclaim deduction under Section 80D.",
        category: "VERIFICATION",
        status: "PENDING",
        statutory_reference: "Sec 80D",
        deadline: "2026-07-31",
      },
      {
        id: "act_03",
        title: "Select Authoritative Tax Regime",
        description: "New Regime delivers ₹27,586 lower tax. Mark New Regime as preferred filing choice.",
        category: "FILING",
        status: "COMPLETED",
        potential_savings_inr: 27586,
        statutory_reference: "Sec 115BAC(6)",
      },
      {
        id: "act_04",
        title: "File ITR-1 / ITR-2 Before Due Date",
        description: "Statutory deadline for individual taxpayers for AY 2026-27 is July 31, 2026.",
        category: "FILING",
        status: "PENDING",
        deadline: "2026-07-31",
        statutory_reference: "Sec 139(1)",
      },
    ];
  }

  async sendAIChat(messages: { role: "user" | "assistant"; content: string }[]): Promise<AIChatMessage> {
    const lastUserMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
    let reply = "I am your personal AI Tax Copilot for Indian taxpayers. I analyze your immutable Tax Twin against versioned statutory tax rules for FY 2025-26 / AY 2026-27.";
    let toolExecution: AIChatMessage["tool_execution"] | undefined = undefined;
    let citations: AIChatMessage["citations"] = [
      {
        source_title: "Income Tax Department Statutory Slabs (AY 2026-27)",
        section: "Sec 115BAC & Sec 87A",
      },
    ];

    if (lastUserMessage.includes("regime") || lastUserMessage.includes("better")) {
      reply = "Based on your active Tax Twin (v2) for FY 2025-26 / AY 2026-27, the **New Tax Regime is recommended**.\n\n• **New Regime Tax:** ₹1,02,986 (Effective Rate: 7.01%)\n• **Old Regime Tax:** ₹1,30,572 (Effective Rate: 8.89%)\n• **Net Savings:** **₹27,586**\n\n**Statutory Rationale:** Even though you declared ₹4,25,000 in Chapter VI-A deductions (80C ₹1.5L + 80D ₹25k + Home Loan 24b ₹2L), the lower progressive slabs (0-4L Nil, 4-8L 5%, 8-12L 10%, 12-16L 15%) combined with the ₹75,000 standard deduction under Section 16(ia) in the New Regime produce a significantly lower net tax burden.";
      toolExecution = {
        tool_name: "compare_regimes",
        status: "completed",
        summary: "Evaluated Twin v2 against FY 2025-26 statutory slabs and rebates",
      };
      citations = [
        { source_title: "Finance Act 2025 Provisions", section: "Section 115BAC(1A)" },
        { source_title: "Standard Deduction for Salaried", section: "Section 16(ia)" },
      ];
    } else if (lastUserMessage.includes("taxable income") || lastUserMessage.includes("calculation") || lastUserMessage.includes("explain my tax")) {
      reply = "Here is how your taxable income and tax liability are audited by the deterministic engine:\n\n1. **Gross Salary:** ₹14,50,000 (Form 16 Part B)\n2. **Other Income (Savings Interest):** ₹18,500\n3. **Gross Total Income:** ₹14,68,500\n4. **Standard Deduction:** -₹75,000 (Sec 16(ia))\n5. **Taxable Income:** **₹13,93,500**\n6. **Slab-Wise Tax:** ₹99,025\n7. **Sec 87A Rebate:** ₹0 (Taxable income exceeds ₹12,00,000 limit for AY 2026-27)\n8. **Health & Education Cess (4%):** +₹3,961\n• **Final Tax Liability:** **₹1,02,986**";
      toolExecution = {
        tool_name: "calculate_tax",
        status: "completed",
        summary: "Executed deterministic statutory tax trace on Twin v2",
      };
      citations = [
        { source_title: "Income Tax Department Slabs & Rebates", section: "Sec 115BAC & Sec 87A" },
        { source_title: "Health & Education Cess", section: "Finance Act 2025" },
      ];
    } else if (lastUserMessage.includes("ais") || lastUserMessage.includes("conflict")) {
      reply = "Your Tax Twin v2 has **1 document conflict** requiring reconciliation before filing:\n\n• **Field:** Savings Bank Interest\n• **Self-Reported Baseline:** ₹12,000\n• **AIS (Annual Information Statement) Value:** ₹18,500 across 3 reporting banks\n• **Difference:** +₹6,500 unaccounted interest income\n\n**Action Required:** If you accept the AIS value of ₹18,500, our system will generate **Tax Twin v3** with the updated interest fact. This prevents an automated Section 139(9) defective return or CP-2000 mismatch notice from the department.";
      toolExecution = {
        tool_name: "get_tax_twin_conflicts",
        status: "completed",
        summary: "Retrieved AIS reconciliation conflict records for Twin v2",
      };
      citations = [
        { source_title: "Annual Information Statement Guidelines", section: "Rule 114-I" },
        { source_title: "Defective Return & Discrepancies", section: "Sec 139(9)" },
      ];
    } else if (lastUserMessage.includes("nps") || lastUserMessage.includes("50,000") || lastUserMessage.includes("what if")) {
      reply = "Simulating an additional voluntary contribution of **₹50,000 in NPS Tier-1** under Section 80CCD(1B):\n\n• **Under Old Regime:** Reduces taxable income by ₹50,000, saving ₹15,600 in tax (Total tax drops from ₹1,30,572 to ₹1,14,972).\n• **Under New Regime:** Section 80CCD(1B) deductions are **not deductible** under Section 115BAC. Therefore, your New Regime liability remains ₹1,02,986.\n\n**Conclusion:** Even after investing ₹50,000 in NPS, the New Regime is still cheaper by **₹11,986**! You can test and model this isolated scenario in the What-If Lab.";
      toolExecution = {
        tool_name: "create_scenario",
        status: "completed",
        summary: "Simulated Section 80CCD(1B) delta without altering active Tax Twin",
      };
      citations = [
        { source_title: "Deduction in Respect of Contribution to National Pension System", section: "Section 80CCD(1B)" },
      ];
    } else if (lastUserMessage.includes("filing") || lastUserMessage.includes("complete") || lastUserMessage.includes("before filing")) {
      reply = "To reach 100% filing readiness for AY 2026-27, please complete these 3 pending items:\n\n1. **Reconcile AIS Interest Conflict:** Accept or clarify the ₹6,500 savings interest discrepancy in `/documents` to create Tax Twin v3.\n2. **Verify 80D Proof:** Upload the non-cash payment receipt for your ₹25,000 health insurance policy.\n3. **Confirm Regime Choice:** Keep New Regime selected (delivers ₹27,586 lower tax liability).\n\n**Statutory Deadline:** July 31, 2026 under Section 139(1).";
      toolExecution = {
        tool_name: "get_filing_readiness",
        status: "completed",
        summary: "Evaluated 4 checklist prerequisites against active Twin v2",
      };
      citations = [
        { source_title: "Statutory Return Filing Timelines", section: "Section 139(1)" },
      ];
    } else {
      reply = "I have reviewed your Tax Twin v2. Your gross income is ₹14,68,500 and estimated tax is ₹1,02,986 under the New Regime. You have 1 pending conflict on AIS savings interest and 1 item requiring 80D confirmation. What would you like to explore?";
    }

    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: reply,
      timestamp: new Date().toISOString(),
      tool_execution: toolExecution,
      citations: citations,
    };
  }

  async getHealth(): Promise<{ status: string; rule_version: string; timestamp: string }> {
    return {
      status: "healthy",
      rule_version: "IN-ITD-2025.26-V1.0",
      timestamp: new Date().toISOString(),
    };
  }
}