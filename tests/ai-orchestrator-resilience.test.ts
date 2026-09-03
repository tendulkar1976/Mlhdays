import { describe, it, expect } from 'vitest';
import { aiOrchestrator } from '../src/packages/ai/orchestrator.js';
import { GeminiRateLimitError, GeminiTimeoutError, GeminiAuthError } from '../src/packages/ai/gemini-client.js';

describe('AI Orchestrator & Resilience Layer', () => {
  it('should process tax calculation queries and invoke deterministic tools', async () => {
    const res = await aiOrchestrator.processMessage('How much tax do I have to pay on a salary of 12 lakh?');

    expect(res.response_id).toBeDefined();
    expect(res.tools_called).toContain('calculate_tax');
    expect(res.message).toContain('Tax Calculation');
    expect(res.message).toContain('₹0'); // Tax is 0 under 87A rebate
    expect(res.disclaimer).toContain('Disclaimer');
    expect(res.trace.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it('should process regime comparison query and invoke compare_regimes tool', async () => {
    const res = await aiOrchestrator.processMessage('Which regime is better for a salary of 15 lakhs?');

    expect(res.tools_called).toContain('compare_regimes');
    expect(res.message).toContain('Tax Regime Comparison');
    expect(res.message).toContain('New Tax Regime');
  });

  it('should query statutory deadlines when asked', async () => {
    const res = await aiOrchestrator.processMessage('What is the deadline to file my income tax return?');

    expect(res.tools_called).toContain('get_deadlines');
    expect(res.message).toContain('July 31, 2026');
  });

  it('should support custom Gemini error subclasses for error resilience', () => {
    const rateLimitErr = new GeminiRateLimitError();
    expect(rateLimitErr.statusCode).toBe(429);
    expect(rateLimitErr.name).toBe('GeminiRateLimitError');

    const timeoutErr = new GeminiTimeoutError();
    expect(timeoutErr.statusCode).toBe(408);

    const authErr = new GeminiAuthError();
    expect(authErr.statusCode).toBe(401);
  });
});
