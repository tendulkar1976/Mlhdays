import { describe, it, expect } from 'vitest';
import { ALL_CONTROLLED_TOOLS, executeToolCall } from '../src/packages/ai/tools/definitions.js';
import { taxTwinStore } from '../src/packages/ai/tools/tax-store.js';

describe('Controlled Tools Suite', () => {
  it('should expose all 11 controlled function declarations with proper names', () => {
    const expectedToolNames = [
      'get_tax_profile',
      'get_tax_twin',
      'get_facts',
      'search_tax_knowledge',
      'calculate_tax',
      'compare_regimes',
      'create_scenario',
      'get_sources',
      'get_deadlines',
      'get_tax_twin_conflicts',
      'get_filing_readiness',
    ];

    expect(ALL_CONTROLLED_TOOLS.length).toBe(11);
    const declaredNames = ALL_CONTROLLED_TOOLS.map(t => t.name);
    for (const name of expectedToolNames) {
      expect(declaredNames).toContain(name);
    }
  });

  it('should execute get_tax_profile and return profile data', async () => {
    const res = await executeToolCall('get_tax_profile', { profile_id: 'prof_demo_01' });
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    const profile = res.data as { full_name: string; residency_status: string };
    expect(profile.full_name).toBe('Aditya Sharma');
    expect(profile.residency_status).toBe('RESIDENT');
  });

  it('should execute get_tax_twin and preserve immutability', async () => {
    const res = await executeToolCall('get_tax_twin', { tax_twin_id: 'twin_demo_v1' });
    expect(res.success).toBe(true);
    const twin = res.data as { version: number; financial_year: string };
    expect(twin.version).toBe(1);
    expect(twin.financial_year).toBe('2025-2026');
  });

  it('should execute calculate_tax and return deterministic result', async () => {
    const res = await executeToolCall('calculate_tax', {
      gross_salary: 1200000,
      regime: 'NEW',
    });
    expect(res.success).toBe(true);
    const data = res.data as { total_tax: number; taxable_income: number };
    expect(data.taxable_income).toBe(1125000);
    expect(data.total_tax).toBe(0); // Under 12L taxable, 87A rebate makes it 0
  });

  it('should execute compare_regimes tool', async () => {
    const res = await executeToolCall('compare_regimes', {
      gross_salary: 1600000,
      deductions_80c: 150000,
    });
    expect(res.success).toBe(true);
    const comp = res.data as { recommended_regime: string; tax_savings: number };
    expect(['NEW', 'OLD']).toContain(comp.recommended_regime);
    expect(comp.tax_savings).toBeGreaterThanOrEqual(0);
  });

  it('should execute get_tax_twin_conflicts and detect AIS interest conflict', async () => {
    const res = await executeToolCall('get_tax_twin_conflicts', { tax_twin_id: 'twin_demo_v1' });
    expect(res.success).toBe(true);
    const data = res.data as {
      unresolved_conflicts: Array<{
        field_name: string;
        self_reported_value: number;
        ais_reported_value: number;
        delta_amount: number;
        verification_state: string;
      }>;
    };
    expect(data.unresolved_conflicts.length).toBe(1);
    const conflict = data.unresolved_conflicts[0];
    expect(conflict.field_name).toBe('savings_interest');
    expect(conflict.self_reported_value).toBe(12000);
    expect(conflict.ais_reported_value).toBe(18500);
    expect(conflict.delta_amount).toBe(6500);
    expect(conflict.verification_state).toBe('CONFLICT');
  });

  it('should execute get_filing_readiness tool', async () => {
    const res = await executeToolCall('get_filing_readiness', { tax_twin_id: 'twin_demo_v1' });
    expect(res.success).toBe(true);
    const data = res.data as { filing_readiness_score: number; status: string; suggested_itr_form: string };
    expect(data.suggested_itr_form).toBe('ITR-1 (Sahaj)');
    expect(data.filing_readiness_score).toBeGreaterThan(0);
  });

  it('should execute create_scenario without mutating the baseline twin', async () => {
    const baselineBefore = taxTwinStore.getTaxTwin('twin_demo_v1');
    const res = await executeToolCall('create_scenario', {
      baseline_twin_id: 'twin_demo_v1',
      scenario_title: 'Test What-If Extra NPS',
      hypothetical_modifications: { deductions_80ccd_1b: 50000 },
    });
    expect(res.success).toBe(true);
    const baselineAfter = taxTwinStore.getTaxTwin('twin_demo_v1');
    // Ensure baseline was NOT altered
    expect(baselineBefore?.version).toBe(baselineAfter?.version);
  });

  it('should execute get_deadlines tool', async () => {
    const res = await executeToolCall('get_deadlines', {});
    expect(res.success).toBe(true);
    const deadlines = res.data as Array<{ due_date: string; category: string }>;
    expect(deadlines.length).toBeGreaterThan(0);
    expect(deadlines.some(d => d.due_date === '2026-07-31')).toBe(true);
  });
});
