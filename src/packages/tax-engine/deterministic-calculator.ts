/**
 * Deterministic Tax Engine for Indian Income Tax
 * Authoritative baseline: FY 2025-26 / AY 2026-27
 * Invariant: Gemini MUST invoke this engine for all numerical calculations.
 */

import {
  TaxCalculationRequest,
  TaxCalculationResult,
  RegimeComparisonResult,
  TaxSlabBreakdown,
  TaxRegime,
} from '../../types/shared.js';

export const RULE_VERSION = 'FY2025_26_AY2026_27';

export class DeterministicTaxEngine {
  /**
   * Calculate tax for New Tax Regime (Section 115BAC default for FY 2025-26)
   */
  public calculateNewRegime(req: TaxCalculationRequest): TaxCalculationResult {
    const grossIncome = Math.max(0, req.gross_salary + (req.other_income || 0));
    const stdDeduction = req.standard_deduction !== undefined ? req.standard_deduction : (req.gross_salary > 0 ? 75000 : 0);
    const exemptions = Math.max(0, req.exemptions_sec_10 || 0);
    const employerNps80ccd2 = Math.max(0, req.deductions_80ccd_2 || 0);

    // In New Regime, only standard deduction and 80CCD(2) employer NPS are allowed among typical deductions
    const totalDeductions = stdDeduction + exemptions + employerNps80ccd2;
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    // Calculate slabs
    const slabs: TaxSlabBreakdown[] = [];
    let taxBeforeRebate = 0;

    // Slabs: 0-4L (0%), 4-8L (5%), 8-12L (10%), 12-16L (15%), 16-20L (20%), 20-24L (25%), >24L (30%)
    const slabTiers = [
      { range: '₹0 to ₹4,00,000', limit: 400000, rate: 0.0 },
      { range: '₹4,00,001 to ₹8,00,000', limit: 400000, rate: 0.05 },
      { range: '₹8,00,001 to ₹12,00,000', limit: 400000, rate: 0.10 },
      { range: '₹12,00,001 to ₹16,00,000', limit: 400000, rate: 0.15 },
      { range: '₹16,00,001 to ₹20,00,000', limit: 400000, rate: 0.20 },
      { range: '₹20,00,001 to ₹24,00,000', limit: 400000, rate: 0.25 },
      { range: 'Above ₹24,00,000', limit: Infinity, rate: 0.30 },
    ];

    let remainingIncome = taxableIncome;
    for (const tier of slabTiers) {
      if (remainingIncome <= 0) {
        slabs.push({
          slab_range: tier.range,
          rate_percent: tier.rate * 100,
          taxable_amount_in_slab: 0,
          tax_in_slab: 0,
        });
        continue;
      }

      const taxableInSlab = Math.min(remainingIncome, tier.limit);
      const taxInSlab = Math.round(taxableInSlab * tier.rate);
      slabs.push({
        slab_range: tier.range,
        rate_percent: tier.rate * 100,
        taxable_amount_in_slab: taxableInSlab,
        tax_in_slab: taxInSlab,
      });

      taxBeforeRebate += taxInSlab;
      remainingIncome -= taxableInSlab;
    }

    // Section 87A Rebate for New Regime (up to ₹60,000 if taxable income <= ₹12,00,000)
    let rebate87a = 0;
    if (taxableIncome <= 1200000) {
      rebate87a = Math.min(taxBeforeRebate, 60000);
    }
    const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87a);

    // Surcharge
    let surchargeRate = 0;
    if (taxableIncome > 20000000) surchargeRate = 0.25; // Capped at 25% in new regime
    else if (taxableIncome > 10000000) surchargeRate = 0.15;
    else if (taxableIncome > 5000000) surchargeRate = 0.10;

    const surcharge = Math.round(taxAfterRebate * surchargeRate);
    const cess = Math.round((taxAfterRebate + surcharge) * 0.04);
    const totalTax = taxAfterRebate + surcharge + cess;

    const totalCredits = (req.tds_paid || 0) + (req.advance_tax_paid || 0);
    const netPayable = totalTax - totalCredits;

    return {
      calculation_id: `calc_new_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      tax_twin_id: req.tax_twin_id,
      tax_period: req.tax_period || { financial_year: '2025-2026', assessment_year: '2026-2027' },
      regime: 'NEW',
      rule_version: RULE_VERSION,
      gross_total_income: grossIncome,
      total_exemptions_deductions: totalDeductions,
      taxable_income: taxableIncome,
      tax_before_rebate: taxBeforeRebate,
      rebate_87a: rebate87a,
      tax_after_rebate: taxAfterRebate,
      surcharge: surcharge,
      cess: cess,
      total_tax: totalTax,
      tds_and_advance_tax_credits: totalCredits,
      net_tax_payable_or_refundable: netPayable,
      slab_breakdown: slabs,
      assumptions: [
        'Calculated under Section 115BAC (New Tax Regime) for FY 2025-26 / AY 2026-27.',
        'Standard deduction of ₹75,000 applied for salaried taxpayers.',
        'Section 87A full tax rebate applied for total taxable income up to ₹12,00,000.',
        'Health & Education Cess applied at 4% on tax and surcharge.',
      ],
      warnings: req.gross_salary > 0 && (req.deductions_80c || 0) > 0 ? [
        'Note: Deductions under Section 80C, 80D, and HRA are not eligible in the New Tax Regime.'
      ] : [],
      calculation_trace: [
        { step: 'Gross Total Income', description: 'Salary + Other Income', computed_value: grossIncome },
        { step: 'Standard Deduction (16ia)', description: 'Eligible for salaried earners', computed_value: stdDeduction },
        { step: 'Total Deductions & Exemptions', description: 'Standard Deduction + 80CCD(2)', computed_value: totalDeductions },
        { step: 'Taxable Income', description: 'Gross Total Income - Total Deductions', computed_value: taxableIncome },
        { step: 'Tax before 87A Rebate', description: 'Computed using FY 2025-26 New Regime slabs', computed_value: taxBeforeRebate },
        { step: 'Section 87A Rebate', description: 'Rebate up to ₹60,000 for income <= ₹12L', computed_value: rebate87a },
        { step: '4% Cess', description: 'Health & Education Cess', computed_value: cess },
        { step: 'Total Tax Liability', description: 'Tax after rebate + Surcharge + Cess', computed_value: totalTax },
      ],
    };
  }

  /**
   * Calculate tax for Old Tax Regime (Optional regime with full deductions)
   */
  public calculateOldRegime(req: TaxCalculationRequest): TaxCalculationResult {
    const grossIncome = Math.max(0, req.gross_salary + (req.other_income || 0));
    const stdDeduction = req.standard_deduction !== undefined ? req.standard_deduction : (req.gross_salary > 0 ? 50000 : 0);
    const exemptions = Math.max(0, req.exemptions_sec_10 || 0);

    // Chapter VI-A Deductions
    const sec80c = Math.min(150000, Math.max(0, req.deductions_80c || 0));
    const sec80d = Math.min(100000, Math.max(0, req.deductions_80d || 0));
    const sec80ccd1b = Math.min(50000, Math.max(0, req.deductions_80ccd_1b || 0));
    const sec80ccd2 = Math.max(0, req.deductions_80ccd_2 || 0);
    const sec80tta = Math.min(10000, Math.max(0, req.deductions_80tta || 0));
    const otherDeductions = Math.max(0, req.other_chapter_via_deductions || 0);
    const hpLoss = Math.min(200000, Math.max(0, -(req.house_property_income_or_loss || 0)));

    const totalDeductions = stdDeduction + exemptions + sec80c + sec80d + sec80ccd1b + sec80ccd2 + sec80tta + otherDeductions + hpLoss;
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    // Old Regime slabs: 0-2.5L (0%), 2.5-5L (5%), 5-10L (20%), >10L (30%)
    const slabs: TaxSlabBreakdown[] = [];
    let taxBeforeRebate = 0;

    const slabTiers = [
      { range: '₹0 to ₹2,50,000', limit: 250000, rate: 0.0 },
      { range: '₹2,50,001 to ₹5,00,000', limit: 250000, rate: 0.05 },
      { range: '₹5,00,001 to ₹10,00,000', limit: 500000, rate: 0.20 },
      { range: 'Above ₹10,00,000', limit: Infinity, rate: 0.30 },
    ];

    let remainingIncome = taxableIncome;
    for (const tier of slabTiers) {
      if (remainingIncome <= 0) {
        slabs.push({
          slab_range: tier.range,
          rate_percent: tier.rate * 100,
          taxable_amount_in_slab: 0,
          tax_in_slab: 0,
        });
        continue;
      }

      const taxableInSlab = Math.min(remainingIncome, tier.limit);
      const taxInSlab = Math.round(taxableInSlab * tier.rate);
      slabs.push({
        slab_range: tier.range,
        rate_percent: tier.rate * 100,
        taxable_amount_in_slab: taxableInSlab,
        tax_in_slab: taxInSlab,
      });

      taxBeforeRebate += taxInSlab;
      remainingIncome -= taxableInSlab;
    }

    // Section 87A Rebate for Old Regime (up to ₹12,500 if taxable income <= ₹5,00,000)
    let rebate87a = 0;
    if (taxableIncome <= 500000) {
      rebate87a = Math.min(taxBeforeRebate, 12500);
    }
    const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87a);

    // Surcharge
    let surchargeRate = 0;
    if (taxableIncome > 50000000) surchargeRate = 0.37;
    else if (taxableIncome > 20000000) surchargeRate = 0.25;
    else if (taxableIncome > 10000000) surchargeRate = 0.15;
    else if (taxableIncome > 5000000) surchargeRate = 0.10;

    const surcharge = Math.round(taxAfterRebate * surchargeRate);
    const cess = Math.round((taxAfterRebate + surcharge) * 0.04);
    const totalTax = taxAfterRebate + surcharge + cess;

    const totalCredits = (req.tds_paid || 0) + (req.advance_tax_paid || 0);
    const netPayable = totalTax - totalCredits;

    return {
      calculation_id: `calc_old_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      tax_twin_id: req.tax_twin_id,
      tax_period: req.tax_period || { financial_year: '2025-2026', assessment_year: '2026-2027' },
      regime: 'OLD',
      rule_version: RULE_VERSION,
      gross_total_income: grossIncome,
      total_exemptions_deductions: totalDeductions,
      taxable_income: taxableIncome,
      tax_before_rebate: taxBeforeRebate,
      rebate_87a: rebate87a,
      tax_after_rebate: taxAfterRebate,
      surcharge: surcharge,
      cess: cess,
      total_tax: totalTax,
      tds_and_advance_tax_credits: totalCredits,
      net_tax_payable_or_refundable: netPayable,
      slab_breakdown: slabs,
      assumptions: [
        'Calculated under the Old Tax Regime for FY 2025-26 / AY 2026-27.',
        'Standard deduction of ₹50,000 applied for salaried taxpayers.',
        'Section 80C deductions capped at statutory limit of ₹1,50,000.',
        'Section 87A rebate applied for total taxable income up to ₹5,00,000.',
        'Health & Education Cess applied at 4% on tax and surcharge.',
      ],
      warnings: [],
      calculation_trace: [
        { step: 'Gross Total Income', description: 'Salary + Other Income', computed_value: grossIncome },
        { step: 'Standard Deduction (16ia)', description: 'Old regime standard deduction', computed_value: stdDeduction },
        { step: 'Section 80C Deductions', description: 'PPF/EPF/ELSS/LIC capped at 1.5L', computed_value: sec80c },
        { step: 'Section 80D / 80CCD / Other', description: 'Health insurance + NPS + other deductions', computed_value: sec80d + sec80ccd1b + sec80ccd2 + sec80tta + otherDeductions },
        { step: 'Total Deductions & Exemptions', description: 'Sum of all eligible Chapter VI-A deductions', computed_value: totalDeductions },
        { step: 'Taxable Income', description: 'Gross Total Income - Total Deductions', computed_value: taxableIncome },
        { step: 'Tax before 87A Rebate', description: 'Computed using Old Regime slabs', computed_value: taxBeforeRebate },
        { step: 'Section 87A Rebate', description: 'Rebate up to ₹12,500 for income <= ₹5L', computed_value: rebate87a },
        { step: '4% Cess', description: 'Health & Education Cess', computed_value: cess },
        { step: 'Total Tax Liability', description: 'Tax after rebate + Surcharge + Cess', computed_value: totalTax },
      ],
    };
  }

  /**
   * Primary dispatcher for calculations
   */
  public calculate(req: TaxCalculationRequest): TaxCalculationResult {
    if (req.regime === 'OLD') {
      return this.calculateOldRegime(req);
    }
    return this.calculateNewRegime(req);
  }

  /**
   * Compare both regimes deterministically and provide a savings recommendation
   */
  public compareRegimes(req: TaxCalculationRequest): RegimeComparisonResult {
    const newResult = this.calculateNewRegime(req);
    const oldResult = this.calculateOldRegime(req);

    const taxDiff = oldResult.total_tax - newResult.total_tax;
    const recommendedRegime: TaxRegime = taxDiff >= 0 ? 'NEW' : 'OLD';
    const taxSavings = Math.abs(taxDiff);

    const keyFactors: string[] = [];
    if (recommendedRegime === 'NEW') {
      keyFactors.push(`New Tax Regime saves ₹${taxSavings.toLocaleString('en-IN')} in tax.`);
      keyFactors.push('Benefits from wider tax slabs and standard deduction of ₹75,000.');
      if (newResult.rebate_87a > 0) {
        keyFactors.push('Eligible for Section 87A full tax rebate up to ₹12,00,000 taxable income.');
      }
    } else {
      keyFactors.push(`Old Tax Regime saves ₹${taxSavings.toLocaleString('en-IN')} due to extensive Chapter VI-A deductions.`);
      keyFactors.push(`Total deductions claimed under Old Regime: ₹${oldResult.total_exemptions_deductions.toLocaleString('en-IN')}.`);
    }

    const explanation = recommendedRegime === 'NEW'
      ? `The New Tax Regime is more beneficial for you, resulting in a total tax of ₹${newResult.total_tax.toLocaleString('en-IN')} compared to ₹${oldResult.total_tax.toLocaleString('en-IN')} in the Old Regime (savings: ₹${taxSavings.toLocaleString('en-IN')}).`
      : `The Old Tax Regime is more beneficial for you, resulting in a total tax of ₹${oldResult.total_tax.toLocaleString('en-IN')} compared to ₹${newResult.total_tax.toLocaleString('en-IN')} in the New Regime (savings: ₹${taxSavings.toLocaleString('en-IN')}) due to your high deductions.`;

    return {
      comparison_id: `cmp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      tax_twin_id: req.tax_twin_id,
      tax_period: req.tax_period || { financial_year: '2025-2026', assessment_year: '2026-2027' },
      rule_version: RULE_VERSION,
      old_regime: oldResult,
      new_regime: newResult,
      recommended_regime: recommendedRegime,
      tax_savings: taxSavings,
      key_factors: keyFactors,
      explanation: explanation,
    };
  }
}

export const deterministicTaxEngine = new DeterministicTaxEngine();
