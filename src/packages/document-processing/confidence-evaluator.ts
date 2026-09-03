/**
 * Field-level Confidence Scorer and Verification State Evaluator
 * States: VERIFIED | NEEDS_CONFIRMATION | CONFLICT | EXPERT_REVIEW
 */

import { VerificationState, ExtractedField } from '../../types/shared.js';

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
export const AY_REGEX = /^20[2-3][0-9]-20[2-3][0-9]$|^20[2-3][0-9]-[2-3][0-9]$/;

export class ConfidenceEvaluator {
  /**
   * Evaluate string format fields (PAN, TAN, AY, Employer Name)
   */
  public evaluateStringField(
    fieldName: string,
    value: string,
    rawOcrConfidence = 0.95
  ): ExtractedField<string> {
    const trimmed = (value || '').trim().toUpperCase();
    let confidence = rawOcrConfidence;
    let verificationState: VerificationState = 'VERIFIED';
    let needsUserReview = false;

    if (!trimmed) {
      return {
        field_name: fieldName,
        value: '',
        confidence: 0.0,
        verification_state: 'EXPERT_REVIEW',
        needs_user_review: true,
      };
    }

    if (fieldName.toLowerCase().includes('pan')) {
      if (PAN_REGEX.test(trimmed)) {
        confidence = Math.max(confidence, 0.98);
        verificationState = 'VERIFIED';
      } else {
        confidence = Math.min(confidence, 0.60);
        verificationState = 'NEEDS_CONFIRMATION';
        needsUserReview = true;
      }
    } else if (fieldName.toLowerCase().includes('tan')) {
      if (TAN_REGEX.test(trimmed)) {
        confidence = Math.max(confidence, 0.98);
        verificationState = 'VERIFIED';
      } else {
        confidence = Math.min(confidence, 0.60);
        verificationState = 'NEEDS_CONFIRMATION';
        needsUserReview = true;
      }
    } else if (fieldName.toLowerCase().includes('assessment_year') || fieldName.toLowerCase().includes('financial_year')) {
      if (AY_REGEX.test(trimmed)) {
        confidence = Math.max(confidence, 0.95);
        verificationState = 'VERIFIED';
      } else {
        confidence = 0.65;
        verificationState = 'NEEDS_CONFIRMATION';
        needsUserReview = true;
      }
    } else {
      if (confidence >= 0.95) {
        verificationState = 'VERIFIED';
      } else if (confidence >= 0.70) {
        verificationState = 'NEEDS_CONFIRMATION';
        needsUserReview = true;
      } else {
        verificationState = 'EXPERT_REVIEW';
        needsUserReview = true;
      }
    }

    return {
      field_name: fieldName,
      value: trimmed,
      confidence: Number(confidence.toFixed(2)),
      verification_state: verificationState,
      needs_user_review: needsUserReview,
    };
  }

  /**
   * Evaluate financial amount field with mathematical boundary checking
   */
  public evaluateNumericField(
    fieldName: string,
    value: number,
    rawOcrConfidence = 0.95,
    expectedRelation?: { expectedValue: number; tolerance?: number }
  ): ExtractedField<number> {
    const num = isNaN(value) ? 0 : value;
    let confidence = rawOcrConfidence;
    let verificationState: VerificationState = 'VERIFIED';
    let needsUserReview = false;

    if (num < 0 && !fieldName.includes('loss')) {
      confidence = 0.40;
      verificationState = 'EXPERT_REVIEW';
      needsUserReview = true;
    } else if (expectedRelation) {
      const tol = expectedRelation.tolerance || 5; // tolerance for rounding
      const diff = Math.abs(num - expectedRelation.expectedValue);
      if (diff <= tol) {
        confidence = Math.max(confidence, 0.98);
        verificationState = 'VERIFIED';
      } else {
        confidence = 0.65;
        verificationState = 'NEEDS_CONFIRMATION';
        needsUserReview = true;
      }
    } else {
      if (confidence >= 0.95) {
        verificationState = 'VERIFIED';
      } else if (confidence >= 0.70) {
        verificationState = 'NEEDS_CONFIRMATION';
        needsUserReview = true;
      } else {
        verificationState = 'EXPERT_REVIEW';
        needsUserReview = true;
      }
    }

    return {
      field_name: fieldName,
      value: num,
      confidence: Number(confidence.toFixed(2)),
      verification_state: verificationState,
      needs_user_review: needsUserReview,
    };
  }
}

export const confidenceEvaluator = new ConfidenceEvaluator();
