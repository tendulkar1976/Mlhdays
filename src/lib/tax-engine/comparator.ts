import { IncomeSourceInput, DeductionsInput, TaxRegime, RegimeCalculationResult } from '../types';
import { calculateRegimeTax } from './calculator';
import { roundCurrency } from './precision';

export interface RegimeComparisonResult {
  recommendedRegime: TaxRegime;
  taxDifference: number; // Positive = New Regime is cheaper by this amount; Negative = Old Regime is cheaper
  oldRegime: RegimeCalculationResult;
  newRegime: RegimeCalculationResult;
  summary: string;
  recommendationDetails: string;
}

/**
 * Runs deterministic calculations under both Old and New Tax Regimes,
 * performs side-by-side comparison, and determines optimal regime.
 */
export function compareTaxRegimes(
  incomeSources: IncomeSourceInput[],
  deductions: DeductionsInput = {},
  age: number = 30,
  isResident: boolean = true,
  ruleVersionIdentifier: string = '2025-2026'
): RegimeComparisonResult {
  const oldResult = calculateRegimeTax(
    TaxRegime.OLD,
    incomeSources,
    deductions,
    age,
    isResident,
    ruleVersionIdentifier
  );

  const newResult = calculateRegimeTax(
    TaxRegime.NEW,
    incomeSources,
    deductions,
    age,
    isResident,
    ruleVersionIdentifier
  );

  const oldTax = oldResult.totalTaxLiability;
  const newTax = newResult.totalTaxLiability;
  const diff = oldTax - newTax; // Positive if New Regime tax is lower

  let recommendedRegime: TaxRegime;
  let summary: string;
  let recommendationDetails: string;

  if (newTax < oldTax) {
    recommendedRegime = TaxRegime.NEW;
    summary = `New Tax Regime saves ₹${Math.abs(diff).toLocaleString('en-IN')} in total tax liability.`;
    recommendationDetails = `With standard deduction of ₹75,000 and enhanced Section 87A rebate up to ₹12L (AY 2026-27), the New Tax Regime is beneficial for your income profile.`;
  } else if (oldTax < newTax) {
    recommendedRegime = TaxRegime.OLD;
    summary = `Old Tax Regime saves ₹${Math.abs(diff).toLocaleString('en-IN')} due to your Chapter VI-A and Section 24(b) deductions.`;
    recommendationDetails = `Your declared deductions (₹${oldResult.totalExemptionsAndDeductions.toLocaleString('en-IN')}) exceed the breakeven threshold, making the Old Regime more advantageous.`;
  } else {
    recommendedRegime = TaxRegime.NEW; // Default to statutory default
    summary = `Both regimes yield equal tax liability of ₹${newTax.toLocaleString('en-IN')}. New Regime is recommended due to simpler filing and no investment lock-in requirements.`;
    recommendationDetails = `Since both regimes result in identical tax, New Tax Regime is recommended as the statutory default.`;
  }

  return {
    recommendedRegime,
    taxDifference: roundCurrency(diff),
    oldRegime: oldResult,
    newRegime: newResult,
    summary,
    recommendationDetails,
  };
}
