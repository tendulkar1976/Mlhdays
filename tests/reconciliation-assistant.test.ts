import { describe, it, expect } from 'vitest';
import { form16Parser } from '../src/packages/document-processing/form16-parser.js';
import { reconciliationAssistant } from '../src/packages/document-processing/reconciliation-assistant.js';
import { taxTwinStore } from '../src/packages/ai/tools/tax-store.js';

describe('AI Reconciliation Assistant', () => {
  it('should detect discrepancies between Form 16 and baseline Tax Twin without silent overwrite', () => {
    // Twin has salary 14,50,000; Form 16 has 15,00,000
    const extraction = form16Parser.parseForm16({
      document_id: 'doc_recon_01',
      ocr_fields: {
        gross_salary: { value: 1500000 },
        section_80c: { value: 150000 },
        tds_deducted: { value: 95000 }, // Twin has 85,000
      },
    });

    const recon = reconciliationAssistant.reconcileDocumentWithTwin('twin_demo_v1', extraction);

    expect(recon.requires_user_confirmation).toBe(true);
    expect(recon.can_auto_reconcile).toBe(false); // Invariant: must not silently overwrite
    expect(recon.discrepancies.length).toBeGreaterThan(0);

    const salaryDiscrepancy = recon.discrepancies.find(d => d.field_name === 'gross_salary');
    expect(salaryDiscrepancy).toBeDefined();
    expect(salaryDiscrepancy?.verification_state).toBe('CONFLICT');
    expect(salaryDiscrepancy?.difference_amount).toBe(50000);
  });

  it('should detect the exact Demo Conflict: Self-Reported Interest ₹12,000 vs AIS/TIS ₹18,500 (Delta: ₹6,500)', () => {
    // AIS/TIS document upload with interest 18,500
    const aisExtraction = {
      document_id: 'doc_ais_tis_2025_26',
      document_type: 'AIS_TIS' as const,
      savings_interest: { value: 18500, confidence: 0.99 },
    };

    const recon = reconciliationAssistant.reconcileDocumentWithTwin('twin_demo_v1', aisExtraction);

    expect(recon.requires_user_confirmation).toBe(true);
    const interestDiscrepancy = recon.discrepancies.find(d => d.field_name === 'savings_interest');
    expect(interestDiscrepancy).toBeDefined();
    expect(interestDiscrepancy?.current_twin_value).toBe(12000);
    expect(interestDiscrepancy?.extracted_doc_value).toBe(18500);
    expect(interestDiscrepancy?.difference_amount).toBe(6500);
    expect(interestDiscrepancy?.verification_state).toBe('CONFLICT');
  });

  it('should create a new immutable Tax Twin version when reconciliation is confirmed', async () => {
    const parentTwinBefore = taxTwinStore.getTaxTwin('twin_demo_v1');
    expect(parentTwinBefore?.is_baseline).toBe(true);

    const updatedTwin = await reconciliationAssistant.applyConfirmedReconciliation('twin_demo_v1', [
      { field_name: 'gross_salary', chosen_value: 1500000, verification_state: 'VERIFIED' },
      { field_name: 'tds_salary', chosen_value: 95000, verification_state: 'VERIFIED' },
      { field_name: 'savings_interest', chosen_value: 18500, verification_state: 'VERIFIED' },
    ]);

    expect(updatedTwin.version).toBe(2);
    expect(updatedTwin.is_baseline).toBe(true);
    expect(parentTwinBefore?.is_baseline).toBe(false); // Old baseline archived

    // Verify facts are attached strictly to new twin version ID
    const newFacts = taxTwinStore.getFactsByTwinId(updatedTwin.id);
    expect(newFacts.length).toBeGreaterThan(0);
    const updatedSalaryFact = newFacts.find(f => f.field_name === 'gross_salary');
    expect(updatedSalaryFact?.amount).toBe(1500000);
    expect(updatedSalaryFact?.tax_twin_id).toBe(updatedTwin.id);

    const updatedInterestFact = newFacts.find(f => f.field_name === 'savings_interest');
    expect(updatedInterestFact?.amount).toBe(18500);
    expect(updatedInterestFact?.tax_twin_id).toBe(updatedTwin.id);
    expect(updatedInterestFact?.verification_state).toBe('VERIFIED');
  });
});
