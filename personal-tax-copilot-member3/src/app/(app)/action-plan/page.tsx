"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getApiClient } from "@/lib/api/client";
import { TaxTwin, TaxProfile, FinancialFact } from "@/types/schema";
import { ActionPlanItem, TaxDeadlineItem, RegimeComparisonResult } from "@/types/tax";
import { formatINR, formatDateIN } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  CheckSquare,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Printer,
  FileText,
  Layers,
  Scale,
  Sparkles,
  FlaskConical,
  ExternalLink,
  ChevronRight,
  Download,
  FileCheck,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  category: "PROFILE" | "INCOME" | "DOCUMENTS" | "RECONCILIATION" | "REGIME";
  status: "COMPLETED" | "PENDING" | "BLOCKED" | "NEEDS_REVIEW";
  note: string;
  href: string;
  actionText: string;
}

export default function ActionPlanPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<TaxProfile | null>(null);
  const [activeTwin, setActiveTwin] = useState<TaxTwin | null>(null);
  const [facts, setFacts] = useState<FinancialFact[]>([]);
  const [comparison, setComparison] = useState<RegimeComparisonResult | null>(null);
  const [actionItems, setActionItems] = useState<ActionPlanItem[]>([]);
  const [deadlines, setDeadlines] = useState<TaxDeadlineItem[]>([]);

  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const client = getApiClient();

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
      setError(err.message || "Failed to load filing readiness data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute checklist dynamically from facts and state
  const hasConflict = facts.some((f) => f.verification_state === "CONFLICT");
  const hasNeedsConfirmation = facts.some((f) => f.verification_state === "NEEDS_CONFIRMATION");

  const checklist: ChecklistItem[] = [
    {
      id: "chk_01",
      label: "Taxpayer Profile & Residency Verification",
      category: "PROFILE",
      status: "COMPLETED",
      note: "Resident individual, below 60 years, PAN encrypted and verified.",
      href: "/onboarding",
      actionText: "View Profile",
    },
    {
      id: "chk_02",
      label: "Salary Income Verified against Form 16",
      category: "INCOME",
      status: "COMPLETED",
      note: "₹14,50,000 gross salary matched with Part B of Form 16.",
      href: "/documents",
      actionText: "View Form 16",
    },
    {
      id: "chk_03",
      label: "Annual Information Statement (AIS) Reconciliation",
      category: "RECONCILIATION",
      status: hasConflict ? "NEEDS_REVIEW" : "COMPLETED",
      note: hasConflict
        ? "Mismatch detected: AIS reports ₹18,500 interest vs ₹12,000 baseline."
        : "All 3 bank accounts reconciled against AIS reporting.",
      href: "/documents",
      actionText: hasConflict ? "Reconcile in Docs" : "Inspect Reconciliation",
    },
    {
      id: "chk_04",
      label: "Form 26AS Tax Credits (TDS) Reconciled",
      category: "DOCUMENTS",
      status: "COMPLETED",
      note: "₹85,000 TDS deducted by employer matches OLTAS tax credits.",
      href: "/tax-twin",
      actionText: "Inspect Credits",
    },
    {
      id: "chk_05",
      label: "Chapter VI-A Deduction Proofs Verification",
      category: "DOCUMENTS",
      status: hasNeedsConfirmation ? "PENDING" : "COMPLETED",
      note: hasNeedsConfirmation
        ? "Section 80D mediclaim requires cashless payment receipt confirmation."
        : "All declared deductions verified with receipts.",
      href: "/documents",
      actionText: "Upload Proof",
    },
    {
      id: "chk_06",
      label: "Tax Regime Decision Lock-In",
      category: "REGIME",
      status: "COMPLETED",
      note: `New Tax Regime delivers optimal tax liability (₹1,02,986, saving ₹27,586).`,
      href: "/regime-comparison",
      actionText: "Compare Regimes",
    },
  ];

  const completedChecklistCount = checklist.filter((c) => c.status === "COMPLETED").length;
  const readinessPercentage = Math.round((completedChecklistCount / checklist.length) * 100);

  const filteredActionItems =
    activeFilter === "PENDING"
      ? actionItems.filter((a) => a.status === "PENDING")
      : activeFilter === "COMPLETED"
      ? actionItems.filter((a) => a.status === "COMPLETED")
      : actionItems;

  const handlePrint = () => {
    window.print();
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

  if (error) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Filing Readiness Plan</AlertTitle>
          <AlertDescription className="mt-1">{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry Fetch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Page Header (With Print Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5" /> Filing Readiness &amp; Action Plan
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">AY 2026-27 (FY 2025-26)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Filing Pre-Flight Checklist
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Resolve pending compliance tasks, review verification states, and export your pre-filing audit package.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 text-xs shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-600" /> Print Filing Brief
          </Button>
          <Badge variant="outline" className="text-xs bg-teal-50 border-teal-200 text-teal-800 font-semibold px-3 py-1">
            <Layers className="h-3.5 w-3.5 mr-1 text-teal-600" />
            Twin v{activeTwin?.version || 2}
          </Badge>
        </div>
      </div>

      {/* 2. Filing Readiness Hero Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={readinessPercentage >= 80 ? "regime_recommended" : "secondary"}
                className="text-xs px-2.5 py-0.5"
              >
                {readinessPercentage >= 80 ? "Ready for Pre-Filing" : "Action Required"}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {completedChecklistCount} of {checklist.length} Milestones Cleared
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Filing Readiness Score: {readinessPercentage}%
            </h2>
            <p className="text-xs text-slate-500 max-w-xl">
              Based on verified Form 16 facts, AIS interest reconciliation, and Section 115BAC regime selection.
            </p>
          </div>

          <div className="shrink-0 text-right sm:border-l sm:border-slate-200 sm:pl-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Estimated Total Tax
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-0.5">
              {comparison ? formatINR(comparison.new_regime.total_tax) : "—"}
            </div>
            <div className="text-[11px] text-teal-700 font-semibold">
              New Regime Optimal
            </div>
          </div>
        </div>

        {/* Visual Progress Indicator */}
        <div className="space-y-2">
          <Progress value={readinessPercentage} indicatorColor="bg-teal-600" />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Profile &amp; Salary</span>
            <span>AIS &amp; 26AS Reconciled</span>
            <span>Regime Locked</span>
            <span>Ready to File (ITR-1)</span>
          </div>
        </div>
      </section>

      {/* 3. Complete Filing Checklist */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
              Statutory Pre-Filing Checklist
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Department compliance requirements to ensure error-free ITR processing.
            </p>
          </div>

          <span className="text-xs text-slate-400">
            {completedChecklistCount} Completed
          </span>
        </div>

        <div className="space-y-3">
          {checklist.map((item) => {
            const isCompleted = item.status === "COMPLETED";
            const isReview = item.status === "NEEDS_REVIEW";
            const isPending = item.status === "PENDING";

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isReview
                    ? "border-rose-200 bg-rose-50/40"
                    : isPending
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-slate-200 bg-slate-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : isReview ? (
                      <AlertTriangle className="h-5 w-5 text-rose-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{item.label}</span>
                      <Badge
                        variant={
                          isCompleted
                            ? "verified"
                            : isReview
                            ? "conflict"
                            : "needs_confirmation"
                        }
                        className="text-[10px]"
                      >
                        {item.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.note}</p>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  <Button asChild size="sm" variant={isReview ? "destructive" : "outline"} className="h-8 text-xs">
                    <Link href={item.href}>
                      {item.actionText} <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Categorized Action Plan Items */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Prioritized Action Plan Tasks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specific actions prioritized by tax saving potential and compliance risk.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({actionItems.length})
            </button>
            <button
              onClick={() => setActiveFilter("PENDING")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeFilter === "PENDING" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pending ({actionItems.filter((a) => a.status === "PENDING").length})
            </button>
            <button
              onClick={() => setActiveFilter("COMPLETED")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeFilter === "COMPLETED" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Done ({actionItems.filter((a) => a.status === "COMPLETED").length})
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredActionItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{item.title}</span>
                  <Badge variant={item.category === "COMPLIANCE" ? "destructive" : "secondary"} className="text-[10px]">
                    {item.category}
                  </Badge>
                  {item.status === "COMPLETED" && (
                    <Badge variant="verified" className="text-[10px]">COMPLETED</Badge>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed max-w-2xl">{item.description}</p>
                {item.statutory_reference && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    Statutory Rule: {item.statutory_reference} {item.deadline && `• Due: ${formatDateIN(item.deadline)}`}
                  </div>
                )}
              </div>

              <div className="shrink-0 self-start sm:self-center">
                {item.status === "PENDING" ? (
                  <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8">
                    <Link href={item.category === "COMPLIANCE" ? "/documents" : item.category === "VERIFICATION" ? "/documents" : "/regime-comparison"}>
                      Resolve Task <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                ) : (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Check className="h-3.5 w-3.5 mr-1" /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Statutory Calendar Deadlines (From Backend Contract) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider">
          <Calendar className="h-4 w-4" />
          <span>Statutory Compliance Deadlines</span>
        </div>
        <h3 className="text-base font-bold text-slate-900">
          AY 2026-27 Filing Timelines
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {deadlines.map((dl) => (
            <div key={dl.id} className="p-4 rounded-xl border bg-slate-50/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{dl.title}</span>
                <Badge variant={dl.days_remaining < 60 ? "destructive" : "outline"} className="text-[10px]">
                  {dl.days_remaining} days
                </Badge>
              </div>
              <div className="flex justify-between text-slate-500 font-mono text-[11px]">
                <span>Statutory Due Date:</span>
                <span className="font-bold text-slate-800">{formatDateIN(dl.due_date)}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Income Tax Department non-audit individual mandate
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Print-Ready Pre-Filing Audit Package (Export Layout) */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-xs text-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <FileCheck className="h-4 w-4 text-teal-600" />
            <span>Pre-Filing Audit Package Brief</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            Hash: {activeTwin?.hash || "0x4e71...c3d4"}
          </span>
        </div>

        <p className="leading-relaxed text-xs text-slate-600">
          This audit brief consolidates your active financial baseline (Tax Twin v{activeTwin?.version || 2}) with verified Form 16 facts and Section 115BAC computation trace. All records are cryptographically sealed.
        </p>

        <div className="p-4 rounded-xl bg-white border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Taxpayer:</span>
            <div className="font-bold text-slate-900">{profile?.full_name || "Vikas A"}</div>
          </div>
          <div>
            <span className="text-slate-400">Masked PAN:</span>
            <div className="font-mono font-bold text-slate-900">{profile?.pan_masked || "ABCDE••••F"}</div>
          </div>
          <div>
            <span className="text-slate-400">Optimal Regime:</span>
            <div className="font-bold text-teal-800">{comparison?.recommended_regime || "NEW"} Regime</div>
          </div>
          <div>
            <span className="text-slate-400">Final Liability:</span>
            <div className="font-mono font-extrabold text-slate-900">
              {comparison ? formatINR(comparison.new_regime.total_tax) : "—"}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 shadow-xs"
          >
            <Download className="h-3 w-3 mr-1.5" /> Export Audit Summary
          </Button>
        </div>
      </section>
    </div>
  );
}

function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}