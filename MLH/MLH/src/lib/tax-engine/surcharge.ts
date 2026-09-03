import Decimal from 'decimal.js';
import { D, roundCurrency } from './precision';
import { TaxRegime } from '../types';
import { StatutoryRuleSet, SurchargeSlab } from '../tax-rules/types';

export interface SurchargeResult {
  rate: number;
  grossSurcharge: number;
  marginalRelief: number;
  netSurcharge: number;
  explanation: string;
}

/**
 * Calculates Surcharge and Marginal Relief on Surcharge.
 */
export function calculateSurcharge(
  regime: TaxRegime,
  netTaxableIncome: number,
  taxAfterRebate: number,
  rules: StatutoryRuleSet,
  calculateTaxForIncomeFn: (income: number) => number
): SurchargeResult {
  const income = D(netTaxableIncome);
  const tax = D(taxAfterRebate);
  const surchargeSlabs: SurchargeSlab[] =
    regime === TaxRegime.NEW ? rules.newRegime.surchargeSlabs : rules.oldRegime.surchargeSlabs;

  // Find applicable surcharge slab
  let applicableSlab: SurchargeSlab | null = null;
  for (const slab of surchargeSlabs) {
    if (income.greaterThan(slab.minIncome)) {
      if (slab.maxIncome === null || income.lessThanOrEqualTo(slab.maxIncome)) {
        applicableSlab = slab;
        break;
      }
    }
  }

  if (!applicableSlab || applicableSlab.rate === 0) {
    return {
      rate: 0,
      grossSurcharge: 0,
      marginalRelief: 0,
      netSurcharge: 0,
      explanation: 'Taxable income is within ₹50,00,000; no surcharge is applicable.',
    };
  }

  const rate = applicableSlab.rate;
  const grossSurcharge = tax.times(rate);
  const threshold = D(applicableSlab.minIncome);

  // Compute tax on the threshold limit
  const taxAtThreshold = D(calculateTaxForIncomeFn(threshold.toNumber()));
  
  // Under marginal relief: (Tax + Surcharge) cannot exceed (Tax on threshold + (Income - threshold))
  const excessIncome = income.minus(threshold);
  const maxAllowableTotal = taxAtThreshold.plus(excessIncome);
  const totalTaxAndSurcharge = tax.plus(grossSurcharge);

  let marginalRelief = D(0);
  if (totalTaxAndSurcharge.greaterThan(maxAllowableTotal)) {
    marginalRelief = totalTaxAndSurcharge.minus(maxAllowableTotal);
  }

  const netSurcharge = Decimal.max(0, grossSurcharge.minus(marginalRelief));

  return {
    rate,
    grossSurcharge: roundCurrency(grossSurcharge),
    marginalRelief: roundCurrency(marginalRelief),
    netSurcharge: roundCurrency(netSurcharge),
    explanation: marginalRelief.greaterThan(0)
      ? `Surcharge of ${(rate * 100).toFixed(0)}% (₹${roundCurrency(grossSurcharge)}) reduced by marginal relief of ₹${roundCurrency(marginalRelief)} to ₹${roundCurrency(netSurcharge)}.`
      : `Surcharge of ${(rate * 100).toFixed(0)}% (₹${roundCurrency(netSurcharge)}) applied on income above ₹${threshold.dividedBy(100000)} Lakhs.`,
  };
}
