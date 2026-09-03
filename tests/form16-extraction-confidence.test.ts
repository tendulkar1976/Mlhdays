import { describe, it, expect } from 'vitest';
import { form16Parser } from '../src/packages/document-processing/form16-parser.js';
import { confidenceEvaluator } from '../src/packages/document-processing/confidence-evaluator.js';

describe('Form 16 Extraction & Field Confidence Evaluator', () => {
  it('should validate PAN format regex correctly and assign VERIFIED state', () => {
    const validPan = confidenceEvaluator.evaluateStringField('employee_pan', 'ABCDE1234F');
    expect(validPan.verification_state).toBe('VERIFIED');
    expect(validPan.confidence).toBeGreaterThanOrEqual(0.95);
    expect(validPan.needs_user_review).toBe(false);

    const invalidPan = confidenceEvaluator.evaluateStringField('employee_pan', 'INVALID123');
    expect(invalidPan.verification_state).toBe('NEEDS_CONFIRMATION');
    expect(invalidPan.needs_user_review).toBe(true);
  });

  it('should parse Form 16 payload and cross-check mathematical consistency', () => {
    const mockForm16 = form16Parser.parseForm16({
      document_id: 'doc_f16_test_01',
      ocr_fields: {
        employer_tan: { value: 'MUMB12345A', ocr_confidence: 0.99 },
        employer_pan: { value: 'ABCDE5678G', ocr_confidence: 0.99 },
        employee_pan: { value: 'ABCDE1234F', ocr_confidence: 0.99 },
        gross_salary: { value: 1500000, ocr_confidence: 0.98 },
        standard_deduction_16ia: { value: 75000, ocr_confidence: 0.99 },
        professional_tax_16iii: { value: 2500, ocr_confidence: 0.99 },
        income_chargeable_salaries: { value: 1422500, ocr_confidence: 0.98 }, // 15L - 75k - 2.5k
        section_80c: { value: 150000, ocr_confidence: 0.97 },
        total_taxable_income: { value: 1272500, ocr_confidence: 0.98 },
        tds_deducted: { value: 95000, ocr_confidence: 0.99 },
      },
    });

    expect(mockForm16.employer_tan.verification_state).toBe('VERIFIED');
    expect(mockForm16.gross_salary.value).toBe(1500000);
    expect(mockForm16.income_chargeable_salaries.verification_state).toBe('VERIFIED');
    expect(mockForm16.overall_extraction_confidence).toBeGreaterThan(0.90);
    expect(mockForm16.requires_expert_review).toBe(false);
  });

  it('should flag anomalies for EXPERT_REVIEW if taxable income is inconsistent', () => {
    const anomalyForm16 = form16Parser.parseForm16({
      document_id: 'doc_anomaly_01',
      ocr_fields: {
        employee_pan: { value: 'ABCDE1234F', ocr_confidence: 0.99 },
        gross_salary: { value: -50000, ocr_confidence: 0.50 }, // negative salary
      },
    });

    expect(anomalyForm16.gross_salary.verification_state).toBe('EXPERT_REVIEW');
    expect(anomalyForm16.requires_expert_review).toBe(true);
  });
});
