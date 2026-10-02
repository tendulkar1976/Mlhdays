import { describe, it, expect } from 'vitest';
import { calculateRegimeTax } from '../src/lib/tax-engine/calculator';
import { compareTaxRegimes } from '../src/lib/tax-engine/comparator';
import { IncomeCategory, TaxRegime } from '../src/lib/types';

describe('Exhaustive Real-World Tax Test Cases (FY 2025-26 / AY 2026-27)', () => {
  // Case 1: Fresher / Student
  it('Case 1: Fresher with ₹3,50,000 salary pays ₹0 tax', () => {
    const result = calculateRegimeTax(TaxRegime.NEW, [
      { category: IncomeCategory.SALARY, grossAmount: 350000 },
    ]);
    expect(result.standardDeduction).toBe(75000);
    expect(result.netTaxableIncome).toBe(275000);
    expect(result.taxOnSlabs).toBe(0);
    expect(result.totalTaxLiability).toBe(0);
  });

  // Case 2: Middle Earner under ₹12L Rebate
  it('Case 2: Middle earner with ₹7,50,000 salary pays ₹0 tax via Sec 87A rebate', () => {
    const result = calculateRegimeTax(TaxRegime.NEW, [
      { category: IncomeCategory.SALARY, grossAmount: 750000 },
    ]);
    expect(result.standardDeduction).toBe(75000);
    expect(result.netTaxableIncome).toBe(675000);
    // Slabs: 4L@0% + 2.75L@5% = 13,750
    expect(result.taxOnSlabs).toBe(13750);
    expect(result.rebate87A).toBe(13750);
    expect(result.totalTaxLiability).toBe(0);
  });

  // Case 3: Exact Boundary ₹12,75,000 Gross Salary (₹12,00,000 Taxable)
  it('Case 3: Exact boundary ₹12,75,000 salary (Net ₹12,00,000) gets full ₹60,000 rebate -> ₹0 tax', () => {
    const result = calculateRegimeTax(TaxRegime.NEW, [
      { category: IncomeCategory.SALARY, grossAmount: 1275000 },
    ]);
    expect(result.netTaxableIncome).toBe(1200000);
    expect(result.taxOnSlabs).toBe(60000);
    expect(result.rebate87A).toBe(60000);
    expect(result.totalTaxLiability).toBe(0);
  });

  // Case 4: Section 87A Marginal Relief Edge Case (₹12,05,000 Taxable)
  it('Case 4: Section 87A Marginal Relief on ₹12,05,000 taxable income caps tax at excess income', () => {
    const result = calculateRegimeTax(TaxRegime.NEW, [
      { category: IncomeCategory.OTHER_SOURCES, grossAmount: 1205000 },
    ]);
    expect(result.netTaxableIncome).toBe(1205000);
    // Normal tax = 60,000 + 15% of 5,000 = 60,750
    // Excess income over 12L = 5,000
    // Marginal relief = 55,750
    // Tax after relief = 5,000 + 4% cess (200) = 5,200
    expect(result.taxOnSlabs).toBe(60750);
    expect(result.marginalRelief).toBe(55750);
    expect(result.totalTaxLiability).toBe(5200);
  });

  // Case 5: Section 87A Marginal Relief Upper Boundary (₹12,70,000 Taxable)
  it('Case 5: Section 87A Marginal Relief on ₹12,70,000 taxable income', () => {
    const result = calculateRegimeTax(TaxRegime.NEW, [
      { category: IncomeCategory.OTHER_SOURCES, grossAmount: 1270000 },
    ]);
    expect(result.netTaxableIncome).toBe(1270000);
    // Normal tax = 60,000 + 15% of 70,000 = 70,500
    // Excess income over 12L = 70,000
    // Marginal relief = 500
    // Tax after relief = 70,000 + 4% cess (2,800) = 72,800
    expect(result.taxOnSlabs).toBe(70500);
    expect(result.marginalRelief).toBe(500);
    expect(result.totalTaxLiability).toBe(72800);
  });

  // Case 6: Salaried Tech Professional (₹20,00,000 Gross Salary)
  it('Case 6: Salaried individual with ₹20,00,000 salary', () => {
    const result = calculateRegimeTax(TaxRegime.NEW, [
      { category: IncomeCategory.SALARY, grossAmount: 2000000 },
    ]);
    // Taxable: 19,25,000
    // Slabs: 4L@0% + 4L@5%(20k) + 4L@10%(40k) + 4L@15%(60k) + 3.25L@20%(65k) = 1,85,000
    // Cess @ 4%: 7,400 -> Total: 1,92,400
    expect(result.netTaxableIncome).toBe(1925000);
    expect(result.taxOnSlabs).toBe(185000);
    expect(result.cess).toBe(7400);
    expect(result.totalTaxLiability).toBe(192400);
  });

  // Case 7: High Earner (₹30,00,000 Gross Salary with >₹24L 30% slab)
  it('Case 7: High earner with ₹30,00,000 salary crossing the ₹24L 30% slab', () => {
    const result = calculateRegimeTax(TaxRegime.NEW, [
      { category: IncomeCategory.SALARY, grossAmount: 3000000 },
    ]);
    // Taxable: 29,25,000
    // Slabs up to 24L: 0 + 20k + 40k + 60k + 80k + 100k = 3,00,000; remaining 5.25L @ 30% = 1,57,500. Total = 4,57,500
    // Cess @ 4%: 18,300 -> Total: 4,75,800
    expect(result.netTaxableIncome).toBe(2925000);
    expect(result.taxOnSlabs).toBe(457500);
    expect(result.cess).toBe(18300);
    expect(result.totalTaxLiability).toBe(475800);
  });

  // Case 8: HNI with Surcharge (₹60,00,000 Income)
  it('Case 8: HNI with ₹60,00,000 income attracts 10% surcharge with marginal relief validation', () => {
    const result = calculateRegimeTax(TaxRegime.NEW, [
      { category: IncomeCategory.SALARY, grossAmount: 6000000 },
    ]);
    expect(result.netTaxableIncome).toBe(5925000);
    expect(result.surcharge).toBeGreaterThan(0);
    expect(result.totalTaxLiability).toBeGreaterThan(1500000);
  });

  // Case 9: Senior Citizen in Old Regime (Age 68 with 80TTB deduction)
  it('Case 9: Senior Citizen (Age 68) benefits from ₹3L basic exemption & Section 80TTB', () => {
    const result = calculateRegimeTax(
      TaxRegime.OLD,
      [
        { category: IncomeCategory.OTHER_SOURCES, grossAmount: 600000 },
      ],
      {
        section80TTA_TTB: 50000, // 80TTB max 50k
        section80D: 50000,       // Senior mediclaim max 50k
      },
      68 // age
    );
    expect(result.totalExemptionsAndDeductions).toBe(100000);
    expect(result.netTaxableIncome).toBe(500000);
    // Slabs for Senior: 0-3L Nil, 3-5L @ 5% (10k)
    // 87A Rebate: 10k -> Net Tax: ₹0
    expect(result.rebate87A).toBe(10000);
    expect(result.totalTaxLiability).toBe(0);
  });

  // Case 10: Old Regime Winner due to High Deductions (HRA + 24b + 80C + 80D + NPS)
  it('Case 10: Heavy deductions make Old Regime significantly cheaper', () => {
    const comparison = compareTaxRegimes(
      [{ category: IncomeCategory.SALARY, grossAmount: 2000000 }],
      {
        section80C: 150000,
        section80D: 50000,
        section80CCD1B: 50000,
        section24b: 200000,
        hraExemption: 300000,
      }
    );

    // Old Regime Deductions: 50k std ded + 1.5L + 50k + 50k + 2L + 3L = 8,00,000
    // Net Taxable in Old: 12,00,000
    expect(comparison.oldRegime.totalExemptionsAndDeductions).toBe(800000);
    expect(comparison.oldRegime.netTaxableIncome).toBe(1200000);
    expect(comparison.recommendedRegime).toBe(TaxRegime.OLD);
    expect(comparison.taxDifference).toBeLessThan(0); // Old regime is cheaper
  });
});
