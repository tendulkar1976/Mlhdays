"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getApiClient } from "@/lib/api/client";
import { TaxTwin } from "@/types/schema";
import { WhatIfScenarioResult, WhatIfScenarioInput } from "@/types/tax";
import { formatINR, formatDateIN } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  FlaskConical,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Lock,
  Plus,
  Scale,
  RefreshCw,
} from "lucide-react";

export default function WhatIfPage() {
  const [loading, setLoading] = useState(true);
  const [activeTwin, setActiveTwin] = useState<TaxTwin | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Simulation form state
  const [scenarioCategory, setScenarioCategory] = useState<
    "DEDUCTION_80CCD_NPS" | "DEDUCTION_80D" | "INCOME_HOUSE_PROPERTY" | "DEDUCTION_80C"
  >("DEDUCTION_80CCD_NPS");
  const [scenarioAmount, setScenarioAmount] = useState<number>(50000);
  const [scenarioName, setScenarioName] = useState<string>("Voluntary NPS Tier-1 Contribution");

  // Simulation run state
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<WhatIfScenarioResult | null>(null);

  // Apply modal & transition state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedResult, setAppliedResult] = useState<{ newTwin: TaxTwin; message: string } | null>(null);

  const loadTwin = async () => {
    try {
      setLoading(true);
      setError(null);
      const client = getApiClient();
      const twins = await client.getTaxTwins();
      const baseline = twins.find((t) => t.is_active_baseline) || twins[twins.length - 1];
      if (baseline) {
        setActiveTwin(baseline);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load active Tax Twin baseline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTwin();
  }, []);

  const handleRunSimulation = async (
    category = scenarioCategory,
    amount = scenarioAmount,
    name = scenarioName
  ) => {
    if (!activeTwin || amount <= 0 || simulating) return;

    try {
      setSimulating(true);
      setError(null);
      const client = getApiClient();

      let fieldName = "nps_tier1_voluntary";
      let displayLabel = "Voluntary NPS (80CCD(1B))";

      if (category === "DEDUCTION_80D") {
        fieldName = "mediclaim_premium";
        displayLabel = "Health Insurance (80D)";
      } else if (category === "INCOME_HOUSE_PROPERTY") {
        fieldName = "home_loan_interest";
        displayLabel = "Home Loan Interest (24b)";
      } else if (category === "DEDUCTION_80C") {
        fieldName = "section_80c_elss";
        displayLabel = "ELSS / PPF Investment (80C)";
      }

      const input: WhatIfScenarioInput = {
        baseline_twin_id: activeTwin.id,
        scenario_name: name,
        description: `Simulating ${displayLabel} of ₹${amount.toLocaleString("en-IN")}`,
        proposed_modifications: [
          {
            category: category,
            field_name: fieldName,
            display_label: displayLabel,
            delta_amount: amount,
          },
        ],
      };

      const result = await client.runWhatIfSimulation(input);
      setSimulationResult(result);
      setAppliedResult(null);
    } catch (err: any) {
      setError(err.message || "Simulation engine encountered an error.");
    } finally {
      setSimulating(false);
    }
  };

  const handleApplyScenario = async () => {
    if (!simulationResult) return;

    try {
      setApplying(true);
      const client = getApiClient();
      const res = await client.applyWhatIfScenario(simulationResult.scenario_id);

      setAppliedResult({
        newTwin: res.new_twin,
        message: res.message,
      });
      setActiveTwin(res.new_twin);
      setIsApplyModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to apply scenario to Tax Twin.");
    } finally {
      setApplying(false);
    }
  };

  const handleDiscard = () => {
    setSimulationResult(null);
    setAppliedResult(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="h-44 bg-slate-200 rounded-2xl" />
        <div className="h-72 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1">
              <FlaskConical className="h-3.5 w-3.5" /> What-If Tax Scenario Lab
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">AY 2026-27</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Financial Decision Simulator
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Simulate investments, deductions, or regime switches in an isolated sandbox. Your official Tax Twin will not change.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-teal-50 border-teal-200 text-teal-800 font-semibold px-3 py-1">
            <Layers className="h-3.5 w-3.5 mr-1 text-teal-600" />
            Twin v{activeTwin?.version || 3} Active Baseline
          </Badge>
          <Badge variant="secondary" className="text-xs bg-purple-50 border-purple-200 text-purple-800 font-medium">
            Sandbox Mode
          </Badge>
        </div>
      </div>

      {/* 2. Success Transition Banner after Applying Scenario */}
      {appliedResult && (
        <Alert variant="info" className="border-emerald-300 bg-emerald-50/90 text-emerald-950 p-5 rounded-2xl shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <AlertTitle className="text-sm font-bold text-emerald-900">
              Tax Twin v{appliedResult.newTwin.version} Created &amp; Sealed!
            </AlertTitle>
            <AlertDescription className="text-xs text-emerald-800 leading-relaxed">
              {appliedResult.message}
            </AlertDescription>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button asChild size="sm" className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs h-8">
                <Link href="/tax-twin">
                  Explore Twin v{appliedResult.newTwin.version} Timeline <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-emerald-300 text-emerald-900 bg-white text-xs h-8">
                <Link href="/dashboard">
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* 3. Quick Scenario Presets */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick Scenario Presets
          </h2>
          <span className="text-[11px] text-slate-400">Click to instantly test financial moves</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Preset 1: NPS */}
          <button
            type="button"
            onClick={() => {
              setScenarioCategory("DEDUCTION_80CCD_NPS");
              setScenarioAmount(50000);
              setScenarioName("Invest ₹50,000 in NPS Tier-1");
              handleRunSimulation("DEDUCTION_80CCD_NPS", 50000, "Invest ₹50,000 in NPS Tier-1");
            }}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/30 transition text-left space-y-1.5 shadow-2xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                NPS Contribution
              </span>
              <Badge variant="outline" className="text-[10px] bg-slate-50">80CCD(1B)</Badge>
            </div>
            <div className="text-lg font-mono font-extrabold text-teal-700">₹50,000</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Evaluate additional voluntary pension investment.
            </p>
          </button>

          {/* Preset 2: Health Insurance */}
          <button
            type="button"
            onClick={() => {
              setScenarioCategory("DEDUCTION_80D");
              setScenarioAmount(25000);
              setScenarioName("Pay ₹25,000 Health Insurance Premium");
              handleRunSimulation("DEDUCTION_80D", 25000, "Pay ₹25,000 Health Insurance Premium");
            }}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/30 transition text-left space-y-1.5 shadow-2xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                Health Mediclaim
              </span>
              <Badge variant="outline" className="text-[10px] bg-slate-50">Sec 80D</Badge>
            </div>
            <div className="text-lg font-mono font-extrabold text-teal-700">₹25,000</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Test tax impact of family health policy premium.
            </p>
          </button>

          {/* Preset 3: Home Loan */}
          <button
            type="button"
            onClick={() => {
              setScenarioCategory("INCOME_HOUSE_PROPERTY");
              setScenarioAmount(200000);
              setScenarioName("Home Loan Interest (₹2,00,000)");
              handleRunSimulation("INCOME_HOUSE_PROPERTY", 200000, "Home Loan Interest (₹2,00,000)");
            }}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/30 transition text-left space-y-1.5 shadow-2xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                Home Loan Interest
              </span>
              <Badge variant="outline" className="text-[10px] bg-slate-50">Sec 24(b)</Badge>
            </div>
            <div className="text-lg font-mono font-extrabold text-teal-700">₹2,00,000</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Simulate interest deduction for self-occupied property.
            </p>
          </button>

          {/* Preset 4: ELSS */}
          <button
            type="button"
            onClick={() => {
              setScenarioCategory("DEDUCTION_80C");
              setScenarioAmount(150000);
              setScenarioName("Max Out Section 80C");
              handleRunSimulation("DEDUCTION_80C", 150000, "Max Out Section 80C");
            }}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/30 transition text-left space-y-1.5 shadow-2xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                Section 80C Limit
              </span>
              <Badge variant="outline" className="text-[10px] bg-slate-50">Sec 80C</Badge>
            </div>
            <div className="text-lg font-mono font-extrabold text-teal-700">₹1,50,000</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Test ELSS &amp; PF contributions cap impact.
            </p>
          </button>
        </div>
      </section>

      {/* 4. Custom Scenario Builder */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900">Custom Scenario Simulator</h3>
        <p className="text-xs text-slate-500">
          Enter any investment or deduction amount to see deterministic impact on both regimes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700">Deduction / Investment Category</label>
            <select
              value={scenarioCategory}
              onChange={(e) => {
                const val = e.target.value as any;
                setScenarioCategory(val);
                if (val === "DEDUCTION_80CCD_NPS") {
                  setScenarioName("Voluntary NPS Tier-1 Contribution");
                  setScenarioAmount(50000);
                } else if (val === "DEDUCTION_80D") {
                  setScenarioName("Health Insurance Premium");
                  setScenarioAmount(25000);
                } else if (val === "INCOME_HOUSE_PROPERTY") {
                  setScenarioName("Home Loan Interest Payment");
                  setScenarioAmount(200000);
                } else {
                  setScenarioName("Tax Saving Mutual Fund (ELSS)");
                  setScenarioAmount(150000);
                }
              }}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="DEDUCTION_80CCD_NPS">Section 80CCD(1B) — NPS Tier-1 (up to ₹50k)</option>
              <option value="DEDUCTION_80D">Section 80D — Medical Insurance (Self &amp; Family)</option>
              <option value="INCOME_HOUSE_PROPERTY">Section 24(b) — Home Loan Interest Loss</option>
              <option value="DEDUCTION_80C">Section 80C — ELSS, PPF, Life Insurance</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Scenario Amount (₹)</label>
            <Input
              type="number"
              min={1000}
              step={5000}
              value={scenarioAmount}
              onChange={(e) => setScenarioAmount(Number(e.target.value))}
              className="mt-1.5 h-9 bg-white text-xs font-mono"
            />
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
              Formatted: {formatINR(scenarioAmount)}
            </span>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => handleRunSimulation()}
              disabled={simulating || scenarioAmount <= 0}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 font-semibold shadow-xs"
            >
              {simulating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  Run Simulation <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Simulation Result Screen */}
      {simulationResult && (
        <section className="bg-white rounded-2xl border-2 border-teal-500 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          {/* Header of Results */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">
                  Simulation Outcome
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-500">{simulationResult.name}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Tax Impact Analysis
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscard}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Discard
              </Button>
              <Button
                size="sm"
                onClick={() => setIsApplyModalOpen(true)}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs"
              >
                Apply to Tax Twin <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {/* 3 Metric Cards: Baseline vs Scenario vs Tax Delta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Current Baseline Tax
              </span>
              <div className="text-2xl font-mono font-extrabold text-slate-900">
                {formatINR(simulationResult.baseline_calculation.new_regime.total_tax)}
              </div>
              <span className="text-[11px] text-teal-800 font-semibold">New Regime (Active Twin)</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Old Regime (Simulated)
              </span>
              <div className="text-2xl font-mono font-extrabold text-slate-900">
                {formatINR(simulationResult.simulated_calculation.old_regime.total_tax)}
              </div>
              <span className="text-[11px] text-blue-800 font-semibold">Includes proposed deduction</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-xs font-medium text-emerald-800 uppercase tracking-wide">
                Recommended Outcome
              </span>
              <div className="text-2xl font-mono font-black text-emerald-700">
                {simulationResult.simulated_calculation.recommended_regime} Regime
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">
                Save {formatINR(simulationResult.simulated_calculation.net_tax_benefit_amount)}
              </span>
            </div>
          </div>

          {/* Explainability Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-teal-600" />
              Statutory Explanation &amp; Rationale
            </div>
            <p className="leading-relaxed text-slate-700">
              {simulationResult.description}
            </p>
            <div className="text-[10px] text-slate-400 font-mono pt-1">
              Deterministic simulation executed against rule version {simulationResult.baseline_calculation.rule_version}. Zero frontend math.
            </div>
          </div>
        </section>
      )}

      {/* 6. Apply Confirmation Modal */}
      {isApplyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsApplyModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Apply Scenario to Official Tax Twin?
                </h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 space-y-2 text-teal-950">
                <div className="font-bold flex items-center gap-1.5 text-xs text-teal-900">
                  <Lock className="h-4 w-4 text-teal-700" />
                  Immutability Architecture Safeguard
                </div>
                <p className="leading-relaxed text-teal-900">
                  Applying this scenario will create <strong>Tax Twin v{(activeTwin?.version || 3) + 1}</strong> with the proposed modification.
                </p>
                <p className="text-[11px] text-teal-800 font-medium">
                  • Your previous <strong>Tax Twin v{activeTwin?.version || 3}</strong> will remain permanently sealed.<br />
                  • Your new baseline will become active for all future filing calculations.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-slate-700">
                <div className="flex justify-between font-medium">
                  <span>Scenario Applied:</span>
                  <span className="font-semibold text-slate-900">{simulationResult?.name}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>New Active Baseline:</span>
                  <span className="font-mono font-bold text-teal-800">
                    Tax Twin v{(activeTwin?.version || 3) + 1}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsApplyModalOpen(false)}
                disabled={applying}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApplyScenario}
                disabled={applying}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
              >
                {applying ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Generating Twin v{(activeTwin?.version || 3) + 1}...
                  </>
                ) : (
                  <>
                    Confirm &amp; Spawn Twin v{(activeTwin?.version || 3) + 1}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}