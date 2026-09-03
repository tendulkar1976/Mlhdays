"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getApiClient } from "@/lib/api/client";
import { TaxTwin } from "@/types/schema";
import { RegimeComparisonResult, TaxCalculationResult } from "@/types/tax";
import { formatINR, formatDateIN } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Scale,
  ShieldCheck,
  Sparkles,
  FlaskConical,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileCheck,
  TrendingDown,
  RefreshCw,
} from "lucide-react";

export default function RegimeComparisonPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTwin, setActiveTwin] = useState<TaxTwin | null>(null);
  const [comparison, setComparison] = useState<RegimeComparisonResult | null>(null);
  const [selectedTraceRegime, setSelectedTraceRegime] = useState<"NEW" | "OLD">("NEW");
  const [showSlabsTable, setShowSlabsTable] = useState(true);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);
      const client = getApiClient();
      const twins = await client.getTaxTwins();
      const baseline = twins.find((t) => t.is_active_baseline) || twins[twins.length - 1];

      if (baseline) {
        setActiveTwin(baseline);
        const comp = await client.compareRegimes(baseline.id);
        setComparison(comp);
        setSelectedTraceRegime(comp.recommended_regime === "OLD" ? "OLD" : "NEW");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load regime comparison calculation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparisonData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="h-44 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-xl" />
          <div className="h-80 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Regime Comparison</AlertTitle>
          <AlertDescription className="mt-1">{error || "No calculation response available."}</AlertDescription>
        </Alert>
        <Button onClick={loadComparisonData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry Calculation
        </Button>
      </div>
    );
  }

  const activeTraceResult: TaxCalculationResult =
    selectedTraceRegime === "NEW" ? comparison.new_regime : comparison.old_regime;

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
              Statutory Evaluation
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">{comparison.assessment_year} ({comparison.tax_period})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Authoritative Regime Comparison
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluating your verified financial facts against both regimes using the deterministic statutory tax engine.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
            <Layers className="h-3.5 w-3.5 text-teal-600" />
            <span>Twin v{activeTwin?.version || 2}</span>
          </div>
          <Badge variant="outline" className="text-xs font-mono bg-slate-100">
            {comparison.rule_version}
          </Badge>
        </div>
      </div>

      {/* 2. Primary Decision Banner (Why this regime?) */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold border-emerald-500 bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 mr-0.5" />
                {comparison.recommended_regime} Regime Recommended
              </span>
              <span className="text-xs text-emerald-800 font-medium">Optimal Filing Choice</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Save {formatINR(comparison.net_tax_benefit_amount)} by selecting {comparison.recommended_regime} Regime
            </h2>
            <p className="text-sm text-slate-700 max-w-3xl leading-relaxed">
              {comparison.recommendation_rationale}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
            <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs">
              <Link href="/copilot">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-purple-400" /> Ask Gemini Why
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-teal-400 text-teal-900 bg-white hover:bg-teal-50 text-xs">
              <Link href="/what-if">
                <FlaskConical className="h-3.5 w-3.5 mr-1.5 text-teal-600" /> Simulate What-If
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Hero Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NEW REGIME CARD */}
        <Card className={`border-2 transition shadow-sm ${
          comparison.recommended_regime === "NEW"
            ? "border-teal-500 bg-teal-50/20"
            : "border-slate-200 bg-white"
        }`}>
          <CardHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">New Tax Regime</CardTitle>
                <Badge variant="regime_new">Sec 115BAC</Badge>
              </div>
              {comparison.recommended_regime === "NEW" && (
                <Badge variant="regime_recommended">Recommended</Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Lower progressive slabs (0-4L Nil to &gt;24L 30%) with standard deduction &amp; Sec 87A rebate.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-baseline justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Final Tax Payable</div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {formatINR(comparison.new_regime.total_tax)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Effective Rate</div>
                <div className="text-sm font-bold text-slate-800 font-mono">
                  {comparison.new_regime.effective_tax_rate_percent}%
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Gross Total Income:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatINR(comparison.new_regime.gross_total_income)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  Standard Deduction (Sec 16(ia)):
                </span>
                <span className="font-semibold text-teal-800 font-mono">
                  -{formatINR(comparison.new_regime.standard_deduction)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Taxable Net Income:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatINR(comparison.new_regime.taxable_income)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tax before Rebate:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatINR(comparison.new_regime.tax_before_rebate)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  Section 87A Rebate:
                </span>
                <span className="font-semibold text-slate-700 font-mono">
                  {comparison.new_regime.rebate > 0 ? `-${formatINR(comparison.new_regime.rebate)}` : "₹0 (Income > ₹12L)"}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Health &amp; Education Cess (4%):</span>
                <span className="font-semibold text-slate-900 font-mono">
                  +{formatINR(comparison.new_regime.cess)}
                </span>
              </div>
            </div>

            {comparison.new_regime.warnings.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                {comparison.new_regime.warnings.map((w, i) => (
                  <p key={i}>• {w}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OLD REGIME CARD */}
        <Card className={`border-2 transition shadow-sm ${
          comparison.recommended_regime === "OLD"
            ? "border-blue-500 bg-blue-50/20"
            : "border-slate-200 bg-white"
        }`}>
          <CardHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">Old Tax Regime</CardTitle>
                <Badge variant="regime_old">Standard Slabs</Badge>
              </div>
              {comparison.recommended_regime === "OLD" && (
                <Badge variant="regime_recommended">Recommended</Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Traditional slabs with standard deduction (₹50k) and Chapter VI-A deductions (80C, 80D, 24b).
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-baseline justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Final Tax Payable</div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {formatINR(comparison.old_regime.total_tax)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Effective Rate</div>
                <div className="text-sm font-bold text-slate-800 font-mono">
                  {comparison.old_regime.effective_tax_rate_percent}%
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Gross Total Income:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatINR(comparison.old_regime.gross_total_income)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  Total Deductions Claimed:
                </span>
                <span className="font-semibold text-blue-800 font-mono">
                  -{formatINR(comparison.old_regime.deductions_total)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Taxable Net Income:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatINR(comparison.old_regime.taxable_income)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tax before Rebate:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatINR(comparison.old_regime.tax_before_rebate)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Section 87A Rebate:</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {comparison.old_regime.rebate > 0 ? `-${formatINR(comparison.old_regime.rebate)}` : "₹0"}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Health &amp; Education Cess (4%):</span>
                <span className="font-semibold text-slate-900 font-mono">
                  +{formatINR(comparison.old_regime.cess)}
                </span>
              </div>
            </div>

            {comparison.old_regime.assumptions.length > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                {comparison.old_regime.assumptions.map((a, i) => (
                  <p key={i}>• {a}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Slab-Wise Visualization (Rendered from API Brackets) */}
      <section className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Statutory Slab Brackets Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative progressive tax distribution computed across statutory brackets for FY 2025-26.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTraceRegime("NEW")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedTraceRegime === "NEW"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              New Regime Slabs
            </button>
            <button
              onClick={() => setSelectedTraceRegime("OLD")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedTraceRegime === "OLD"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Old Regime Slabs
            </button>
          </div>
        </div>

        {/* Slabs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Slab Range (₹)</th>
                <th className="py-2.5 px-3">Statutory Rate</th>
                <th className="py-2.5 px-3">Taxable in Bracket</th>
                <th className="py-2.5 px-3 text-right">Tax in Bracket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTraceResult.slabs.map((slab) => {
                const rangeLabel =
                  slab.to_amount === null
                    ? `Above ${formatINR(slab.from_amount)}`
                    : `${formatINR(slab.from_amount)} – ${formatINR(slab.to_amount)}`;

                return (
                  <tr key={slab.slab_index} className={slab.tax_amount_in_slab > 0 ? "bg-slate-50/50" : ""}>
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{rangeLabel}</td>
                    <td className="py-2 px-3 font-semibold text-slate-700">{slab.rate_percent}%</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{formatINR(slab.taxable_amount_in_slab)}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900 text-right">
                      {formatINR(slab.tax_amount_in_slab)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-bold bg-slate-50">
                <td className="py-2.5 px-3" colSpan={3}>
                  Tax Before Cess &amp; Rebate:
                </td>
                <td className="py-2.5 px-3 font-mono text-right text-slate-900">
                  {formatINR(activeTraceResult.tax_before_rebate)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* 5. Deterministic Calculation Trace (Major Differentiator) */}
      <section className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Deterministic Calculation Audit Trace
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditable execution log of every statutory formula and deduction step for {selectedTraceRegime} Regime.
            </p>
          </div>

          <Badge variant="outline" className="text-xs">
            {activeTraceResult.calculation_trace.length} Calculation Steps Logged
          </Badge>
        </div>

        {/* Step-by-Step Flow */}
        <div className="space-y-3">
          {activeTraceResult.calculation_trace.map((step) => (
            <div
              key={step.step}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 font-bold text-white text-[10px]">
                    {step.step}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{step.label}</span>
                  <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-mono font-semibold text-teal-800 border border-teal-200">
                    {step.section_or_rule}
                  </span>
                </div>
                <p className="text-slate-600 pl-7">{step.explanation}</p>
              </div>

              <div className="sm:text-right pl-7 sm:pl-0 shrink-0">
                <div className="font-mono font-extrabold text-slate-900 text-sm">
                  {step.amount < 0 ? `-${formatINR(Math.abs(step.amount))}` : formatINR(step.amount)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Balance: {formatINR(step.running_balance)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Trust & Audit Authority Panel */}
      <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-xs text-slate-600 space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Statutory Authority &amp; Immutability Guarantee</span>
        </div>
        <p className="leading-relaxed">
          Calculations are produced by the authoritative backend engine according to the Finance Act provisions for{" "}
          <strong>{comparison.assessment_year}</strong>. Calculation ID: <code>{activeTraceResult.calculation_id}</code>. Rule Version: <code>{comparison.rule_version}</code>.
        </p>
        <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-slate-500 font-mono">
          <span>Twin ID: {activeTraceResult.tax_twin_id}</span>
          <span>•</span>
          <span>Computed: {formatDateIN(activeTraceResult.created_at)}</span>
          <span>•</span>
          <span>Zero Client Math Invariant: Verified</span>
        </div>
      </section>
    </div>
  );
}