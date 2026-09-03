"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getApiClient } from "@/lib/api/client";
import { TaxTwin, FinancialFact } from "@/types/schema";
import { RegimeComparisonResult } from "@/types/tax";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, VerificationBadge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ShieldCheck,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  MessageSquare,
  FlaskConical,
  FileCheck2,
  ListTodo,
  CheckCircle2,
  Zap,
} from "lucide-react";

export default function MarketingLandingPage() {
  const [loading, setLoading] = useState(true);
  const [twin, setTwin] = useState<TaxTwin | null>(null);
  const [facts, setFacts] = useState<FinancialFact[]>([]);
  const [comparison, setComparison] = useState<RegimeComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const client = getApiClient();
        const twins = await client.getTaxTwins();
        const activeTwin = twins.find((t) => t.is_active_baseline) || twins[0];

        if (activeTwin) {
          const { twin: t, facts: f } = await client.getTaxTwin(activeTwin.id);
          setTwin(t);
          setFacts(f);
          const comp = await client.compareRegimes(activeTwin.id);
          setComparison(comp);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load tax copilot data");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              ₹
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">TaxCopilot</span>
              <span className="text-teal-700 font-semibold text-xs ml-2 px-2.5 py-0.5 bg-teal-50 rounded-full border border-teal-200">
                FY 2025-26 / AY 2026-27
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="hidden sm:inline-flex text-xs text-emerald-800 bg-emerald-50 border-emerald-200 font-medium">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Finance Act 2025 Ready
            </Badge>
            <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
              <Link href="/dashboard">
                Launch Workspace <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white via-slate-50 to-teal-50/20 rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl space-y-5 relative z-10">
            <Badge className="bg-teal-100 text-teal-800 border-teal-300 px-3 py-1 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-600" /> AI Personal Tax Copilot & Immutable Tax Twin
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Smarter, Deterministic Personal Tax Guidance for Indian Taxpayers
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Eliminate regime confusion and notice risk with an immutable <strong>Tax Twin</strong>,
              authoritative <strong>Finance Act 2025</strong> tax engine, and server-side <strong>Gemini AI</strong> orchestration.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 text-white shadow-md">
                <Link href="/onboarding">
                  Get Started (1-Click Demo) <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-300 hover:bg-slate-100">
                <Link href="/login">Sign In to Workspace</Link>
              </Button>
            </div>
          </div>

          {/* Architectural Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-200">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-teal-100/80 text-teal-800 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Immutable Tax Twin</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Financial facts are sealed into versioned snapshots (v1 → v2). Reconciliations never overwrite historical audit trails.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-100/80 text-emerald-800 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Deterministic Engine</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tax arithmetic, Section 87A rebates, and slab calculations are computed authoritatively. Zero mental math.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-purple-100/80 text-purple-800 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Grounded Gemini AI</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Gemini explains provisions with statutory citations (Section 115BAC, 16(ia), 80D) using controlled backend tools.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Navigation Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Explore Core Capabilities</h2>
            <span className="text-xs text-slate-500">Live Workspace Modules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/copilot"
              className="p-5 rounded-2xl border bg-white hover:border-teal-500 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">AI Tax Copilot</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ask arbitrary tax questions with instant legal citations and controlled tool execution.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Launch Copilot <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>

            <Link
              href="/what-if"
              className="p-5 rounded-2xl border bg-white hover:border-teal-500 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">What-If Lab</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Model NPS (80CCD 1B), medical (80D), and home loan (24b) contributions without mutating baseline facts.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open Sandbox <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>

            <Link
              href="/documents"
              className="p-5 rounded-2xl border bg-white hover:border-teal-500 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">AIS Reconciliation</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Auto-detect ₹6,500 bank interest conflicts and reconcile to prevent Section 139(9) notices.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Review Documents <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>

            <Link
              href="/action-plan"
              className="p-5 rounded-2xl border bg-white hover:border-teal-500 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ListTodo className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Action Plan & Readiness</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Track 83% filing readiness score and statutory compliance deadlines before July 31.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                View Readiness <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </div>
        </section>

        {/* Live Tax Twin & Regime Comparison Showcase */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Live Tax Twin & Regime Comparison
              </h2>
              <p className="text-xs text-slate-500">
                Authoritative calculations computed via Finance Act 2025 rule engine.
              </p>
            </div>
            {twin && (
              <Badge variant="outline" className="font-mono text-xs bg-slate-100 w-fit">
                Active Snapshot: Twin v{twin.version} ({twin.id})
              </Badge>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>API Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              <div className="h-64 bg-slate-200 rounded-2xl" />
              <div className="h-64 bg-slate-200 rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Regime Comparison Summary Card */}
              {comparison && (
                <Card className="lg:col-span-2 shadow-sm border bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Authoritative Regime Comparison</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Statutory Baseline: <span className="font-mono text-slate-700 font-medium">{comparison.rule_version}</span> ({comparison.tax_period})
                        </CardDescription>
                      </div>
                      <Badge variant="regime_recommended" className="text-xs">
                        Recommended: {comparison.recommended_regime} Regime
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* New Regime Box */}
                      <div className="p-4 rounded-xl border-2 border-teal-500/40 bg-teal-50/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-teal-900">New Tax Regime</span>
                          <Badge variant="regime_new">Sec 115BAC</Badge>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {formatINR(comparison.new_regime.total_tax)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Effective rate: {comparison.new_regime.effective_tax_rate_percent}% on {formatINR(comparison.new_regime.taxable_income)}
                        </div>
                      </div>

                      {/* Old Regime Box */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-800">Old Tax Regime</span>
                          <Badge variant="regime_old">Standard Slabs</Badge>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {formatINR(comparison.old_regime.total_tax)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Effective rate: {comparison.old_regime.effective_tax_rate_percent}% on {formatINR(comparison.old_regime.taxable_income)}
                        </div>
                      </div>
                    </div>

                    <Alert variant="info" className="py-2.5">
                      <Info className="w-4 h-4" />
                      <AlertTitle className="text-xs font-semibold">Statutory Benefit Rationale</AlertTitle>
                      <AlertDescription className="text-xs mt-0.5 leading-relaxed">
                        {comparison.recommendation_rationale}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {/* Tax Twin Facts Card */}
              <Card className="shadow-sm border bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Tax Twin Facts</CardTitle>
                    <span className="text-xs text-slate-500">{facts.length} facts registered</span>
                  </div>
                  <CardDescription className="text-xs">
                    Immutable financial facts attached to active snapshot.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {facts.slice(0, 4).map((fact) => (
                    <div
                      key={fact.id}
                      className="p-2.5 rounded-lg border bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-900">{fact.display_label}</div>
                        <div className="text-slate-400 text-[10px]">{fact.source_document || "Self-reported"}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-semibold text-slate-900">{formatINR(fact.amount)}</div>
                        <VerificationBadge state={fact.verification_state} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 text-center text-xs text-slate-400">
        <p>© 2026 TaxCopilot AI. Built with deterministic accuracy under Finance Act 2025.</p>
      </footer>
    </div>
  );
}