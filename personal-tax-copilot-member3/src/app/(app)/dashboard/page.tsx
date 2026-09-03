"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getApiClient } from "@/lib/api/client";
import { TaxTwin, FinancialFact, TaxProfile } from "@/types/schema";
import { RegimeComparisonResult, ActionPlanItem, TaxDeadlineItem } from "@/types/tax";
import { formatINR, formatDateIN } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, VerificationBadge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  Layers,
  Scale,
  Sparkles,
  FileText,
  FlaskConical,
  CheckSquare,
  ArrowRight,
  TrendingDown,
  Info,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<TaxProfile | null>(null);
  const [activeTwin, setActiveTwin] = useState<TaxTwin | null>(null);
  const [facts, setFacts] = useState<FinancialFact[]>([]);
  const [comparison, setComparison] = useState<RegimeComparisonResult | null>(null);
  const [actionItems, setActionItems] = useState<ActionPlanItem[]>([]);
  const [deadlines, setDeadlines] = useState<TaxDeadlineItem[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const client = getApiClient();

      // Parallel fetch via typed API adapter
      const [prof, twins, actions, dls] = await Promise.all([
        client.getTaxProfile(),
        client.getTaxTwins(),
        client.getActionPlan(),
        client.getDeadlines(),
      ]);

      setProfile(prof);
      setActionItems(actions);
      setDeadlines(dls);

      const baseline = twins.find((t) => t.is_active_baseline) || twins[twins.length - 1];
      if (baseline) {
        setActiveTwin(baseline);
        const [{ facts: f }, comp] = await Promise.all([
          client.getTaxTwin(baseline.id),
          client.compareRegimes(baseline.id),
        ]);
        setFacts(f);
        setComparison(comp);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard tax data from API adapter.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Verification counts
  const verifiedCount = facts.filter((f) => f.verification_state === "VERIFIED").length;
  const needsConfirmCount = facts.filter((f) => f.verification_state === "NEEDS_CONFIRMATION").length;
  const conflictCount = facts.filter((f) => f.verification_state === "CONFLICT").length;
  const expertReviewCount = facts.filter((f) => f.verification_state === "EXPERT_REVIEW").length;

  // Filing readiness score calculation based on verified state and action items
  const readinessScore = facts.length > 0
    ? Math.round((verifiedCount / facts.length) * 60 + (conflictCount === 0 ? 20 : 0) + 20)
    : 40;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="h-56 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Taxpayer Dashboard</AlertTitle>
          <AlertDescription className="mt-1">{error}</AlertDescription>
        </Alert>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry Fetch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Page Header with Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
              Taxpayer Command Center
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">AY 2026-27 (FY 2025-26)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {profile?.full_name || "Taxpayer"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Your personal tax baseline is synced with <strong>Tax Twin v{activeTwin?.version || 1}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline" className="border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100">
            <Link href="/copilot">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-teal-600" /> Ask AI Copilot
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
            <Link href="/documents">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Upload Form 16 / AIS
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Tax Summary Hero (Answers: How much tax may I owe? Which regime is better?) */}
      {comparison && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="regime_recommended" className="text-xs">
                  Recommended: {comparison.recommended_regime} Regime
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  Rule Version: {comparison.rule_version}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                Estimated Tax Liability Overview
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated against statutory slab rates for FY 2025-26. No client-side approximations.
              </p>
            </div>

            {comparison.net_tax_benefit_amount > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-right">
                <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                  Net Tax Savings
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {formatINR(comparison.net_tax_benefit_amount)}
                </div>
                <div className="text-[10px] text-emerald-600">under {comparison.recommended_regime} Regime</div>
              </div>
            )}
          </div>

          {/* Side-by-Side Regime Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Regime Card */}
            <div className={`rounded-xl p-5 border-2 transition ${
              comparison.recommended_regime === "NEW"
                ? "border-teal-500 bg-teal-50/40 shadow-xs"
                : "border-slate-200 bg-slate-50/50"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-slate-900">New Tax Regime</span>
                  <Badge variant="regime_new" className="text-[10px]">Sec 115BAC</Badge>
                </div>
                {comparison.recommended_regime === "NEW" && (
                  <Badge variant="regime_recommended" className="text-[10px]">Optimal</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Tax Liability</div>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono">
                    {formatINR(comparison.new_regime.total_tax)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400">Gross Income:</span>
                    <div className="font-semibold text-slate-800 font-mono">
                      {formatINR(comparison.new_regime.gross_total_income)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Taxable Income:</span>
                    <div className="font-semibold text-slate-800 font-mono">
                      {formatINR(comparison.new_regime.taxable_income)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Standard Deduction:</span>
                    <div className="font-semibold text-teal-800 font-mono">
                      {formatINR(comparison.new_regime.standard_deduction)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Effective Rate:</span>
                    <div className="font-semibold text-slate-800 font-mono">
                      {comparison.new_regime.effective_tax_rate_percent}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Old Regime Card (Neutral styling, non-prejudiced) */}
            <div className={`rounded-xl p-5 border transition ${
              comparison.recommended_regime === "OLD"
                ? "border-blue-500 bg-blue-50/40 shadow-xs"
                : "border-slate-200 bg-white"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-slate-900">Old Tax Regime</span>
                  <Badge variant="regime_old" className="text-[10px]">Standard Slabs</Badge>
                </div>
                {comparison.recommended_regime === "OLD" && (
                  <Badge variant="regime_recommended" className="text-[10px]">Optimal</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Tax Liability</div>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono">
                    {formatINR(comparison.old_regime.total_tax)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400">Gross Income:</span>
                    <div className="font-semibold text-slate-800 font-mono">
                      {formatINR(comparison.old_regime.gross_total_income)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Taxable Income:</span>
                    <div className="font-semibold text-slate-800 font-mono">
                      {formatINR(comparison.old_regime.taxable_income)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Deductions:</span>
                    <div className="font-semibold text-blue-800 font-mono">
                      {formatINR(comparison.old_regime.deductions_total)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Effective Rate:</span>
                    <div className="font-semibold text-slate-800 font-mono">
                      {comparison.old_regime.effective_tax_rate_percent}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Alert variant="info" className="bg-slate-50/80 border-slate-200">
            <Info className="h-4 w-4 text-teal-700" />
            <AlertTitle className="text-xs font-semibold text-slate-900">Statutory Comparison Rationale</AlertTitle>
            <AlertDescription className="text-xs text-slate-600 mt-1">
              {comparison.recommendation_rationale}
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button asChild variant="ghost" size="sm" className="text-teal-700 hover:text-teal-800 font-semibold text-xs">
              <Link href="/regime-comparison">
                View Full Calculation Trace & Slabs <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* 3. Middle Tier: Tax Twin Status + Filing Readiness + Verification Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Tax Twin Status */}
        {activeTwin && (
          <Card className="border bg-white shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800 font-semibold text-xs">
                  <Layers className="h-3 w-3 mr-1 text-teal-600" />
                  Twin v{activeTwin.version}
                </Badge>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active Baseline
                </span>
              </div>
              <CardTitle className="text-lg mt-2">Immutable Tax Twin</CardTitle>
              <CardDescription className="text-xs">
                Snapshot created on {formatDateIN(activeTwin.created_at)}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Financial Facts:</span>
                  <span className="font-bold text-slate-900">{facts.length} facts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PAN Registered:</span>
                  <span className="font-mono text-slate-700 font-semibold">{profile?.pan_masked || "ABCDE••••F"}</span>
                </div>
                {activeTwin.hash && (
                  <div className="flex justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Audit Hash:</span>
                    <span className="font-mono text-[11px] text-slate-600 truncate max-w-[140px]" title={activeTwin.hash}>
                      {activeTwin.hash}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-500 flex items-start gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Historical versions are permanent. Document reconciliation creates <strong>v{activeTwin.version + 1}</strong>.
                </span>
              </div>
            </CardContent>

            <CardFooter className="border-t pt-3">
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link href="/tax-twin">
                  Explore Tax Twin Facts <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Card 2: Filing Readiness Card */}
        <Card className="border bg-white shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Filing Readiness
              </span>
              <span className="text-base font-extrabold text-teal-700">{readinessScore}%</span>
            </div>
            <CardTitle className="text-lg mt-1">ITR Readiness Status</CardTitle>
            <CardDescription className="text-xs">
              Prerequisites required before AY 2026-27 filing.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Progress value={readinessScore} indicatorColor="bg-teal-600" />

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Profile & Residency
                </span>
                <span className="text-emerald-700 font-semibold">Done</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Salary Verified (Form 16)
                </span>
                <span className="text-emerald-700 font-semibold">Done</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> AIS Interest Reconciliation
                </span>
                <span className="text-amber-700 font-semibold">Conflict Pending</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Regime Optimal Selection
                </span>
                <span className="text-teal-700 font-semibold">New Regime</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-3">
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link href="/action-plan">
                View Filing Checklist <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Card 3: Verification State Summary */}
        <Card className="border bg-white shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Verification Audit
            </span>
            <CardTitle className="text-lg mt-1">Facts Health Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Audit trail distribution across active financial facts.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-slate-800">Verified Proof</span>
                </div>
                <Badge variant="verified">{verifiedCount} facts</Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-slate-800">Needs Confirmation</span>
                </div>
                <Badge variant="needs_confirmation">{needsConfirmCount} facts</Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/60 border border-rose-100 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span className="font-medium text-slate-800">Document Conflict</span>
                </div>
                <Badge variant="conflict">{conflictCount} conflict</Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/60 border border-purple-100 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-slate-800">Expert Review</span>
                </div>
                <Badge variant="expert_review">{expertReviewCount} facts</Badge>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-3">
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link href="/documents">
                Reconcile Conflicts <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 4. Bottom Tier: Action Items & Statutory Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Action Items (2 cols) */}
        <Card className="lg:col-span-2 border bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Prioritized Action Items</CardTitle>
                <CardDescription className="text-xs">
                  Required actions to resolve discrepancies and minimize tax liability.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {actionItems.length} Actions
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {actionItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-slate-900">{item.title}</span>
                    <Badge variant={item.category === "COMPLIANCE" ? "destructive" : "secondary"} className="text-[10px]">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{item.description}</p>
                  {item.statutory_reference && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ref: {item.statutory_reference} {item.deadline && `• Due: ${formatDateIN(item.deadline)}`}
                    </div>
                  )}
                </div>

                <Button asChild size="sm" variant="default" className="bg-slate-900 hover:bg-slate-800 text-xs shrink-0 self-start sm:self-center">
                  <Link href={item.category === "COMPLIANCE" || item.category === "VERIFICATION" ? "/documents" : "/action-plan"}>
                    Resolve Now <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>

          <CardFooter className="border-t pt-3">
            <Button asChild variant="ghost" size="sm" className="text-xs text-teal-700 font-semibold">
              <Link href="/action-plan">
                View Complete Action Plan <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Right: Statutory Deadlines (1 col) */}
        <Card className="border bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold">
              <Calendar className="h-4 w-4" />
              <span>STATUTORY CALENDAR</span>
            </div>
            <CardTitle className="text-lg mt-1">Compliance Deadlines</CardTitle>
            <CardDescription className="text-xs">
              Official Income Tax Department schedule for AY 2026-27.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3.5">
            {deadlines.map((dl) => (
              <div key={dl.id} className="p-3 rounded-lg border bg-slate-50/60 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{dl.title}</span>
                  <Badge variant={dl.days_remaining < 60 ? "destructive" : "outline"} className="text-[10px]">
                    {dl.days_remaining} days
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Due Date:</span>
                  <span className="font-mono font-semibold text-slate-800">{formatDateIN(dl.due_date)}</span>
                </div>
              </div>
            ))}
          </CardContent>

          <CardFooter className="border-t pt-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Dates retrieved from backend rule version</span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* 5. Quick Actions Hub */}
      <section className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900">Taxpayer Action Hub</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Link
            href="/documents"
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-teal-50/50 hover:border-teal-300 transition text-center space-y-1.5 group"
          >
            <FileText className="h-5 w-5 mx-auto text-slate-600 group-hover:text-teal-600" />
            <div className="text-xs font-semibold text-slate-900">Upload Docs</div>
            <div className="text-[10px] text-slate-400">Form 16 & AIS</div>
          </Link>

          <Link
            href="/regime-comparison"
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-teal-50/50 hover:border-teal-300 transition text-center space-y-1.5 group"
          >
            <Scale className="h-5 w-5 mx-auto text-slate-600 group-hover:text-teal-600" />
            <div className="text-xs font-semibold text-slate-900">Compare Regimes</div>
            <div className="text-[10px] text-slate-400">Slabs & 87A trace</div>
          </Link>

          <Link
            href="/copilot"
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-teal-50/50 hover:border-teal-300 transition text-center space-y-1.5 group"
          >
            <Sparkles className="h-5 w-5 mx-auto text-purple-600 group-hover:text-purple-700" />
            <div className="text-xs font-semibold text-slate-900">AI Copilot</div>
            <div className="text-[10px] text-slate-400">Gemini explanation</div>
          </Link>

          <Link
            href="/what-if"
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-teal-50/50 hover:border-teal-300 transition text-center space-y-1.5 group"
          >
            <FlaskConical className="h-5 w-5 mx-auto text-slate-600 group-hover:text-teal-600" />
            <div className="text-xs font-semibold text-slate-900">What-If Lab</div>
            <div className="text-[10px] text-slate-400">NPS & 80D sim</div>
          </Link>

          <Link
            href="/tax-twin"
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-teal-50/50 hover:border-teal-300 transition text-center space-y-1.5 group"
          >
            <Layers className="h-5 w-5 mx-auto text-teal-600 group-hover:text-teal-700" />
            <div className="text-xs font-semibold text-slate-900">Tax Twin</div>
            <div className="text-[10px] text-slate-400">Version timeline</div>
          </Link>
        </div>
      </section>
    </div>
  );
}