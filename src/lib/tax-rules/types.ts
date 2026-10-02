export interface TaxSlab {
  min: number;
  max: number | null; // null represents infinity / no upper limit
  rate: number;       // decimal percentage e.g. 0.05 for 5%
}

export interface SurchargeSlab {
  minIncome: number;
  maxIncome: number | null;
  rate: number;
}

export interface StatutoryRuleSet {
  ruleVersion: string;
  financialYear: string;
  assessmentYear: string;
  effectiveFrom: string;
  isOfficialBaseline: boolean;

  newRegime: {
    standardDeductionSalary: number;
    slabs: TaxSlab[];
    rebate87A: {
      maxTaxableIncome: number;
      maxRebateAmount: number;
      marginalReliefEnabled: boolean;
    };
    surchargeSlabs: SurchargeSlab[];
  };

  oldRegime: {
    standardDeductionSalary: number;
    slabsGeneral: TaxSlab[];       // Age < 60
    slabsSeniorCitizen: TaxSlab[]; // Age 60 to 79
    slabsSuperSenior: TaxSlab[];   // Age 80+
    rebate87A: {
      maxTaxableIncome: number;
      maxRebateAmount: number;
      marginalReliefEnabled: boolean;
    };
    limits: {
      section80C: number;
      section80CCD1B: number;
      section80D_Self: number;
      section80D_Senior: number;
      section80TTA: number;
      section80TTB: number;
      section24b_SOP: number;
    };
    surchargeSlabs: SurchargeSlab[];
  };

  cessRate: number; // e.g. 0.04 (4%)
}
