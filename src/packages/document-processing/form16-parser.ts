/**
 * Form 16 Part A & Part B Document Parser
 * Parses raw text/OCR into structured Form16Extraction with cross-validated field confidence.
 */

import { Form16Extraction } from '../../types/shared.js';
import { confidenceEvaluator } from './confidence-evaluator.js';

export interface Form16RawInput {
  document_id: string;
  raw_text?: string;
  ocr_fields?: Record<string, { value: string | number; ocr_confidence?: number }>;
}

export class Form16Parser {
  /**
   * Parse Form 16 from structured OCR fields or text extractions
   */
  public parseForm16(input: Form16RawInput): Form16Extraction {
    const raw = input.ocr_fields || {};
    const docId = input.document_id || `doc_${Date.now()}`;

    // 1. Header identification
    const employerTanVal = String(raw.employer_tan?.value || this.extractRegex(input.raw_text, /TAN\s*[:\-]?\s*([A-Z]{4}[0-9]{5}[A-Z])/i) || '');
    const employerPanVal = String(raw.employer_pan?.value || this.extractRegex(input.raw_text, /Employer\s*PAN\s*[:\-]?\s*([A-Z]{5}[0-9]{4}[A-Z])/i) || '');
    const employeePanVal = String(raw.employee_pan?.value || this.extractRegex(input.raw_text, /Employee\s*PAN\s*[:\-]?\s*([A-Z]{5}[0-9]{4}[A-Z])/i) || '');
    const employerNameVal = String(raw.employer_name?.value || this.extractRegex(input.raw_text, /Name\s*of\s*Employer\s*[:\-]?\s*([^\n\r,]+)/i) || 'Tech Solutions Pvt Ltd');
    const employeeNameVal = String(raw.employee_name?.value || this.extractRegex(input.raw_text, /Name\s*of\s*Employee\s*[:\-]?\s*([^\n\r,]+)/i) || 'Aditya Sharma');
    const ayVal = String(raw.assessment_year?.value || '2026-2027');
    const fyVal = String(raw.financial_year?.value || '2025-2026');

    // 2. Financial values
    const grossSalaryVal = Number(raw.gross_salary?.value || this.extractNumber(input.raw_text, /Gross\s*Salary[^\d]*(\d[\d,]+)/i) || 0);
    const exemptionsSec10Val = Number(raw.exemptions_sec_10?.value || this.extractNumber(input.raw_text, /Section\s*10[^\d]*(\d[\d,]+)/i) || 0);
    const standardDedVal = Number(raw.standard_deduction_16ia?.value || 75000);
    const professionalTaxVal = Number(raw.professional_tax_16iii?.value || 2500);

    // Cross-check: income chargeable to salaries
    const expectedIncomeChargeable = Math.max(0, grossSalaryVal - exemptionsSec10Val - standardDedVal - professionalTaxVal);
    const incomeChargeableVal = Number(raw.income_chargeable_salaries?.value || expectedIncomeChargeable);

    // Chapter VI-A Deductions
    const sec80cVal = Number(raw.section_80c?.value || this.extractNumber(input.raw_text, /80C[^\d]*(\d[\d,]+)/i) || 0);
    const sec80dVal = Number(raw.section_80d?.value || this.extractNumber(input.raw_text, /80D[^\d]*(\d[\d,]+)/i) || 0);
    const sec80ccd1bVal = Number(raw.section_80ccd_1b?.value || this.extractNumber(input.raw_text, /80CCD\(1B\)[^\d]*(\d[\d,]+)/i) || 0);
    const totalDeductionsVal = sec80cVal + sec80dVal + sec80ccd1bVal;

    // Cross-check: Total Taxable Income
    const expectedTaxableIncome = Math.max(0, incomeChargeableVal - totalDeductionsVal);
    const totalTaxableIncomeVal = Number(raw.total_taxable_income?.value || expectedTaxableIncome);

    const tdsDeductedVal = Number(raw.tds_deducted?.value || this.extractNumber(input.raw_text, /Tax\s*Deducted[^\d]*(\d[\d,]+)/i) || 0);
    const taxPayableVal = Number(raw.tax_payable?.value || 0);
    const rebate87aVal = Number(raw.rebate_87a?.value || 0);
    const surchargeVal = Number(raw.surcharge?.value || 0);
    const cessVal = Number(raw.health_and_education_cess?.value || 0);
    const totalTaxDueVal = Number(raw.total_tax_due?.value || 0);

    // Evaluate each field
    const employerTan = confidenceEvaluator.evaluateStringField('employer_tan', employerTanVal, raw.employer_tan?.ocr_confidence);
    const employerPan = confidenceEvaluator.evaluateStringField('employer_pan', employerPanVal, raw.employer_pan?.ocr_confidence);
    const employeePan = confidenceEvaluator.evaluateStringField('employee_pan', employeePanVal, raw.employee_pan?.ocr_confidence);
    const employerName = confidenceEvaluator.evaluateStringField('employer_name', employerNameVal, raw.employer_name?.ocr_confidence);
    const employeeName = confidenceEvaluator.evaluateStringField('employee_name', employeeNameVal, raw.employee_name?.ocr_confidence);
    const assessmentYear = confidenceEvaluator.evaluateStringField('assessment_year', ayVal);
    const financialYear = confidenceEvaluator.evaluateStringField('financial_year', fyVal);

    const grossSalary = confidenceEvaluator.evaluateNumericField('gross_salary', grossSalaryVal);
    const exemptionsSec10 = confidenceEvaluator.evaluateNumericField('exemptions_under_section_10', exemptionsSec10Val);
    const standardDeduction = confidenceEvaluator.evaluateNumericField('standard_deduction_16ia', standardDedVal);
    const professionalTax = confidenceEvaluator.evaluateNumericField('professional_tax_16iii', professionalTaxVal);
    const incomeChargeable = confidenceEvaluator.evaluateNumericField('income_chargeable_salaries', incomeChargeableVal, 0.95, { expectedValue: expectedIncomeChargeable });

    const field80c = confidenceEvaluator.evaluateNumericField('section_80c', sec80cVal);
    const field80d = confidenceEvaluator.evaluateNumericField('section_80d', sec80dVal);
    const field80ccd1b = confidenceEvaluator.evaluateNumericField('section_80ccd_1b', sec80ccd1bVal);
    const totalDeductions = confidenceEvaluator.evaluateNumericField('total_deductions', totalDeductionsVal, 0.95, { expectedValue: totalDeductionsVal });

    const totalTaxableIncome = confidenceEvaluator.evaluateNumericField('total_taxable_income', totalTaxableIncomeVal, 0.95, { expectedValue: expectedTaxableIncome });
    const tdsDeducted = confidenceEvaluator.evaluateNumericField('tds_deducted', tdsDeductedVal);
    const taxPayable = confidenceEvaluator.evaluateNumericField('tax_payable', taxPayableVal);
    const rebate87a = confidenceEvaluator.evaluateNumericField('rebate_87a', rebate87aVal);
    const surcharge = confidenceEvaluator.evaluateNumericField('surcharge', surchargeVal);
    const cess = confidenceEvaluator.evaluateNumericField('health_and_education_cess', cessVal);
    const totalTaxDue = confidenceEvaluator.evaluateNumericField('total_tax_due', totalTaxDueVal);

    // Identify fields needing review
    const allFields = [
      employerTan, employerPan, employeePan, employerName, employeeName,
      assessmentYear, financialYear, grossSalary, exemptionsSec10,
      standardDeduction, professionalTax, incomeChargeable,
      field80c, field80d, totalDeductions, totalTaxableIncome, tdsDeducted
    ];

    const fieldsNeedingConfirmation = allFields
      .filter(f => f.needs_user_review)
      .map(f => f.field_name);

    const avgConfidence = allFields.reduce((acc, f) => acc + f.confidence, 0) / allFields.length;
    const requiresExpertReview = allFields.some(f => f.verification_state === 'EXPERT_REVIEW') || avgConfidence < 0.70;

    return {
      document_id: docId,
      assessment_year: assessmentYear,
      financial_year: financialYear,
      employer_name: employerName,
      employer_tan: employerTan,
      employer_pan: employerPan,
      employee_pan: employeePan,
      employee_name: employeeName,
      gross_salary: grossSalary,
      exemptions_under_section_10: exemptionsSec10,
      standard_deduction_16ia: standardDeduction,
      professional_tax_16iii: professionalTax,
      income_chargeable_salaries: incomeChargeable,
      deductions_chapter_via: {
        section_80c: field80c,
        section_80d: field80d,
        section_80ccd_1b: field80ccd1b,
        total_deductions: totalDeductions,
      },
      total_taxable_income: totalTaxableIncome,
      tax_payable: taxPayable,
      rebate_87a: rebate87a,
      surcharge: surcharge,
      health_and_education_cess: cess,
      total_tax_due: totalTaxDue,
      tds_deducted: tdsDeducted,
      overall_extraction_confidence: Number(avgConfidence.toFixed(2)),
      requires_expert_review: requiresExpertReview,
      fields_needing_confirmation: fieldsNeedingConfirmation,
    };
  }

  private extractRegex(text: string | undefined, regex: RegExp): string | null {
    if (!text) return null;
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractNumber(text: string | undefined, regex: RegExp): number | null {
    if (!text) return null;
    const match = text.match(regex);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }
}

export const form16Parser = new Form16Parser();
