import http from 'http';
import { aiOrchestrator } from './packages/ai/orchestrator.js';
import { form16Parser } from './packages/document-processing/form16-parser.js';
import { reconciliationAssistant } from './packages/document-processing/reconciliation-assistant.js';
import { taxKnowledgeRetriever } from './packages/rag/retriever.js';
import { deterministicTaxEngine } from './packages/tax-engine/deterministic-calculator.js';
import { taxTwinStore } from './packages/ai/tools/tax-store.js';
import { executeToolCall } from './packages/ai/tools/definitions.js';
import { getEnv } from './config/env.js';
import { TaxCalculationRequest, TaxRegime } from './types/shared.js';

const env = getEnv();
const PORT = env.PORT || 3000;

function parseJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : ({} as T));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-tax-twin-id',
  });
  res.end(JSON.stringify(data, null, 2));
}

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-tax-twin-id',
    });
    return res.end();
  }

  try {
    // 1. Healthcheck
    if ((pathname === '/api/v1/health' || pathname === '/health') && method === 'GET') {
      return sendJson(res, 200, {
        status: 'HEALTHY',
        service: 'AI Tax Copilot — Member 2 Intelligence Engine',
        statutory_baseline: 'FY 2025-26 / AY 2026-27',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. AI Chat Orchestrator (POST /api/v1/ai/chat OR /ai/chat)
    if ((pathname === '/api/v1/ai/chat' || pathname === '/ai/chat') && method === 'POST') {
      const body = await parseJsonBody<{
        message?: string;
        prompt?: string;
        content?: string;
        history?: [];
        tax_twin_id?: string;
      }>(req);

      const userPrompt = body.message || body.prompt || body.content;
      if (!userPrompt) {
        return sendJson(res, 400, { error: 'Missing required field: "message", "prompt", or "content"' });
      }

      const activeTwinId = body.tax_twin_id || (req.headers['x-tax-twin-id'] as string) || 'twin_demo_v1';
      const response = await aiOrchestrator.processMessage(userPrompt, body.history || [], activeTwinId);
      return sendJson(res, 200, response);
    }

    // 3. Document Upload / Extraction (POST /api/v1/ai/extract OR /api/v1/documents/extract OR /api/v1/documents/upload)
    if (
      (pathname === '/api/v1/ai/extract' ||
        pathname === '/api/v1/documents/extract' ||
        pathname === '/api/v1/documents/upload') &&
      method === 'POST'
    ) {
      const body = await parseJsonBody<{
        document_id?: string;
        document_type?: 'FORM_16' | 'AIS_TIS' | 'FORM_26AS';
        raw_text?: string;
        ocr_fields?: Record<string, { value: string | number; ocr_confidence?: number }>;
      }>(req);

      const extraction = form16Parser.parseForm16({
        document_id: body.document_id || `doc_${Date.now()}`,
        raw_text: body.raw_text,
        ocr_fields: body.ocr_fields,
      });

      return sendJson(res, 200, extraction);
    }

    // 4. Reconciliation Discrepancy Detection (POST /api/v1/ai/reconcile OR /api/v1/reconcile)
    if ((pathname === '/api/v1/ai/reconcile' || pathname === '/api/v1/reconcile') && method === 'POST') {
      const body = await parseJsonBody<{
        tax_twin_id?: string;
        action?: 'COMPARE' | 'APPLY_CONFIRMATION';
        extraction?: Parameters<typeof reconciliationAssistant.reconcileDocumentWithTwin>[1];
        confirmed_decisions?: { field_name: string; chosen_value: number; verification_state: 'VERIFIED' }[];
      }>(req);

      const twinId = body.tax_twin_id || (req.headers['x-tax-twin-id'] as string) || 'twin_demo_v1';

      if (body.action === 'APPLY_CONFIRMATION' && body.confirmed_decisions) {
        const newTwin = await reconciliationAssistant.applyConfirmedReconciliation(twinId, body.confirmed_decisions);
        return sendJson(res, 200, {
          message: 'Reconciliation applied successfully. New immutable Tax Twin created.',
          new_tax_twin: newTwin,
        });
      }

      if (!body.extraction) {
        return sendJson(res, 400, { error: 'Missing required field: "extraction"' });
      }

      const comparison = reconciliationAssistant.reconcileDocumentWithTwin(twinId, body.extraction);
      return sendJson(res, 200, comparison);
    }

    // 5. Conflicts check (GET /api/v1/tax/twin/:id/conflicts OR /api/v1/reconcile/conflicts)
    if (pathname.includes('/conflicts') && method === 'GET') {
      const twinId = (req.headers['x-tax-twin-id'] as string) || 'twin_demo_v1';
      const conflictsRes = await executeToolCall('get_tax_twin_conflicts', { tax_twin_id: twinId });
      return sendJson(res, 200, conflictsRes.data);
    }

    // 6. Filing Readiness (GET /api/v1/tax/twin/:id/readiness OR /api/v1/ai/readiness)
    if (pathname.includes('/readiness') && method === 'GET') {
      const twinId = (req.headers['x-tax-twin-id'] as string) || 'twin_demo_v1';
      const readinessRes = await executeToolCall('get_filing_readiness', { tax_twin_id: twinId });
      return sendJson(res, 200, readinessRes.data);
    }

    // 7. RAG Tax Knowledge Search (POST /api/v1/ai/knowledge)
    if (pathname === '/api/v1/ai/knowledge' && method === 'POST') {
      const body = await parseJsonBody<{
        query: string;
        financial_year?: string;
        assessment_year?: string;
        section_or_topic?: string;
        top_k?: number;
      }>(req);

      if (!body.query) {
        return sendJson(res, 400, { error: 'Missing required field: "query"' });
      }

      const results = await taxKnowledgeRetriever.searchKnowledge(body);
      return sendJson(res, 200, {
        query: body.query,
        count: results.length,
        results: results,
      });
    }

    // 8. Statutory Deadlines (GET /api/v1/ai/deadlines)
    if (pathname === '/api/v1/ai/deadlines' && method === 'GET') {
      const category = url.searchParams.get('category') || undefined;
      const deadlines = taxKnowledgeRetriever.getDeadlines(category);
      return sendJson(res, 200, {
        financial_year: '2025-2026',
        assessment_year: '2026-2027',
        deadlines: deadlines,
      });
    }

    // 9. Deterministic Tax Calculation — Stateless (POST /api/v1/tax/calculate/stateless)
    if (pathname === '/api/v1/tax/calculate/stateless' && method === 'POST') {
      const body = await parseJsonBody<TaxCalculationRequest & { compare?: boolean }>(req);
      if (body.compare) {
        const comparison = deterministicTaxEngine.compareRegimes(body);
        return sendJson(res, 200, comparison);
      }
      const result = deterministicTaxEngine.calculate(body);
      return sendJson(res, 200, result);
    }

    // 10. Twin Data Lookups (GET /api/v1/tax/twin/:id)
    if (pathname.startsWith('/api/v1/tax/twin/') && method === 'GET') {
      const twinId = pathname.split('/').pop() || 'twin_demo_v1';
      const twin = taxTwinStore.getTaxTwin(twinId);
      if (!twin) {
        return sendJson(res, 404, { error: `Tax Twin ${twinId} not found` });
      }
      const facts = taxTwinStore.getFactsByTwinId(twinId);
      return sendJson(res, 200, {
        tax_twin: twin,
        facts: facts,
      });
    }

    // 404 Catch-all
    return sendJson(res, 404, {
      error: 'Not Found',
      available_endpoints: [
        'GET /api/v1/health',
        'POST /api/v1/ai/chat (or /ai/chat)',
        'POST /api/v1/ai/extract (or /api/v1/documents/upload)',
        'POST /api/v1/ai/reconcile',
        'GET /api/v1/reconcile/conflicts',
        'GET /api/v1/ai/readiness',
        'POST /api/v1/ai/knowledge',
        'GET /api/v1/ai/deadlines',
        'POST /api/v1/tax/calculate/stateless',
        'GET /api/v1/tax/twin/:id',
      ],
    });
  } catch (err: unknown) {
    const error = err as Error;
    return sendJson(res, 500, {
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[AI Tax Copilot] Server running at http://localhost:${PORT}`);
    console.log(`[Statutory Baseline] FY 2025-26 / AY 2026-27`);
  });
}
