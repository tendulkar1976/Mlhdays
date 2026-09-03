/**
 * In-Memory & Database-backed Store for Tax Profiles, Immutable Twins, and Facts
 * Invariant: facts.tax_twin_id -> tax_twins.id
 * Invariant: historical TaxTwin versions are strictly immutable.
 */

import { TaxProfile, TaxTwin, FinancialFact, IncomeSource } from '../../../types/shared.js';

class TaxTwinStore {
  private profiles: Map<string, TaxProfile> = new Map();
  private twins: Map<string, TaxTwin> = new Map();
  private facts: Map<string, FinancialFact[]> = new Map(); // tax_twin_id -> facts[]
  private incomeSources: Map<string, IncomeSource[]> = new Map(); // tax_twin_id -> income_sources[]

  constructor() {
    // Seed initial demo/default profile and immutable twin for FY 2025-26
    const defaultProfileId = 'prof_demo_01';
    const defaultTwinId = 'twin_demo_v1';

    const sampleProfile: TaxProfile = {
      id: defaultProfileId,
      user_id: 'user_demo_01',
      pan_masked: 'ABCDE****F',
      full_name: 'Aditya Sharma',
      date_of_birth: '1995-08-15',
      age_category: 'GENERAL',
      residency_status: 'RESIDENT',
      preferred_regime: 'NEW',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sampleTwin: TaxTwin = {
      id: defaultTwinId,
      tax_profile_id: defaultProfileId,
      version: 1,
      financial_year: '2025-2026',
      assessment_year: '2026-2027',
      is_baseline: true,
      created_at: new Date().toISOString(),
      created_by: 'USER',
      notes: 'Initial onboarded financial facts',
    };

    const sampleFacts: FinancialFact[] = [
      {
        id: 'fact_sal_01',
        tax_twin_id: defaultTwinId,
        category: 'SALARY',
        field_name: 'gross_salary',
        amount: 1450000,
        verification_state: 'VERIFIED',
        confidence_score: 1.0,
      },
      {
        id: 'fact_80c_01',
        tax_twin_id: defaultTwinId,
        category: 'DEDUCTION_80C',
        field_name: 'ppf_epf_elss',
        amount: 150000,
        verification_state: 'VERIFIED',
        confidence_score: 1.0,
      },
      {
        id: 'fact_80d_01',
        tax_twin_id: defaultTwinId,
        category: 'DEDUCTION_80D',
        field_name: 'health_insurance_self_parents',
        amount: 35000,
        verification_state: 'VERIFIED',
        confidence_score: 1.0,
      },
      {
        id: 'fact_tds_01',
        tax_twin_id: defaultTwinId,
        category: 'TDS',
        field_name: 'tds_salary',
        amount: 85000,
        verification_state: 'VERIFIED',
        confidence_score: 1.0,
      },
      {
        id: 'fact_interest_01',
        tax_twin_id: defaultTwinId,
        category: 'OTHER_SOURCES',
        field_name: 'savings_interest',
        amount: 12000,
        verification_state: 'NEEDS_CONFIRMATION',
        confidence_score: 0.90,
        notes: 'Self-reported savings account interest from taxpayer records',
      },
    ];

    const sampleIncomeSources: IncomeSource[] = [
      {
        id: 'inc_src_01',
        tax_twin_id: defaultTwinId,
        source_type: 'SALARY',
        payer_name: 'Tech Solutions India Pvt Ltd',
        gross_amount: 1450000,
        exemptions_amount: 0,
        net_amount: 1450000,
        tds_deducted: 85000,
      },
    ];

    this.profiles.set(defaultProfileId, sampleProfile);
    this.twins.set(defaultTwinId, sampleTwin);
    this.facts.set(defaultTwinId, sampleFacts);
    this.incomeSources.set(defaultTwinId, sampleIncomeSources);
  }

  public getProfile(profileId: string): TaxProfile | null {
    return this.profiles.get(profileId) || null;
  }

  public getTaxTwin(twinId: string): TaxTwin | null {
    return this.twins.get(twinId) || null;
  }

  public getFactsByTwinId(twinId: string): FinancialFact[] {
    return this.facts.get(twinId) || [];
  }

  public getIncomeSourcesByTwinId(twinId: string): IncomeSource[] {
    return this.incomeSources.get(twinId) || [];
  }

  /**
   * Create a new immutable Tax Twin version from reconciliation or scenario application.
   * Never mutates existing versions.
   */
  public createNewTwinVersion(
    parentTwinId: string,
    createdBy: TaxTwin['created_by'],
    updatedFacts: FinancialFact[],
    notes?: string
  ): TaxTwin {
    const parentTwin = this.getTaxTwin(parentTwinId);
    if (!parentTwin) {
      throw new Error(`Parent TaxTwin ${parentTwinId} not found.`);
    }

    const nextVersion = parentTwin.version + 1;
    const newTwinId = `twin_${parentTwin.tax_profile_id}_v${nextVersion}_${Date.now()}`;

    const newTwin: TaxTwin = {
      id: newTwinId,
      tax_profile_id: parentTwin.tax_profile_id,
      version: nextVersion,
      financial_year: parentTwin.financial_year,
      assessment_year: parentTwin.assessment_year,
      is_baseline: true,
      created_at: new Date().toISOString(),
      created_by: createdBy,
      notes: notes || `Created version ${nextVersion} via ${createdBy}`,
    };

    // Update old twin baseline flag
    parentTwin.is_baseline = false;

    // Attach all facts strictly to new twin_id
    const attachedFacts = updatedFacts.map(f => ({
      ...f,
      id: `fact_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      tax_twin_id: newTwinId,
    }));

    this.twins.set(newTwinId, newTwin);
    this.facts.set(newTwinId, attachedFacts);

    return newTwin;
  }
}

export const taxTwinStore = new TaxTwinStore();
