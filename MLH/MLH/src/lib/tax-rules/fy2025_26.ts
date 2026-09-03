import { StatutoryRuleSet } from './types';

/**
 * Statutory Baseline Rule Set for Financial Year 2025-26 (Assessment Year 2026-27).
 * Conforms to Indian Income Tax Department guidelines, Union Budget enactments, and SHARED_CONTRACTS.md.
 */
export const RULES_FY_2025_26: StatutoryRuleSet = {
  ruleVersion: 'IN-ITD-FY2025-26-v1.0',
  financialYear: '2025-2026',
  assessmentYear: '2026-2027',
  effectiveFrom: '2025-04-01',
  isOfficialBaseline: true,

  newRegime: {
    // Standard deduction enhanced for salaried individuals
    standardDeductionSalary: 75000,
    
    // New Tax Regime Slabs (FY 2025-26 / AY 2026-27):
    // ₹0 - ₹4,00,000       : Nil
    // ₹4,00,001 - ₹8,00,000 : 5%
    // ₹8,00,001 - ₹12,00,000: 10%
    // ₹12,00,001 - ₹16,00,000: 15%
    // ₹16,00,001 - ₹20,00,000: 20%
    // ₹20,00,001 - ₹24,00,000: 25%
    // Above ₹24,00,000     : 30%
    slabs: [
      { min: 0, max: 400000, rate: 0.0 },
      { min: 400000, max: 800000, rate: 0.05 },
      { min: 800000, max: 1200000, rate: 0.10 },
      { min: 1200000, max: 1600000, rate: 0.15 },
      { min: 1600000, max: 2000000, rate: 0.20 },
      { min: 2000000, max: 2400000, rate: 0.25 },
      { min: 2400000, max: null, rate: 0.30 },
    ],

    // Section 87A rebate up to ₹60,000 for taxable income <= ₹12,00,000
    rebate87A: {
      maxTaxableIncome: 1200000,
      maxRebateAmount: 60000,
      marginalReliefEnabled: true,
    },

    // New Regime surcharge rates (capped at 25%)
    surchargeSlabs: [
      { minIncome: 5000000, maxIncome: 10000000, rate: 0.10 },
      { minIncome: 10000000, maxIncome: 20000000, rate: 0.15 },
      { minIncome: 20000000, maxIncome: null, rate: 0.25 },
    ],
  },

  oldRegime: {
    standardDeductionSalary: 50000,

    // General individuals (<60 years)
    slabsGeneral: [
      { min: 0, max: 250000, rate: 0.0 },
      { min: 250000, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: null, rate: 0.30 },
    ],

    // Senior citizens (60 to 79 years)
    slabsSeniorCitizen: [
      { min: 0, max: 300000, rate: 0.0 },
      { min: 300000, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: null, rate: 0.30 },
    ],

    // Super senior citizens (80+ years)
    slabsSuperSenior: [
      { min: 0, max: 500000, rate: 0.0 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: null, rate: 0.30 },
    ],

    // Section 87A rebate up to ₹12,500 for taxable income <= ₹5,00,000
    rebate87A: {
      maxTaxableIncome: 500000,
      maxRebateAmount: 12500,
      marginalReliefEnabled: false,
    },

    limits: {
      section80C: 150000,
      section80CCD1B: 50000,
      section80D_Self: 25000,
      section80D_Senior: 50000,
      section80TTA: 10000,
      section80TTB: 50000,
      section24b_SOP: 200000,
    },

    // Old Regime surcharge rates
    surchargeSlabs: [
      { minIncome: 5000000, maxIncome: 10000000, rate: 0.10 },
      { minIncome: 10000000, maxIncome: 20000000, rate: 0.15 },
      { minIncome: 20000000, maxIncome: 50000000, rate: 0.25 },
      { minIncome: 50000000, maxIncome: null, rate: 0.37 },
    ],
  },

  // Health & Education Cess
  cessRate: 0.04,
};
