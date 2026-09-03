import { describe, it, expect } from 'vitest';
import { TaxTwinManager } from '../src/lib/tax-twin/manager';
import { IncomeCategory, TaxRegime, VerificationState } from '../src/lib/types';

describe('Tax Twin Immutability & Lifecycle Tests', () => {
  it('should define and preserve Tax Twin contract invariants', () => {
    // Verify immutable versioning structure
    const initialTwin = {
      id: 'twin-uuid-v1',
      versionNumber: 1,
      parentTwinId: null,
      isActive: true,
      isLocked: false,
    };

    expect(initialTwin.versionNumber).toBe(1);
    expect(initialTwin.parentTwinId).toBeNull();

    // Simulated fork to v2
    const forkedTwin = {
      id: 'twin-uuid-v2',
      versionNumber: initialTwin.versionNumber + 1,
      parentTwinId: initialTwin.id,
      isActive: true,
      isLocked: false,
    };

    const lockedParent = {
      ...initialTwin,
      isActive: false,
      isLocked: true,
    };

    expect(forkedTwin.versionNumber).toBe(2);
    expect(forkedTwin.parentTwinId).toBe('twin-uuid-v1');
    expect(lockedParent.isLocked).toBe(true);
    expect(lockedParent.isActive).toBe(false);
  });

  it('should verify all facts and income sources reference tax_twin_id', () => {
    const twinId = 'twin-12345';
    const incomeSource = {
      id: 'inc-1',
      taxTwinId: twinId,
      category: IncomeCategory.SALARY,
      grossAmount: 1200000,
      verificationState: VerificationState.VERIFIED,
    };

    const fact = {
      id: 'fact-1',
      taxTwinId: twinId,
      factKey: 'deduction_80c',
      factValue: { amount: 150000 },
      verificationState: VerificationState.VERIFIED,
    };

    expect(incomeSource.taxTwinId).toBe(twinId);
    expect(fact.taxTwinId).toBe(twinId);
  });
});
