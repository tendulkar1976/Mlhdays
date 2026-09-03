"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getApiClient } from "@/lib/api/client";
import { TaxTwin, FinancialFact } from "@/types/schema";
import { formatINR, formatDateIN } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, VerificationBadge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Layers,
  ShieldCheck,
  History,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
  Lock,
  Sparkles,
} from "lucide-react";

export default function TaxTwinExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [twins, setTwins] = useState<TaxTwin[]>([]);
  const [selectedTwin, setSelectedTwin] = useState<TaxTwin | null>(null);
  const [facts, setFacts] = useState<FinancialFact[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "INCOME" | "DEDUCTIONS" | "CREDITS">("ALL");
  const [inspectedFact, setInspectedFact] = useState<FinancialFact | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTwinData = async (twinId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const client = getApiClient();
      const allTwins = await client.getTaxTwins();
      setTwins(allTwins);

      const targetTwin = twinId
        ? allTwins.find((t) => t.id === twinId) || allTwins[allTwins.length - 1]
        : allTwins.find((t) => t.is_active_baseline) || allTwins[allTwins.length - 1];

      if (targetTwin) {
        setSelectedTwin(targetTwin);
        const { facts: f } = await client.getTaxTwin(targetTwin.id);
        setFacts(f);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load Tax Twin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTwinData();
  }, []);

  const handleSelectTwin = (twin: TaxTwin) => {
    loadTwinData(twin.id);
  };

  // Fact groupings
  const incomeFacts = facts.filter((f) => f.category.startsWith("INCOME"));
  const deductionFacts = facts.filter((f) => f.category.startsWith("DEDUCTION"));
  const creditFacts = facts.filter((f) => f.category.startsWith("TAX_CREDIT"));

  const filteredFacts =
    activeTab === "INCOME"
      ? incomeFacts
      : activeTab === "DEDUCTIONS"
      ? deductionFacts
      : activeTab === "CREDITS"
      ? creditFacts
      : facts;

  // Verification counts
  const verifiedCount = facts.filter((f) => f.verification_state === "VERIFIED").length;
  const needsConfirmCount = facts.filter((f) => f.verification_state === "NEEDS_CONFIRMATION").length;
  const conflictCount = facts.filter((f) => f.verification_state === "CONFLICT").length;

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
              Audit Architecture
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">AY 2026-27 (FY 2025-26)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Immutable Tax Twin Explorer
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every confirmed financial change generates a versioned snapshot. Historical records are strictly immutable.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedTwin && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800 font-bold px-3 py-1">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
                Twin v{selectedTwin.version}
              </Badge>
              {selectedTwin.is_active_baseline ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Active Baseline
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Historical Snapshot
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Read-Only Banner for Historical Versions */}
      {selectedTwin && !selectedTwin.is_active_baseline && (
        <Alert variant="warning" className="border-amber-300 bg-amber-50/90 text-amber-900">
          <Lock className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-xs font-bold">Historical Read-Only Snapshot (Twin v{selectedTwin.version})</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            You are viewing a historical audit record from {formatDateIN(selectedTwin.created_at)}. This snapshot is sealed and cannot be modified. All current filing estimates use the active baseline.
          </AlertDescription>
        </Alert>
      )}

      {/* 2. Version Timeline */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            Tax Twin Version Lineage
          </h2>
          <span className="text-xs text-slate-400">Click any snapshot to inspect its audit trail</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {twins.map((t) => {
            const isSelected = selectedTwin?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleSelectTwin(t)}
                className={`cursor-pointer rounded-xl p-4 border-2 transition relative ${
                  isSelected
                    ? "border-teal-600 bg-white shadow-sm ring-2 ring-teal-600/20"
                    : "border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">Tax Twin v{t.version}</span>
                    {t.is_active_baseline ? (
                      <Badge variant="regime_recommended" className="text-[10px] px-2 py-0">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-slate-500">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">{formatDateIN(t.created_at)}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {t.notes || "Baseline financial snapshot"}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono truncate max-w-[140px]" title={t.hash}>
                    Hash: {t.hash || "0x••••••••"}
                  </span>
                  <span className="text-teal-700 font-semibold flex items-center">
                    {isSelected ? "Inspecting" : "Switch Snapshot"} <ChevronRight className="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}

          {/* Create v(n+1) Action Card */}
          <div className="rounded-xl p-4 border border-dashed border-teal-300 bg-teal-50/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                <Sparkles className="h-4 w-4 text-teal-600" />
                <span>Create Twin v{twins.length + 1}</span>
              </div>
              <p className="text-xs text-teal-800/80 mt-1 leading-relaxed">
                Confirming document reconciliations or applying What-If scenarios spawns a new version.
              </p>
            </div>
            <div className="pt-3">
              <Button asChild size="sm" variant="outline" className="w-full text-xs bg-white border-teal-300 text-teal-900 hover:bg-teal-50">
                <Link href="/documents">
                  Reconcile Documents <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Status Bar & Category Filter */}
      <section className="bg-white rounded-2xl border p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Registered Financial Facts
              <Badge variant="outline" className="text-xs ml-1 bg-slate-100">
                {facts.length} facts registered
              </Badge>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Source documents, verification states, and confidence scores for Twin v{selectedTwin?.version}.
            </p>
          </div>

          {/* Verification Breakdown Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Audit Status:</span>
            <Badge variant="verified">{verifiedCount} Verified</Badge>
            <Badge variant="needs_confirmation">{needsConfirmCount} Need Confirmation</Badge>
            {conflictCount > 0 && <Badge variant="conflict">{conflictCount} Conflict</Badge>}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "ALL", label: `All Facts (${facts.length})` },
            { key: "INCOME", label: `Income (${incomeFacts.length})` },
            { key: "DEDUCTIONS", label: `Deductions (${deductionFacts.length})` },
            { key: "CREDITS", label: `Tax Credits (${creditFacts.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Facts List */}
        <div className="space-y-3">
          {filteredFacts.map((fact) => {
            const isConflict = fact.verification_state === "CONFLICT";
            return (
              <div
                key={fact.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isConflict
                    ? "border-rose-300 bg-rose-50/40"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900">{fact.display_label}</span>
                    <VerificationBadge state={fact.verification_state} />
                    {fact.confidence && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {Math.round(fact.confidence * 100)}% match
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <FileText className="h-3 w-3 text-slate-400" />
                    <span>Source: {fact.source_document || "Self-reported"}</span>
                    {fact.notes && <span className="text-slate-400">• {fact.notes}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900 font-mono">
                      {formatINR(fact.amount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConflict && (
                      <Button asChild size="sm" variant="destructive" className="h-8 text-xs">
                        <Link href="/documents">
                          Review Conflict <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInspectedFact(fact)}
                      className="h-8 text-xs bg-white"
                    >
                      <Eye className="h-3 w-3 mr-1" /> Provenance
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Provenance Drawer / Modal */}
      {inspectedFact && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setInspectedFact(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">Fact Provenance Audit</h3>
              </div>
              <button
                onClick={() => setInspectedFact(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Fact Label:</span>
                  <span className="font-bold text-slate-900">{inspectedFact.display_label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Field Identifier:</span>
                  <span className="font-mono text-slate-700">{inspectedFact.field_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Amount Sealed:</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">
                    {formatINR(inspectedFact.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Verification Status:</span>
                  <VerificationBadge state={inspectedFact.verification_state} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Originating Source:</span>
                  <span className="font-semibold text-slate-800">{inspectedFact.source_document || "Self-reported"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Extraction Match Confidence:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {Math.round((inspectedFact.confidence || 0.85) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Attached To:</span>
                  <span className="font-mono text-teal-800 font-semibold">
                    Tax Twin v{selectedTwin?.version} ({selectedTwin?.id})
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 space-y-1 text-teal-950">
                <div className="font-bold text-[11px] flex items-center gap-1">
                  <Lock className="h-3 w-3 text-teal-700" />
                  Statutory Invariant Proof
                </div>
                <p className="text-[11px] leading-relaxed text-teal-900">
                  This fact is cryptographically tied to <code>tax_twin_id: {inspectedFact.tax_twin_id}</code>. Changes in income or deduction amounts require a new Tax Twin generation.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button size="sm" onClick={() => setInspectedFact(null)} className="bg-slate-900 hover:bg-slate-800 text-white">
                Close Audit View
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}