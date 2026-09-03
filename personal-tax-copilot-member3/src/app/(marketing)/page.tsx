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
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
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
    <div className="min-h-screen bg-slate-50">
      {/* Top Banner */}
      <div className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              ₹
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">TaxCopilot</span>
              <span className="text-teal-600 font-semibold text-xs ml-1.5 px-2 py-0.5 bg-teal-50 rounded-full border border-teal-200">
                FY 2025-26 / AY 2026-27
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-xs text-slate-600 bg-slate-100/80">
              Mock Adapter Active
            </Badge>
            <Button asChild size="sm" variant="default" className="bg-slate-900 hover:bg-slate-800">
              <Link href="/dashboard">
                Launch Workspace <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <section className="bg-white rounded-2xl border p-8 shadow-sm">
          <div className="max-w-3xl space-y-4">
            <Badge variant="regime_recommended" className="px-3 py-1">
              Phase 1 & 2 Application Shell Live
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              AI-Powered Personal Tax Copilot for Indian Taxpayers
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Engineered with an immutable <strong>Tax Twin</strong> architecture, deterministic statutory
              tax calculation engine, and server-side <strong>Gemini AI</strong> guidance.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white">
                <Link href="/dashboard">
                  Enter Taxpayer Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Architectural Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 mt-1">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Immutable Tax Twin</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Taxpayer facts are versioned snapshots (v1 &rarr; v2). Corrections never overwrite historical audit trails.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 mt-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Deterministic Engine</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tax arithmetic, rebates, and slab math are strictly authoritative via backend APIs. Zero client-side math.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700 mt-1">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Server-Side Gemini AI</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Gemini explains statutory provisions through controlled tools. API keys remain strictly server-side.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live API Adapter Test & Component Verification */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Design System & Typed API Adapter Verification
              </h2>
              <p className="text-sm text-slate-500">
                Validating contract compliance, responsive cards, accessible verification badges, and INR formatting.
              </p>
            </div>
            {twin && (
              <Badge variant="outline" className="font-mono text-xs bg-slate-100">
                Active: Twin v{twin.version} ({twin.id})
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
              <div className="h-64 bg-slate-200 rounded-xl" />
              <div className="h-64 bg-slate-200 rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Regime Comparison Summary Card */}
              {comparison && (
                <Card className="lg:col-span-2 shadow-sm border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Authoritative Regime Comparison</CardTitle>
                        <CardDescription className="mt-1">
                          Rule Version: <span className="font-mono">{comparison.rule_version}</span> ({comparison.tax_period})
                        </CardDescription>
                      </div>
                      <Badge variant="regime_recommended">
                        Recommended: {comparison.recommended_regime} Regime
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* New Regime Box */}
                      <div className="p-5 rounded-xl border-2 border-teal-500/40 bg-teal-50/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-teal-900">New Tax Regime</span>
                          <Badge variant="regime_new">Sec 115BAC</Badge>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {formatINR(comparison.new_regime.total_tax)}
                        </div>
                        <div className="text-xs text-slate-500">
                          Effective rate: {comparison.new_regime.effective_tax_rate_percent}% on {formatINR(comparison.new_regime.taxable_income)}
                        </div>
                      </div>

                      {/* Old Regime Box (Neutral styling, non-prejudiced) */}
                      <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-slate-800">Old Tax Regime</span>
                          <Badge variant="regime_old">Standard Slabs</Badge>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {formatINR(comparison.old_regime.total_tax)}
                        </div>
                        <div className="text-xs text-slate-500">
                          Effective rate: {comparison.old_regime.effective_tax_rate_percent}% on {formatINR(comparison.old_regime.taxable_income)}
                        </div>
                      </div>
                    </div>

                    <Alert variant="info">
                      <Info className="w-4 h-4" />
                      <AlertTitle>Statutory Benefit Rationale</AlertTitle>
                      <AlertDescription className="text-xs mt-1">
                        {comparison.recommendation_rationale}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {/* Tax Twin Facts Card */}
              <Card className="shadow-sm border">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Tax Twin Facts</CardTitle>
                    <span className="text-xs text-slate-500">{facts.length} facts registered</span>
                  </div>
                  <CardDescription>
                    Immutable financial facts attached to active snapshot.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {facts.slice(0, 4).map((fact) => (
                    <div
                      key={fact.id}
                      className="p-3 rounded-lg border bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-900">{fact.display_label}</div>
                        <div className="text-slate-400 text-[11px]">{fact.source_document || "Self-reported"}</div>
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
    </div>
  );
}