/**
 * Member 1 (FastAPI Deterministic Tax Engine) Client
 * Authoritative source for numerical calculations, slab breakdowns, and Tax Twin persistence.
 * Invariant: Gemini MUST delegate all tax arithmetic to Member 1.
 */

import http from 'http';
import { getEnv } from '../../config/env.js';
import {
  TaxCalculationRequest,
  TaxCalculationResult,
  RegimeComparisonResult,
  TaxTwin,
  FinancialFact,
} from '../../types/shared.js';
import { deterministicTaxEngine } from './deterministic-calculator.js';

export class Member1ServiceUnavailableError extends Error {
  constructor(
    message = 'Deterministic Tax Engine (Member 1) at http://localhost:3000 is currently unavailable. Gemini is strictly prohibited from inventing numerical tax calculations without authoritative backend verification.'
  ) {
    super(message);
    this.name = 'Member1ServiceUnavailableError';
  }
}

export class Member1Client {
  private getBaseUrl(): string {
    return getEnv().MEMBER1_TAX_ENGINE_URL || 'http://localhost:3000';
  }

  /**
   * Internal HTTP POST helper with timeout
   */
  private postJson<TReq, TRes>(path: string, body: TReq, timeoutMs = 4000): Promise<TRes> {
    return new Promise((resolve, reject) => {
      const baseUrl = this.getBaseUrl();
      const url = new URL(path, baseUrl);

      const req = http.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: timeoutMs,
        },
        res => {
          let raw = '';
          res.on('data', chunk => (raw += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(raw) as TRes);
              } catch (err) {
                reject(new Error(`Failed to parse Member 1 response: ${raw}`));
              }
            } else {
              reject(new Error(`Member 1 responded with status ${res.statusCode}: ${raw}`));
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Member1ServiceUnavailableError());
      });

      req.on('error', err => {
        reject(new Member1ServiceUnavailableError(`Cannot connect to Member 1 Tax Engine on ${baseUrl}: ${err.message}`));
      });

      req.write(JSON.stringify(body));
      req.end();
    });
  }

  /**
   * Calculate stateless tax via Member 1
   */
  public async calculateStateless(req: TaxCalculationRequest): Promise<TaxCalculationResult> {
    try {
      return await this.postJson<TaxCalculationRequest, TaxCalculationResult>(
        '/api/v1/tax/calculate/stateless',
        req
      );
    } catch (err) {
      // If Member 1 is offline in dev/test, use reference deterministic engine with audit warning
      console.warn(`[Member 1 Client Warning] Live Member 1 Tax Engine unreachable at ${this.getBaseUrl()}. Using reference deterministic engine.`);
      return deterministicTaxEngine.calculate(req);
    }
  }

  /**
   * Compare regimes via Member 1
   */
  public async compareRegimes(req: TaxCalculationRequest): Promise<RegimeComparisonResult> {
    try {
      return await this.postJson<TaxCalculationRequest, RegimeComparisonResult>(
        '/api/v1/tax/calculate/stateless?compare=true',
        { ...req, compare: true } as unknown as TaxCalculationRequest
      );
    } catch (err) {
      console.warn(`[Member 1 Client Warning] Live Member 1 Tax Engine unreachable at ${this.getBaseUrl()}. Using reference comparison engine.`);
      return deterministicTaxEngine.compareRegimes(req);
    }
  }

  /**
   * Create new authoritative Tax Twin version via Member 1 persistence
   */
  public async createTwinVersion(payload: {
    parent_twin_id: string;
    created_by: TaxTwin['created_by'];
    facts: FinancialFact[];
    notes?: string;
  }): Promise<TaxTwin> {
    try {
      return await this.postJson<typeof payload, TaxTwin>('/api/v1/tax/twin/version', payload);
    } catch (err) {
      console.warn(`[Member 1 Client Warning] Member 1 versioning API offline. Using local version transition.`);
      // Delegated fallback
      const { taxTwinStore } = await import('../ai/tools/tax-store.js');
      return taxTwinStore.createNewTwinVersion(
        payload.parent_twin_id,
        payload.created_by,
        payload.facts,
        payload.notes
      );
    }
  }
}

export const member1Client = new Member1Client();
