/**
 * Authoritative API Client Adapter for Member 3 Frontend
 * Strictly adheres to docs/API_CONTRACT.md and docs/ARCHITECTURE.md.
 * Zero client-side arithmetic. All numbers and version states come from the backend.
 */

const TAX_API_URL = process.env.NEXT_PUBLIC_TAX_API_URL || 'http://localhost:3000';
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:3002';

export const apiClient = {
  // 1. Stateless Calculation & Comparison
  async calculateStateless(payload: any) {
    const res = await fetch(`${TAX_API_URL}/api/v1/tax/calculate/stateless`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // 2. Tax Twin Initialization
  async initializeTwin(payload: any) {
    const res = await fetch(`${TAX_API_URL}/api/v1/tax/twin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // 3. Tax Twin Retrieval
  async getTwin(twinId: string) {
    const res = await fetch(`${TAX_API_URL}/api/v1/tax/twin/${twinId}`);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // 4. What-If Scenario Simulation
  async runScenario(twinId: string, payload: any) {
    const res = await fetch(`${TAX_API_URL}/api/v1/tax/twin/${twinId}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // 5. Filing Readiness Checklist
  async getReadiness(twinId: string) {
    const res = await fetch(`${TAX_API_URL}/api/v1/tax/twin/${twinId}/readiness`);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // 6. Statutory Deadlines
  async getDeadlines() {
    const res = await fetch(`${TAX_API_URL}/api/v1/tax/deadlines`);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // 7. Member 2 AI Document Extraction
  async extractDocument(payload: any) {
    const res = await fetch(`${AI_API_URL}/api/v1/ai/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // 8. Member 2 AI Reconciliation Action
  async reconcileFact(payload: any) {
    const res = await fetch(`${AI_API_URL}/api/v1/ai/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // 9. Member 2 AI Explanation
  async explainWithAI(prompt: string, calculationData?: any) {
    const res = await fetch(`${AI_API_URL}/api/v1/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, calculationData }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },
};
