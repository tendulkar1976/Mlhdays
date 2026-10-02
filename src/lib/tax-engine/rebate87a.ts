import Decimal from 'decimal.js';
import { D, roundCurrency } from './precision';
import { TaxRegime } from '../types';

export interface Rebate87AResult {
  eligible: boolean;
  rebateAmount: number;
  marginalReliefAmount: number;
  taxAfterRebate: number;
  explanation: string;
}

/**
 * Computes Section 87A Rebate and Marginal Relief under New and Old Regimes.
 */
export function calculateRebate87A(
  regime: TaxRegime,
  netTaxableIncome: number,
  taxOnSlabs: number,
  isResident: boolean = true
): Rebate87AResult {
  if (!isResident) {
    return {
      eligible: false,
      rebateAmount: 0,
      marginalReliefAmount: 0,
      taxAfterRebate: taxOnSlabs,
      explanation: 'Section 87A rebate is only available to Resident Individuals.',
    };
  }

  const income = D(netTaxableIncome);
  const tax = D(taxOnSlabs);

  if (regime === TaxRegime.NEW) {
    // New Regime FY 2025-26: Threshold is ₹12,00,000, Max Rebate is ₹60,000
    const threshold = D(1200000);
    const maxRebate = D(60000);

    if (income.lessThanOrEqualTo(threshold)) {
      const rebate = Decimal.min(tax, maxRebate);
      const taxAfter = Decimal.max(0, tax.minus(rebate));
      return {
        eligible: true,
        rebateAmount: roundCurrency(rebate),
        marginalReliefAmount: 0,
        taxAfterRebate: roundCurrency(taxAfter),
        explanation: `Income is within ₹12,00,000 threshold. Full Section 87A rebate of ₹${roundCurrency(rebate)} applied. Net tax is ₹0.`,
      };
    } else {
      // Check for Marginal Relief on Section 87A in New Regime:
      // Tax payable cannot exceed (Total Income - ₹12,00,000)
      const excessIncome = income.minus(threshold);
      if (tax.greaterThan(excessIncome)) {
        const marginalRelief = tax.minus(excessIncome);
        const taxAfter = excessIncome;
        return {
          eligible: true,
          rebateAmount: 0,
          marginalReliefAmount: roundCurrency(marginalRelief),
          taxAfterRebate: roundCurrency(taxAfter),
          explanation: `Marginal Relief under Section 87A applied: Tax liability restricted to excess income over ₹12,00,000 (₹${roundCurrency(excessIncome)}). Relief amount: ₹${roundCurrency(marginalRelief)}.`,
        };
      } else {
        return {
          eligible: false,
          rebateAmount: 0,
          marginalReliefAmount: 0,
          taxAfterRebate: roundCurrency(tax),
          explanation: 'Taxable income exceeds ₹12,00,000 and normal tax is lower than excess income; no Section 87A relief applies.',
        };
      }
    }
  } else {
    // Old Regime: Threshold is ₹5,00,000, Max Rebate is ₹12,500
    const threshold = D(500000);
    const maxRebate = D(12500);

    if (income.lessThanOrEqualTo(threshold)) {
      const rebate = Decimal.min(tax, maxRebate);
      const taxAfter = Decimal.max(0, tax.minus(rebate));
      return {
        eligible: true,
        rebateAmount: roundCurrency(rebate),
        marginalReliefAmount: 0,
        taxAfterRebate: roundCurrency(taxAfter),
        explanation: `Income is within ₹5,00,000. Section 87A rebate of ₹${roundCurrency(rebate)} applied. Net tax is ₹0.`,
      };
    } else {
      return {
        eligible: false,
        rebateAmount: 0,
        marginalReliefAmount: 0,
        taxAfterRebate: roundCurrency(tax),
        explanation: 'Taxable income exceeds ₹5,00,000 threshold under Old Regime; no Section 87A rebate is available.',
      };
    }
  }
}
