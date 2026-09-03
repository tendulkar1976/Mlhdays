'use client';

import React, { useState } from 'react';

export default function HomePage() {
  const [salary, setSalary] = useState<number>(1500000);
  const [otherIncome, setOtherIncome] = useState<number>(20000);
  const [sec80C, setSec80C] = useState<number>(150000);
  const [sec80D, setSec80D] = useState<number>(25000);
  const [sec80CCD, setSec80CCD] = useState<number>(50000);
  const [hra, setHra] = useState<number>(0);
  const [sec24b, setSec24b] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Gemini AI Chat State
  const [chatPrompt, setChatPrompt] = useState<string>('How much tax will I pay on 12.75 Lakhs salary under the new regime in FY 2025-26?');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [toolUsed, setToolUsed] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        financialYear: '2025-2026',
        assessmentYear: '2026-2027',
        regimePreference: 'COMPARE',
        incomeSources: [
          {
            category: 'SALARY',
            grossAmount: Number(salary) || 0,
            employerOrPayer: 'Primary Employer',
          },
          ...(Number(otherIncome) > 0
            ? [
                {
                  category: 'OTHER_SOURCES',
                  grossAmount: Number(otherIncome),
                  employerOrPayer: 'Interest / Other',
                },
              ]
            : []),
        ],
        deductions: {
          section80C: Number(sec80C) || 0,
          section80D: Number(sec80D) || 0,
          section80CCD1B: Number(sec80CCD) || 0,
          hraExemption: Number(hra) || 0,
          section24b: Number(sec24b) || 0,
        },
      };

      const res = await fetch('/api/v1/tax/calculate/stateless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || errData.error || 'Failed to calculate');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAskGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);
    setToolUsed(null);

    try {
      const res = await fetch('/api/v1/tax/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatPrompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to call Gemini AI');
      }

      setAiResponse(data.reply);
      setToolUsed(data.toolUsed);
    } catch (err: any) {
      setAiError(err.message || 'Error communicating with Gemini');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#38bdf8', margin: 0, fontSize: '1.875rem' }}>AI Personal Tax Copilot</h1>
        <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
          Deterministic Statutory Tax Engine (FY 2025-26 / AY 2026-27) + Server-Side Gemini AI Copilot
        </p>
      </header>

      {/* Top Grid: Calculator & Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Left Column: Interactive Calculator */}
        <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            ⚡ Live Tax Engine Tester
          </h2>

          <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                Gross Salary Income (₹)
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                Other Income / Savings Interest (₹)
              </label>
              <input
                type="number"
                value={otherIncome}
                onChange={(e) => setOtherIncome(Number(e.target.value))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc' }}
              />
            </div>

            <div style={{ borderTop: '1px dashed #475569', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Deductions (Old Regime)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1' }}>Section 80C (Max ₹1.5L)</label>
                <input
                  type="number"
                  value={sec80C}
                  onChange={(e) => setSec80C(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1' }}>Section 80D (Mediclaim)</label>
                <input
                  type="number"
                  value={sec80D}
                  onChange={(e) => setSec80D(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1' }}>Section 80CCD(1B) NPS</label>
                <input
                  type="number"
                  value={sec80CCD}
                  onChange={(e) => setSec80CCD(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1' }}>HRA Exemption (10(13A))</label>
                <input
                  type="number"
                  value={hra}
                  onChange={(e) => setHra(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Computing Tax...' : 'Run Deterministic Tax Calculation'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#7f1d1d', color: '#fecaca', borderRadius: '6px' }}>
              {error}
            </div>
          )}
        </section>

        {/* Right Column: Results & Comparison */}
        <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            📊 Calculation Output
          </h2>

          {!result ? (
            <div style={{ color: '#94a3b8', marginTop: '2rem', textAlign: 'center' }}>
              <p>Click <strong>"Run Deterministic Tax Calculation"</strong> to calculate and compare New vs Old tax regimes.</p>
            </div>
          ) : (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Recommendation Banner */}
              <div style={{ padding: '0.875rem', background: '#064e3b', border: '1px solid #059669', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#6ee7b7' }}>
                  Recommended: {result.comparison.recommendedRegime} REGIME
                </div>
                <div style={{ fontSize: '0.875rem', color: '#a7f3d0', marginTop: '0.25rem' }}>
                  {result.comparison.summary}
                </div>
              </div>

              {/* Side by side comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: '#0f172a', padding: '0.875rem', borderRadius: '8px', border: result.comparison.recommendedRegime === 'NEW' ? '2px solid #38bdf8' : '1px solid #334155' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#38bdf8' }}>New Regime</h3>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Taxable Income:</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>₹{result.comparison.newRegime.netTaxableIncome.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>87A Rebate:</div>
                  <div style={{ color: '#34d399' }}>₹{result.comparison.newRegime.rebate87A.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Total Tax:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f8fafc' }}>₹{result.comparison.newRegime.totalTaxLiability.toLocaleString('en-IN')}</div>
                </div>

                <div style={{ background: '#0f172a', padding: '0.875rem', borderRadius: '8px', border: result.comparison.recommendedRegime === 'OLD' ? '2px solid #38bdf8' : '1px solid #334155' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0' }}>Old Regime</h3>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Taxable Income:</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>₹{result.comparison.oldRegime.netTaxableIncome.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Deductions:</div>
                  <div style={{ color: '#38bdf8' }}>₹{result.comparison.oldRegime.totalExemptionsAndDeductions.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Total Tax:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f8fafc' }}>₹{result.comparison.oldRegime.totalTaxLiability.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Section: Gemini AI Tax Copilot */}
      <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #0284c7' }}>
        <h2 style={{ fontSize: '1.25rem', marginTop: 0, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🤖 Gemini AI Tax Copilot (Natural Language Guidance)
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '-0.25rem' }}>
          Ask tax questions in plain English. Gemini automatically calls our deterministic tax engine behind the scenes to ensure 100% mathematical accuracy.
        </p>

        <form onSubmit={handleAskGemini} style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <input
            type="text"
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder="e.g. Can I claim Section 87A rebate if my salary is 12.5 Lakhs?"
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc' }}
          />
          <button
            type="submit"
            disabled={aiLoading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {aiLoading ? 'Thinking...' : 'Ask Copilot'}
          </button>
        </form>

        {aiError && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#7f1d1d', color: '#fecaca', borderRadius: '6px', fontSize: '0.875rem' }}>
            {aiError}
          </div>
        )}

        {aiResponse && (
          <div style={{ marginTop: '1.25rem', background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            {toolUsed && (
              <div style={{ display: 'inline-block', fontSize: '0.75rem', background: '#0369a1', color: '#bae6fd', padding: '0.2rem 0.6rem', borderRadius: '4px', marginBottom: '0.75rem' }}>
                ⚙️ Tool Executed: {toolUsed}
              </div>
            )}
            <div style={{ color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.925rem' }}>
              {aiResponse}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
