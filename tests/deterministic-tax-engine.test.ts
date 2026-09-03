import { describe, it, expect } from 'vitest';
import { deterministicTaxEngine } from '../src/packages/tax-engine/deterministic-calculator.js';

describe('Deterministic Tax Engine — FY 2025-26 / AY 2026-27', () => {
  it('should compute zero tax for gross salary up to ₹12,75,000 under New Regime due to 87A rebate & standard deduction', () => {
    const result = deterministicTaxEngine.calculateNewRegime({
      regime: 'NEW',
      gross_salary: 1275000,
    });

    // Gross 12.75L - 75k standard deduction = 12.00L taxable income
    expect(result.taxable_income).toBe(1200000);
    // Slabs on 12L: 0-4L (0) + 4-8L (20k) + 8-12L (40k) = 60,000 tax
    expect(result.tax_before_rebate).toBe(60000);
    // 87A rebate for income <= 12L = 60,000
    expect(result.rebate_87a).toBe(60000);
    expect(result.tax_after_rebate).toBe(0);
    expect(result.total_tax).toBe(0);
    expect(result.rule_version).toBe('FY2025_26_AY2026_27');
  });

  it('should compute correct New Regime tax for ₹15,00,000 gross salary', () => {
    const result = deterministicTaxEngine.calculateNewRegime({
      regime: 'NEW',
      gross_salary: 1500000,
    });

    // Taxable: 15L - 75k = 14,25,000
    expect(result.taxable_income).toBe(1425000);
    // 0-4L (0) + 4-8L (20k) + 8-12L (40k) + 12-14.25L (15% of 2.25L = 33,750) = 93,750
    expect(result.tax_before_rebate).toBe(93750);
    expect(result.rebate_87a).toBe(0); // Taxable income exceeds 12L
    // Cess 4% on 93,750 = 3,750
    expect(result.cess).toBe(3750);
    expect(result.total_tax).toBe(97500);
  });

  it('should compute correct Old Regime tax with standard deduction and 80C/80D deductions', () => {
    const result = deterministicTaxEngine.calculateOldRegime({
      regime: 'OLD',
      gross_salary: 1500000,
      deductions_80c: 150000,
      deductions_80d: 25000,
    });

    // Total deductions = 50k (std) + 150k (80C) + 25k (80D) = 2,25,000
    expect(result.total_exemptions_deductions).toBe(225000);
    // Taxable: 15L - 2.25L = 12,75,000
    expect(result.taxable_income).toBe(1275000);
    // 0-2.5L (0) + 2.5-5L (12.5k) + 5-10L (100k) + 10-12.75L (30% of 2.75L = 82.5k) = 1,95,000
    expect(result.tax_before_rebate).toBe(195000);
    // 4% cess on 195,000 = 7,800
    expect(result.cess).toBe(7800);
    expect(result.total_tax).toBe(202800);
  });

  it('should compare regimes deterministically and recommend the optimal regime with tax savings', () => {
    const comparison = deterministicTaxEngine.compareRegimes({
      regime: 'NEW',
      gross_salary: 1500000,
      deductions_80c: 150000,
      deductions_80d: 25000,
    });

    // New Regime Tax = 97,500, Old Regime Tax = 2,02,800
    expect(comparison.recommended_regime).toBe('NEW');
    expect(comparison.tax_savings).toBe(202800 - 97500); // Saves ₹1,05,300
    expect(comparison.key_factors.length).toBeGreaterThan(0);
  });
});
