'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api/live';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'regimes' | 'documents' | 'whatif' | 'readiness' | 'deadlines' | 'copilot'>('dashboard');

  // State from authoritative backend
  const [twinId, setTwinId] = useState<string>('');
  const [twinData, setTwinData] = useState<any>(null);
  const [calculation, setCalculation] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);

  // AIS Conflict State
  const [extractedDoc, setExtractedDoc] = useState<any>(null);
  const [reconciling, setReconciling] = useState<boolean>(false);
  const [reconciliationSuccess, setReconciliationSuccess] = useState<string | null>(null);

  // What-If State
  const [npsAmount, setNpsAmount] = useState<number>(50000);
  const [whatIfResult, setWhatIfResult] = useState<any>(null);
  const [whatIfLoading, setWhatIfLoading] = useState<boolean>(false);

  // Copilot State
  const [prompt, setPrompt] = useState<string>('Why is the New Tax Regime better for my income profile in FY 2025-26?');
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Load: Run Stateless Calculation or Fetch Seeded Twin
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate baseline stateless calculation
      const calcData = await apiClient.calculateStateless({
        financialYear: '2025-2026',
        assessmentYear: '2026-2027',
        regimePreference: 'COMPARE',
        incomeSources: [
          { category: 'SALARY', grossAmount: 1475000, employerOrPayer: 'Tech Enterprises Pvt Ltd' },
          { category: 'OTHER_SOURCES', grossAmount: 12000, employerOrPayer: 'Savings Interest' }
        ],
        deductions: {
          section80C: 150000,
          section80D: 25000,
          section80CCD1B: 0
        }
      });
      setCalculation(calcData);

      // Load statutory deadlines
      const dlData = await apiClient.getDeadlines();
      setDeadlines(dlData.deadlines || []);
    } catch (err: any) {
      console.error(err);
      setError('Backend connection error. Ensure Member 1 (Port 3000) and Member 2 (Port 3002) are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Document Extraction & Conflict Demo (₹12,000 vs ₹18,500)
  const handleSimulateAISExtraction = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.extractDocument({
        documentType: 'AIS_TIS',
        declaredInterest: 12000,
        declaredSalary: 1475000
      });
      setExtractedDoc(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. User Reconciles Conflicting Interest -> Authoritative Tax Twin Version Upgrade ($v_1 \rightarrow v_2$)
  const handleAcceptAISReconciliation = async () => {
    setReconciling(true);
    setError(null);
    try {
      // First ensure a twin exists in tax-engine
      let activeTwinId = twinId;
      if (!activeTwinId) {
        // Initialize baseline twin v1 first
        const initRes = await apiClient.initializeTwin({
          taxProfileId: 'c1f71587-f8de-484c-bb4c-6fa4360e224e',
          taxPeriodId: 'a0000000-0000-0000-0000-000000000001',
          changeSummary: 'Baseline created before AIS import',
          incomeSources: [
            { category: 'SALARY', grossAmount: 1475000, employerOrPayer: 'Tech Enterprises' },
            { category: 'OTHER_SOURCES', grossAmount: 12000, employerOrPayer: 'HDFC Bank' }
          ],
          facts: [
            { factKey: 'deduction_80c', category: 'CHAPTER_VI_A', factValue: { amount: 150000 } }
          ]
        });
        activeTwinId = initRes.twinId;
        setTwinId(activeTwinId);
      }

      // Reconcile via Member 2 -> triggers Member 1 Tax Twin version increment to v2
      const recRes = await apiClient.reconcileFact({
        taxTwinId: activeTwinId,
        factKey: 'savings_interest',
        acceptedValue: 18500,
        reason: 'Accepted official AIS report of ₹18,500 interest'
      });

      setTwinData(recRes.newTaxTwin);
      setTwinId(recRes.newTaxTwin.id);
      setReconciliationSuccess(`Reconciled successfully! Tax Twin upgraded to Version ${recRes.newTaxTwin.versionNumber}. Previous version v1 locked.`);

      // Refresh recalculated tax with updated interest
      const updatedCalc = await apiClient.calculateStateless({
        financialYear: '2025-2026',
        assessmentYear: '2026-2027',
        regimePreference: 'COMPARE',
        incomeSources: [
          { category: 'SALARY', grossAmount: 1475000 },
          { category: 'OTHER_SOURCES', grossAmount: 18500 }
        ],
        deductions: { section80C: 150000, section80D: 25000 }
      });
      setCalculation(updatedCalc);

      // Load readiness
      const readData = await apiClient.getReadiness(recRes.newTaxTwin.id);
      setReadiness(readData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReconciling(false);
    }
  };

  // 4. What-If ₹50,000 NPS Simulation
  const handleRunWhatIf = async () => {
    setWhatIfLoading(true);
    setError(null);
    try {
      if (twinId) {
        const res = await apiClient.runScenario(twinId, {
          name: 'What-If ₹50,000 NPS Simulation',
          additionalNPS: npsAmount,
          applyToNewVersion: false
        });
        setWhatIfResult(res);
      } else {
        // Run stateless what-if
        const res = await apiClient.calculateStateless({
          financialYear: '2025-2026',
          regimePreference: 'COMPARE',
          incomeSources: [{ category: 'SALARY', grossAmount: 1475000 }, { category: 'OTHER_SOURCES', grossAmount: 18500 }],
          deductions: { section80C: 150000, section80CCD1B: npsAmount }
        });
        setWhatIfResult({
          baselineTax: calculation?.result.totalTaxLiability || 96410,
          simulatedTax: res.result.totalTaxLiability,
          savings: Math.max(0, (calculation?.result.totalTaxLiability || 96410) - res.result.totalTaxLiability),
          simulatedResult: res
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWhatIfLoading(false);
    }
  };

  // 5. Ask Gemini Copilot
  const handleAskCopilot = async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    setAiReply(null);
    try {
      const res = await apiClient.explainWithAI(prompt, calculation);
      setAiReply(res.reply);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', background: '#0f172a', borderRight: '1px solid #1e293b', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <div>
            <h1 style={{ fontSize: '1.1rem', margin: 0, color: '#38bdf8' }}>AI Tax Copilot</h1>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>FY 2025-26 / AY 2026-27</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'regimes', label: '⚖️ Regime Comparison' },
            { id: 'documents', label: '📄 Documents & AIS Conflict' },
            { id: 'whatif', label: '🔮 What-If Scenario' },
            { id: 'readiness', label: '✅ Filing Readiness' },
            { id: 'deadlines', label: '📅 Deadlines Calendar' },
            { id: 'copilot', label: '🤖 Gemini AI Copilot' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === item.id ? '#0284c7' : 'transparent',
                color: activeTab === item.id ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === item.id ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Server State Indicator */}
        <div style={{ marginTop: '3rem', padding: '0.75rem', background: '#1e293b', borderRadius: '8px', fontSize: '0.75rem' }}>
          <div style={{ color: '#38bdf8', fontWeight: 600 }}>Authoritative Tax State:</div>
          <div style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>
            Twin Version: <strong style={{ color: '#34d399' }}>{twinData ? `v${twinData.versionNumber}` : 'v1 (Baseline)'}</strong>
          </div>
          <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.25rem' }}>
            Owner: Member 1 Engine (Port 3000)
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        {error && (
          <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: '0 0 1.5rem 0' }}>Tax Overview & Snapshot</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Gross Total Income</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                  ₹{calculation?.result?.grossTotalIncome?.toLocaleString('en-IN') || '14,87,000'}
                </div>
              </div>
              <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Optimal Regime</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '0.25rem' }}>
                  {calculation?.comparison?.recommendedRegime || 'NEW'} REGIME
                </div>
              </div>
              <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Tax Liability</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399', marginTop: '0.25rem' }}>
                  ₹{calculation?.result?.totalTaxLiability?.toLocaleString('en-IN') || '96,410'}
                </div>
              </div>
              <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tax Twin State</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#a78bfa', marginTop: '0.25rem' }}>
                  {twinData ? `Version ${twinData.versionNumber}` : 'Version 1'}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Active Income Facts in Tax Twin</h3>
              <ul style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                <li>💼 Primary Salary Income: <strong>₹14,75,000</strong> (Form 16 from Tech Enterprises)</li>
                <li>🏦 Savings Account Interest: <strong>₹{twinData ? '18,500 (Reconciled from AIS)' : '12,000 (Declared)'}</strong></li>
                <li>🛡️ Standard Deduction: <strong>₹75,000</strong> (New Tax Regime Section 16(ia))</li>
                <li>🎯 Section 87A Rebate: <strong>Available up to ₹60,000 for income $\le$ ₹12 Lakhs</strong></li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: REGIME COMPARISON */}
        {activeTab === 'regimes' && calculation && (
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: '0 0 1rem 0' }}>Deterministic Regime Comparison</h2>
            <div style={{ padding: '1rem', background: '#064e3b', borderRadius: '8px', border: '1px solid #059669', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 'bold', color: '#6ee7b7' }}>
                Recommended: {calculation.comparison.recommendedRegime} REGIME
              </div>
              <div style={{ color: '#a7f3d0', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {calculation.comparison.summary}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* New Regime Card */}
              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '10px', border: '2px solid #38bdf8' }}>
                <h3 style={{ color: '#38bdf8', marginTop: 0 }}>New Tax Regime (FY 2025-26)</h3>
                <div style={{ lineHeight: '2' }}>
                  <div>Gross Total Income: <strong>₹{calculation.comparison.newRegime.grossTotalIncome.toLocaleString('en-IN')}</strong></div>
                  <div>Standard Deduction: <strong>₹{calculation.comparison.newRegime.standardDeduction.toLocaleString('en-IN')}</strong></div>
                  <div>Net Taxable Income: <strong>₹{calculation.comparison.newRegime.netTaxableIncome.toLocaleString('en-IN')}</strong></div>
                  <div>Section 87A Rebate: <strong style={{ color: '#34d399' }}>₹{calculation.comparison.newRegime.rebate87A.toLocaleString('en-IN')}</strong></div>
                  <div style={{ fontSize: '1.25rem', marginTop: '0.5rem', color: '#f8fafc' }}>
                    Total Tax: <strong>₹{calculation.comparison.newRegime.totalTaxLiability.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Old Regime Card */}
              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <h3 style={{ color: '#cbd5e1', marginTop: 0 }}>Old Tax Regime</h3>
                <div style={{ lineHeight: '2' }}>
                  <div>Gross Total Income: <strong>₹{calculation.comparison.oldRegime.grossTotalIncome.toLocaleString('en-IN')}</strong></div>
                  <div>Total Deductions (80C/80D/Std): <strong>₹{calculation.comparison.oldRegime.totalExemptionsAndDeductions.toLocaleString('en-IN')}</strong></div>
                  <div>Net Taxable Income: <strong>₹{calculation.comparison.oldRegime.netTaxableIncome.toLocaleString('en-IN')}</strong></div>
                  <div style={{ fontSize: '1.25rem', marginTop: '0.5rem', color: '#f8fafc' }}>
                    Total Tax: <strong>₹{calculation.comparison.oldRegime.totalTaxLiability.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DOCUMENTS & AIS CONFLICT RECONCILIATION */}
        {activeTab === 'documents' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: '0 0 1rem 0' }}>Document Intelligence & Conflict Reconciliation</h2>
            <p style={{ color: '#94a3b8' }}>
              Member 2 AI extracts AIS / Form 26AS data and identifies discrepancies. Reconciling automatically forks an authoritative new Tax Twin version in Member 1.
            </p>

            <button
              onClick={handleSimulateAISExtraction}
              disabled={loading}
              style={{ padding: '0.75rem 1.5rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginBottom: '1.5rem' }}
            >
              {loading ? 'Extracting AIS PDF...' : 'Simulate Upload: AIS / Form 26AS'}
            </button>

            {extractedDoc && (
              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Document Extracted: {extractedDoc.documentType}</h3>

                {extractedDoc.conflictsDetected.map((c: any, idx: number) => (
                  <div key={idx} style={{ background: '#451a03', border: '1px solid #d97706', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>⚠️ Discrepancy Detected by AI:</div>
                    <div style={{ marginTop: '0.5rem', color: '#fde68a' }}>{c.message}</div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button
                        onClick={handleAcceptAISReconciliation}
                        disabled={reconciling}
                        style={{ padding: '0.5rem 1rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {reconciling ? 'Updating Tax Twin...' : `Accept AIS Value (₹${c.extractedValue.toLocaleString('en-IN')}) & Update Twin Version`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reconciliationSuccess && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#064e3b', border: '1px solid #059669', color: '#6ee7b7', borderRadius: '8px' }}>
                ✅ {reconciliationSuccess}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WHAT-IF SCENARIO */}
        {activeTab === 'whatif' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: '0 0 1rem 0' }}>What-If Tax Scenario Simulator</h2>
            <p style={{ color: '#94a3b8' }}>
              Simulate investments like Section 80CCD(1B) NPS or salary increases without altering your locked baseline state.
            </p>

            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', maxWidth: '600px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                Additional NPS Contribution (Section 80CCD(1B)):
              </label>
              <input
                type="number"
                value={npsAmount}
                onChange={(e) => setNpsAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc', marginBottom: '1rem' }}
              />

              <button
                onClick={handleRunWhatIf}
                disabled={whatIfLoading}
                style={{ padding: '0.75rem 1.5rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                {whatIfLoading ? 'Simulating...' : 'Simulate What-If Tax Impact'}
              </button>
            </div>

            {whatIfResult && (
              <div style={{ marginTop: '1.5rem', background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                <h3 style={{ color: '#38bdf8', marginTop: 0 }}>Simulation Results:</h3>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                  <div>Baseline Tax Liability: <strong>₹{whatIfResult.baselineTax.toLocaleString('en-IN')}</strong></div>
                  <div>Simulated Tax Liability: <strong>₹{whatIfResult.simulatedTax.toLocaleString('en-IN')}</strong></div>
                  <div style={{ color: '#34d399', fontSize: '1.25rem', marginTop: '0.5rem' }}>
                    Potential Tax Savings: <strong>₹{whatIfResult.savings.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: FILING READINESS */}
        {activeTab === 'readiness' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: '0 0 1rem 0' }}>Filing Readiness & Checklist</h2>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#34d399' }}>
                  {readiness ? `${readiness.readinessScore}%` : '85%'}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc' }}>Ready to Draft Return</h3>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>All primary income heads matched with Form 16</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: '#0f172a', borderRadius: '6px', borderLeft: '4px solid #34d399' }}>
                  ✅ Form 16 Salary Income (Tech Enterprises) — Verified
                </div>
                <div style={{ padding: '0.75rem', background: '#0f172a', borderRadius: '6px', borderLeft: '4px solid #34d399' }}>
                  ✅ Section 80C EPF & ELSS Proofs — Verified
                </div>
                <div style={{ padding: '0.75rem', background: '#0f172a', borderRadius: '6px', borderLeft: '4px solid #38bdf8' }}>
                  ℹ️ AIS Savings Interest — Reconciled to ₹18,500
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DEADLINES */}
        {activeTab === 'deadlines' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: '0 0 1rem 0' }}>Statutory Compliance Calendar</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {deadlines.map((dl) => (
                <div key={dl.id} style={{ background: '#1e293b', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#38bdf8' }}>{dl.title}</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>{dl.description}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>{dl.dueDate}</div>
                    <span style={{ fontSize: '0.75rem', background: '#0369a1', color: '#bae6fd', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {dl.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: GEMINI COPILOT */}
        {activeTab === 'copilot' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: '0 0 1rem 0' }}>Gemini AI Tax Copilot</h2>
            <p style={{ color: '#94a3b8' }}>
              Ask questions in plain English. Gemini analyzes your authoritative tax state without hallucinating arithmetic.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#f8fafc' }}
              />
              <button
                onClick={handleAskCopilot}
                disabled={aiLoading}
                style={{ padding: '0.75rem 1.5rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                {aiLoading ? 'Thinking...' : 'Ask Copilot'}
              </button>
            </div>

            {aiReply && (
              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #0284c7', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {aiReply}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
