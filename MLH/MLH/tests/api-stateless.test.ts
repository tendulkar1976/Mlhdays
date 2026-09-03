import { describe, it, expect } from 'vitest';
import { StatelessCalculationRequestSchema } from '../src/lib/types';
import { compareTaxRegimes } from '../src/lib/tax-engine/comparator';
import { IncomeCategory } from '../src/lib/types';

describe('Stateless Calculation API Contracts & Validation', () => {
  it('should validate correctly formed stateless calculation payloads', () => {
    const payload = {
      financialYear: '2025-2026',
      assessmentYear: '2026-2027',
      regimePreference: 'COMPARE',
      incomeSources: [
        {
          category: IncomeCategory.SALARY,
          grossAmount: 1500000,
          employerOrPayer: 'Acme Corp',
        },
      ],
      deductions: {
        section80C: 150000,
        section80D: 25000,
      },
    };

    const parsed = StatelessCalculationRequestSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.incomeSources.length).toBe(1);
      expect(parsed.data.deductions.section80C).toBe(150000);
    }
  });

  it('should reject payload with empty income sources', () => {
    const payload = {
      financialYear: '2025-2026',
      incomeSources: [],
    };

    const parsed = StatelessCalculationRequestSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('should reject payload with negative income amount', () => {
    const payload = {
      incomeSources: [
        {
          category: IncomeCategory.SALARY,
          grossAmount: -50000,
        },
      ],
    };

    const parsed = StatelessCalculationRequestSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('should generate complete calculation response with trace and comparison', () => {
    const comparison = compareTaxRegimes(
      [
        {
          category: IncomeCategory.SALARY,
          grossAmount: 1200000,
        },
      ],
      {
        section80C: 100000,
      }
    );

    expect(comparison.newRegime.calculationTrace.length).toBeGreaterThan(0);
    expect(comparison.oldRegime.calculationTrace.length).toBeGreaterThan(0);
    expect(comparison.recommendedRegime).toBeDefined();
    expect(comparison.summary).toBeDefined();
  });
});
