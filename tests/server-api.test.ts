import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from '../src/server.js';
import http from 'http';

const TEST_PORT = 3199;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function makeRequest(
  path: string,
  method = 'GET',
  body?: unknown
): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-tax-twin-id': 'twin_demo_v1',
        },
      },
      res => {
        let raw = '';
        res.on('data', chunk => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              data: raw ? JSON.parse(raw) : {},
            });
          } catch {
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              data: raw,
            });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

describe('HTTP REST API Server Endpoints for Member 3 Frontend Integration', () => {
  beforeAll(async () => {
    await new Promise<void>(resolve => server.listen(TEST_PORT, () => resolve()));
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it('GET /api/v1/health should return HEALTHY status with CORS headers', async () => {
    const res = await makeRequest('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('HEALTHY');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('POST /ai/chat should match Member 3 frontend schema (id, role, content, tool_execution, citations)', async () => {
    const res = await makeRequest('/ai/chat', 'POST', {
      content: 'Which regime is better for 15 lakhs salary?',
    });
    expect(res.status).toBe(200);
    expect(res.data.id).toBeDefined();
    expect(res.data.role).toBe('assistant');
    expect(res.data.content).toContain('Tax Regime Comparison');
    expect(res.data.tool_execution).toBeDefined();
    expect(res.data.tool_execution.length).toBeGreaterThan(0);
    expect(res.data.tool_execution[0].tool_name).toBe('compare_regimes');
    expect(res.data.disclaimer).toBeDefined();
  });

  it('POST /api/v1/documents/upload should parse Form 16 payload', async () => {
    const res = await makeRequest('/api/v1/documents/upload', 'POST', {
      ocr_fields: {
        employer_tan: { value: 'MUMB12345A' },
        employee_pan: { value: 'ABCDE1234F' },
        gross_salary: { value: 1600000 },
        standard_deduction_16ia: { value: 75000 },
        section_80c: { value: 150000 },
        tds_deducted: { value: 110000 },
      },
    });
    expect(res.status).toBe(200);
    expect(res.data.employer_tan.verification_state).toBe('VERIFIED');
    expect(res.data.gross_salary.value).toBe(1600000);
  });

  it('GET /api/v1/reconcile/conflicts should return the AIS interest discrepancy', async () => {
    const res = await makeRequest('/api/v1/reconcile/conflicts');
    expect(res.status).toBe(200);
    expect(res.data.conflicts_count).toBe(1);
    expect(res.data.unresolved_conflicts[0].field_name).toBe('savings_interest');
    expect(res.data.unresolved_conflicts[0].self_reported_value).toBe(12000);
    expect(res.data.unresolved_conflicts[0].ais_reported_value).toBe(18500);
  });

  it('GET /api/v1/ai/readiness should return Filing Readiness score', async () => {
    const res = await makeRequest('/api/v1/ai/readiness');
    expect(res.status).toBe(200);
    expect(res.data.filing_readiness_score).toBeDefined();
    expect(res.data.suggested_itr_form).toBe('ITR-1 (Sahaj)');
  });

  it('POST /api/v1/ai/knowledge should search RAG knowledge base with filters', async () => {
    const res = await makeRequest('/api/v1/ai/knowledge', 'POST', {
      query: 'Section 80D health insurance limit',
      financial_year: '2025-2026',
    });
    expect(res.status).toBe(200);
    expect(res.data.results.length).toBeGreaterThan(0);
    expect(res.data.results[0].chunk.section_or_topic).toContain('80D');
  });

  it('GET /api/v1/ai/deadlines should return statutory deadlines', async () => {
    const res = await makeRequest('/api/v1/ai/deadlines?category=ITR_FILING');
    expect(res.status).toBe(200);
    expect(res.data.deadlines.length).toBe(1);
    expect(res.data.deadlines[0].due_date).toBe('2026-07-31');
  });

  it('POST /api/v1/tax/calculate/stateless should compute deterministic taxes', async () => {
    const res = await makeRequest('/api/v1/tax/calculate/stateless', 'POST', {
      regime: 'NEW',
      gross_salary: 1500000,
    });
    expect(res.status).toBe(200);
    expect(res.data.total_tax).toBe(97500);
    expect(res.data.rule_version).toBe('FY2025_26_AY2026_27');
  });
});
