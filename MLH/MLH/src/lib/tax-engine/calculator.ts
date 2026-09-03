import Decimal from 'decimal.js';
import { D, roundCurrency, roundToNearest10 } from './precision';
import {
  IncomeSourceInput,
  DeductionsInput,
  TaxRegime,
  IncomeCategory,
  RegimeCalculationResult,
  CalculationTraceStep,
} from '../types';
import { StatutoryRuleSet, TaxSlab } from '../tax-rules/types';
import { getStatutoryRules } from '../tax-rules/registry';
import { calculateRebate87A } from './rebate87a';
import { calculateSurcharge } from './surcharge';

/**
 * Computes progressive tax across defined slabs.
 */
export function computeTaxOnSlabs(taxableIncome: Decimal, slabs: TaxSlab[]): { totalTax: Decimal; slabBreakdown: { slab: string; rate: number; taxableAmount: number; tax: number }[] } {
  let totalTax = D(0);
  const slabBreakdown: { slab: string; rate: number; taxableAmount: number; tax: number }[] = [];

  for (const slab of slabs) {
    const min = D(slab.min);
    const max = slab.max !== null ? D(slab.max) : null;
    const rate = D(slab.rate);

    if (taxableIncome.greaterThan(min)) {
      let taxableInSlab: Decimal;
      if (max !== null) {
        taxableInSlab = Decimal.min(taxableIncome, max).minus(min);
      } else {
        taxableInSlab = taxableIncome.minus(min);
      }

      const taxForSlab = taxableInSlab.times(rate);
      totalTax = totalTax.plus(taxForSlab);

      const slabLabel = max !== null ? `₹${min.toNumber().toLocaleString('en-IN')} - ₹${max.toNumber().toLocaleString('en-IN')}` : `Above ₹${min.toNumber().toLocaleString('en-IN')}`;
      slabBreakdown.push({
        slab: slabLabel,
        rate: slab.rate,
        taxableAmount: roundCurrency(taxableInSlab),
        tax: roundCurrency(taxForSlab),
      });
    }
  }

  return { totalTax, slabBreakdown };
}

/**
 * Deterministic Tax Calculator for an individual regime.
 */
export function calculateRegimeTax(
  regime: TaxRegime,
  incomeSources: IncomeSourceInput[],
  deductions: DeductionsInput = {},
  age: number = 30,
  isResident: boolean = true,
  ruleVersionIdentifier: string = '2025-2026'
): RegimeCalculationResult {
  const rules = getStatutoryRules(ruleVersionIdentifier);
  const trace: CalculationTraceStep[] = [];
  const assumptions: string[] = [];
  const warnings: string[] = [];
  let stepIndex = 1;

  // 1. Aggregate Gross Total Income by Category
  let grossSalary = D(0);
  let grossHouseProperty = D(0);
  let grossCapitalGains = D(0);
  let grossOtherSources = D(0);
  let grossBusiness = D(0);

  for (const inc of incomeSources) {
    const amount = D(inc.grossAmount);
    switch (inc.category) {
      case IncomeCategory.SALARY:
        grossSalary = grossSalary.plus(amount);
        break;
      case IncomeCategory.HOUSE_PROPERTY:
        grossHouseProperty = grossHouseProperty.plus(amount);
        break;
      case IncomeCategory.CAPITAL_GAINS:
        grossCapitalGains = grossCapitalGains.plus(amount);
        break;
      case IncomeCategory.OTHER_SOURCES:
        grossOtherSources = grossOtherSources.plus(amount);
        break;
      case IncomeCategory.BUSINESS_PROFESSION:
        grossBusiness = grossBusiness.plus(amount);
        break;
    }
  }

  const grossTotalIncome = grossSalary
    .plus(grossHouseProperty)
    .plus(grossCapitalGains)
    .plus(grossOtherSources)
    .plus(grossBusiness);

  trace.push({
    step: stepIndex++,
    title: 'Gross Total Income Aggregation',
    description: `Computed gross income across heads: Salary ₹${roundCurrency(grossSalary)}, House Property ₹${roundCurrency(grossHouseProperty)}, Capital Gains ₹${roundCurrency(grossCapitalGains)}, Other Sources ₹${roundCurrency(grossOtherSources)}, Business ₹${roundCurrency(grossBusiness)}.`,
    amount: roundCurrency(grossTotalIncome),
  });

  // 2. Standard Deduction on Salary
  let standardDeduction = D(0);
  if (grossSalary.greaterThan(0)) {
    const maxStdDed = D(
      regime === TaxRegime.NEW
        ? rules.newRegime.standardDeductionSalary
        : rules.oldRegime.standardDeductionSalary
    );
    standardDeduction = Decimal.min(grossSalary, maxStdDed);
    trace.push({
      step: stepIndex++,
      title: 'Standard Deduction (Salary)',
      description: `Section 16(ia) standard deduction of ₹${roundCurrency(standardDeduction)} applied against salary income.`,
      amount: roundCurrency(standardDeduction),
      formula: `min(grossSalary, ₹${maxStdDed.toNumber()})`,
    });
  }

  // 3. Deductions & Exemptions Evaluation
  let totalDeductions = standardDeduction;

  if (regime === TaxRegime.NEW) {
    assumptions.push('New Tax Regime (Section 115BAC) selected as default/preferred regime for FY 2025-26.');
    
    // Employer NPS under 80CCD(2) is allowed in New Regime
    if (deductions.section80CCD2 && deductions.section80CCD2 > 0) {
      const allowedCCD2 = D(deductions.section80CCD2);
      totalDeductions = totalDeductions.plus(allowedCCD2);
      trace.push({
        step: stepIndex++,
        title: 'Section 80CCD(2) Employer NPS Contribution',
        description: `Employer NPS contribution of ₹${roundCurrency(allowedCCD2)} is eligible under the New Tax Regime.`,
        amount: roundCurrency(allowedCCD2),
      });
    }

    if (
      (deductions.section80C && deductions.section80C > 0) ||
      (deductions.section80D && deductions.section80D > 0) ||
      (deductions.section24b && deductions.section24b > 0) ||
      (deductions.hraExemption && deductions.hraExemption > 0)
    ) {
      warnings.push('Chapter VI-A deductions (80C, 80D), HRA exemption, and Section 24(b) home loan interest are not deductible under the New Tax Regime.');
    }
  } else {
    // Old Regime Deductions
    assumptions.push('Old Tax Regime selected with full Chapter VI-A deductions and exemptions.');

    // HRA Exemption
    if (deductions.hraExemption && deductions.hraExemption > 0) {
      const hra = D(deductions.hraExemption);
      totalDeductions = totalDeductions.plus(hra);
      trace.push({
        step: stepIndex++,
        title: 'HRA Exemption Section 10(13A)',
        description: `Exemption of ₹${roundCurrency(hra)} deducted under Section 10(13A).`,
        amount: roundCurrency(hra),
      });
    }

    // Home loan interest on SOP Sec 24(b) (max 2L)
    if (deductions.section24b && deductions.section24b > 0) {
      const sec24b = Decimal.min(D(deductions.section24b), D(rules.oldRegime.limits.section24b_SOP));
      totalDeductions = totalDeductions.plus(sec24b);
      trace.push({
        step: stepIndex++,
        title: 'Section 24(b) Home Loan Interest',
        description: `Deduction for interest on self-occupied house property capped at ₹${rules.oldRegime.limits.section24b_SOP.toLocaleString('en-IN')}: ₹${roundCurrency(sec24b)}.`,
        amount: roundCurrency(sec24b),
      });
    }

    // Section 80C (max 1.5L)
    if (deductions.section80C && deductions.section80C > 0) {
      const sec80C = Decimal.min(D(deductions.section80C), D(rules.oldRegime.limits.section80C));
      totalDeductions = totalDeductions.plus(sec80C);
      trace.push({
        step: stepIndex++,
        title: 'Section 80C Deductions',
        description: `Eligible investments (EPF, PPF, ELSS, LIC, Tuition fees) capped at ₹${rules.oldRegime.limits.section80C.toLocaleString('en-IN')}: ₹${roundCurrency(sec80C)}.`,
        amount: roundCurrency(sec80C),
      });
    }

    // Section 80CCD(1B) (NPS additional up to 50k)
    if (deductions.section80CCD1B && deductions.section80CCD1B > 0) {
      const sec80CCD1B = Decimal.min(D(deductions.section80CCD1B), D(rules.oldRegime.limits.section80CCD1B));
      totalDeductions = totalDeductions.plus(sec80CCD1B);
      trace.push({
        step: stepIndex++,
        title: 'Section 80CCD(1B) Additional NPS',
        description: `Self contribution to NPS Tier 1 capped at ₹50,000: ₹${roundCurrency(sec80CCD1B)}.`,
        amount: roundCurrency(sec80CCD1B),
      });
    }

    // Section 80CCD(2) Employer NPS
    if (deductions.section80CCD2 && deductions.section80CCD2 > 0) {
      const sec80CCD2 = D(deductions.section80CCD2);
      totalDeductions = totalDeductions.plus(sec80CCD2);
      trace.push({
        step: stepIndex++,
        title: 'Section 80CCD(2) Employer NPS',
        description: `Employer contribution to NPS: ₹${roundCurrency(sec80CCD2)}.`,
        amount: roundCurrency(sec80CCD2),
      });
    }

    // Section 80D Health Insurance
    if (deductions.section80D && deductions.section80D > 0) {
      const max80D = age >= 60 ? rules.oldRegime.limits.section80D_Senior : rules.oldRegime.limits.section80D_Self;
      const sec80D = Decimal.min(D(deductions.section80D), D(max80D * 2)); // Allow self + parents
      totalDeductions = totalDeductions.plus(sec80D);
      trace.push({
        step: stepIndex++,
        title: 'Section 80D Health Insurance',
        description: `Mediclaim / preventive health checkup deduction: ₹${roundCurrency(sec80D)}.`,
        amount: roundCurrency(sec80D),
      });
    }

    // Section 80TTA / 80TTB Savings Interest
    if (deductions.section80TTA_TTB && deductions.section80TTA_TTB > 0) {
      const maxLimit = age >= 60 ? rules.oldRegime.limits.section80TTB : rules.oldRegime.limits.section80TTA;
      const sec80TT = Decimal.min(D(deductions.section80TTA_TTB), D(maxLimit));
      totalDeductions = totalDeductions.plus(sec80TT);
      trace.push({
        step: stepIndex++,
        title: age >= 60 ? 'Section 80TTB Senior Savings & FD Interest' : 'Section 80TTA Savings Interest',
        description: `Interest deduction capped at ₹${maxLimit.toLocaleString('en-IN')}: ₹${roundCurrency(sec80TT)}.`,
        amount: roundCurrency(sec80TT),
      });
    }
  }

  // 4. Compute Net Taxable Income (Rounded off per 288A)
  const rawTaxable = Decimal.max(0, grossTotalIncome.minus(totalDeductions));
  const netTaxableIncome = roundToNearest10(rawTaxable);

  trace.push({
    step: stepIndex++,
    title: 'Net Taxable Income',
    description: `Gross Total Income (₹${roundCurrency(grossTotalIncome)}) - Total Deductions (₹${roundCurrency(totalDeductions)}) = ₹${netTaxableIncome.toLocaleString('en-IN')} (rounded per Sec 288A).`,
    amount: netTaxableIncome,
  });

  // 5. Compute Slab Tax
  let applicableSlabs: TaxSlab[];
  if (regime === TaxRegime.NEW) {
    applicableSlabs = rules.newRegime.slabs;
  } else {
    if (age >= 80) {
      applicableSlabs = rules.oldRegime.slabsSuperSenior;
    } else if (age >= 60) {
      applicableSlabs = rules.oldRegime.slabsSeniorCitizen;
    } else {
      applicableSlabs = rules.oldRegime.slabsGeneral;
    }
  }

  const { totalTax: taxOnSlabsDecimal, slabBreakdown } = computeTaxOnSlabs(D(netTaxableIncome), applicableSlabs);
  const taxOnSlabs = roundCurrency(taxOnSlabsDecimal);

  trace.push({
    step: stepIndex++,
    title: `Progressive Slab Computation (${regime} Regime)`,
    description: slabBreakdown.map(s => `${s.slab} @ ${(s.rate * 100).toFixed(0)}% = ₹${s.tax}`).join(' | '),
    amount: taxOnSlabs,
  });

  // 6. Section 87A Rebate & Marginal Relief
  const rebateResult = calculateRebate87A(regime, netTaxableIncome, taxOnSlabs, isResident);
  const taxAfterRebate = rebateResult.taxAfterRebate;

  trace.push({
    step: stepIndex++,
    title: 'Section 87A Rebate / Relief',
    description: rebateResult.explanation,
    amount: rebateResult.rebateAmount > 0 ? -rebateResult.rebateAmount : (rebateResult.marginalReliefAmount > 0 ? -rebateResult.marginalReliefAmount : 0),
  });

  // 7. Surcharge & Marginal Relief
  const computeThresholdTaxFn = (income: number) => {
    return computeTaxOnSlabs(D(income), applicableSlabs).totalTax.toNumber();
  };
  const surchargeResult = calculateSurcharge(regime, netTaxableIncome, taxAfterRebate, rules, computeThresholdTaxFn);

  if (surchargeResult.netSurcharge > 0 || surchargeResult.grossSurcharge > 0) {
    trace.push({
      step: stepIndex++,
      title: 'Surcharge & Marginal Relief',
      description: surchargeResult.explanation,
      amount: surchargeResult.netSurcharge,
    });
  }

  // 8. Health & Education Cess (4%)
  const taxSubjectToCess = D(taxAfterRebate).plus(D(surchargeResult.netSurcharge));
  const cess = taxSubjectToCess.greaterThan(0) ? roundCurrency(taxSubjectToCess.times(rules.cessRate)) : 0;

  trace.push({
    step: stepIndex++,
    title: 'Health & Education Cess (4%)',
    description: `4% cess on (Tax + Surcharge) = 4% of ₹${roundCurrency(taxSubjectToCess)} = ₹${cess}.`,
    amount: cess,
  });

  // 9. Total Tax Liability (Rounded per Sec 288B)
  const rawTotalTax = taxSubjectToCess.plus(D(cess));
  const totalTaxLiability = roundToNearest10(rawTotalTax);

  trace.push({
    step: stepIndex++,
    title: 'Total Final Tax Liability',
    description: `Total Tax payable (including cess) rounded to nearest ₹10 per Section 288B: ₹${totalTaxLiability.toLocaleString('en-IN')}.`,
    amount: totalTaxLiability,
  });

  const effectiveTaxRate = grossTotalIncome.greaterThan(0)
    ? roundCurrency(D(totalTaxLiability).dividedBy(grossTotalIncome).times(100))
    : 0;

  return {
    regime,
    ruleVersion: rules.ruleVersion,
    financialYear: rules.financialYear,
    assessmentYear: rules.assessmentYear,
    grossTotalIncome: roundCurrency(grossTotalIncome),
    standardDeduction: roundCurrency(standardDeduction),
    totalExemptionsAndDeductions: roundCurrency(totalDeductions),
    netTaxableIncome,
    taxOnSlabs,
    rebate87A: rebateResult.rebateAmount > 0 ? rebateResult.rebateAmount : rebateResult.marginalReliefAmount,
    taxAfterRebate,
    surcharge: surchargeResult.netSurcharge,
    marginalRelief: rebateResult.marginalReliefAmount + surchargeResult.marginalRelief,
    cess,
    totalTaxLiability,
    effectiveTaxRatePercentage: effectiveTaxRate,
    assumptions,
    warnings,
    calculationTrace: trace,
  };
}
