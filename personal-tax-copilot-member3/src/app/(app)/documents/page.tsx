"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getApiClient } from "@/lib/api/client";
import { TaxTwin, FinancialFact } from "@/types/schema";
import { DocumentUploadResponse, ReconciliationRecord } from "@/types/tax";
import { formatINR, formatDateIN } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, VerificationBadge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  FileCheck2,
  AlertOctagon,
  X,
  FileSearch,
  ExternalLink,
} from "lucide-react";

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTwin, setActiveTwin] = useState<TaxTwin | null>(null);
  const [documents, setDocuments] = useState<DocumentUploadResponse[]>([]);
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);

  // Interactive reconciliation state
  const [selectedResolution, setSelectedResolution] = useState<"AIS" | "TWIN" | "CUSTOM">("AIS");
  const [customValue, setCustomValue] = useState<string>("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvedResult, setResolvedResult] = useState<{ newTwin: TaxTwin; message: string } | null>(null);

  // Simulated upload state
  const [uploadStatus, setUploadStatus] = useState<"IDLE" | "UPLOADING" | "EXTRACTING" | "SUCCESS">("IDLE");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const client = getApiClient();
      const twins = await client.getTaxTwins();
      const baseline = twins.find((t) => t.is_active_baseline) || twins[twins.length - 1];

      if (baseline) {
        setActiveTwin(baseline);
        const [docs, recs] = await Promise.all([
          client.getDocuments(),
          client.getReconciliationRecords(baseline.id),
        ]);
        setDocuments(docs);
        setRecords(recs);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load document and reconciliation records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSimulatedUpload = () => {
    setUploadStatus("UPLOADING");
    setTimeout(() => {
      setUploadStatus("EXTRACTING");
      setTimeout(() => {
        setUploadStatus("SUCCESS");
        setTimeout(() => setUploadStatus("IDLE"), 4000);
      }, 1500);
    }, 1200);
  };

  const handleConfirmResolution = async () => {
    try {
      setResolving(true);
      const client = getApiClient();

      // Find the conflict record (Savings Bank Interest)
      const conflictRecord = records.find((r) => r.verification_state === "CONFLICT");
      if (!conflictRecord) return;

      const confirmedAmount =
        selectedResolution === "AIS"
          ? conflictRecord.document_extracted_value
          : selectedResolution === "TWIN"
          ? conflictRecord.existing_twin_value
          : Number(customValue) || conflictRecord.document_extracted_value;

      const res = await client.confirmReconciliation([
        {
          fact_id: conflictRecord.fact_id,
          confirmed_value: confirmedAmount,
        },
      ]);

      setResolvedResult({
        newTwin: res.new_twin,
        message: res.message,
      });

      // Update local record to resolved
      setRecords((prev) =>
        prev.map((r) =>
          r.id === conflictRecord.id
            ? {
                ...r,
                existing_twin_value: confirmedAmount,
                delta_amount: 0,
                verification_state: "VERIFIED",
                conflict_explanation: undefined,
              }
            : r
        )
      );

      setIsConfirmModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to confirm reconciliation.");
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="h-44 bg-slate-200 rounded-2xl" />
        <div className="h-72 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
              Document Intelligence &amp; Audit
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">AY 2026-27</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Document Extraction &amp; Reconciliation
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Compare declared income against Form 16 and AIS records. Resolving conflicts generates an immutable new Tax Twin version.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {resolvedResult ? (
            <Badge variant="regime_recommended" className="text-xs px-3 py-1 font-bold">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Twin v{resolvedResult.newTwin.version} Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-teal-50 border-teal-200 text-teal-800 font-semibold px-3 py-1">
              <Layers className="h-3.5 w-3.5 mr-1 text-teal-600" />
              Twin v{activeTwin?.version || 2} Active Baseline
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Success Banner After Reconciliation Transition */}
      {resolvedResult && (
        <Alert variant="info" className="border-emerald-300 bg-emerald-50/90 text-emerald-950 p-5 rounded-2xl shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <AlertTitle className="text-sm font-bold text-emerald-900">
              Tax Twin v{resolvedResult.newTwin.version} Successfully Created!
            </AlertTitle>
            <AlertDescription className="text-xs text-emerald-800 leading-relaxed">
              {resolvedResult.message}
            </AlertDescription>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button asChild size="sm" className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs h-8">
                <Link href="/tax-twin">
                  Inspect Twin v{resolvedResult.newTwin.version} Timeline <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-emerald-300 text-emerald-900 bg-white text-xs h-8">
                <Link href="/dashboard">
                  Back to Command Center
                </Link>
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* 3. Document Upload Pipeline */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-teal-600" />
            Upload Official Tax Documents
          </h2>
          <span className="text-xs text-slate-400">PDF, JSON (AIS/TIS), XML, Max 25MB</span>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 sm:p-8 text-center bg-slate-50/50 hover:bg-teal-50/30 transition">
          <FileText className="h-10 w-10 mx-auto text-slate-400 mb-2" />
          <div className="text-sm font-semibold text-slate-800">
            Drag and drop Form 16, AIS / TIS, or 26AS here
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Our server-side document intelligence pipeline securely extracts line items, validates employer TAN, and checks bank interest.
          </p>

          <div className="mt-4 flex justify-center gap-3">
            <Button
              size="sm"
              onClick={handleSimulatedUpload}
              disabled={uploadStatus !== "IDLE"}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs"
            >
              {uploadStatus === "UPLOADING" && <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {uploadStatus === "EXTRACTING" && <Sparkles className="h-3.5 w-3.5 mr-1.5 animate-spin text-purple-400" />}
              {uploadStatus === "IDLE" && "Upload Document (or Simulate AIS)"}
              {uploadStatus === "UPLOADING" && "Uploading Document..."}
              {uploadStatus === "EXTRACTING" && "Extracting Facts via AI Pipeline..."}
              {uploadStatus === "SUCCESS" && "Extraction Complete!"}
            </Button>
          </div>

          {/* Pipeline Progress Stages */}
          {uploadStatus !== "IDLE" && (
            <div className="mt-5 max-w-md mx-auto rounded-lg bg-white p-3 border border-slate-200 flex items-center justify-between text-xs font-medium">
              <span className={uploadStatus === "UPLOADING" ? "text-teal-700 font-bold" : "text-emerald-700"}>
                1. Uploaded
              </span>
              <span>&rarr;</span>
              <span className={uploadStatus === "EXTRACTING" ? "text-purple-700 font-bold animate-pulse" : uploadStatus === "SUCCESS" ? "text-emerald-700" : "text-slate-400"}>
                2. OCR &amp; Extraction
              </span>
              <span>&rarr;</span>
              <span className={uploadStatus === "SUCCESS" ? "text-emerald-700 font-bold" : "text-slate-400"}>
                3. Reconciled (98% match)
              </span>
            </div>
          )}
        </div>

        {/* Existing Processed Documents List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl border bg-slate-50/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="font-semibold text-slate-900">Form16_FY2025-26_Employer.pdf</div>
                <div className="text-[11px] text-slate-400">Part A &amp; B • 5 Facts Extracted • 99% confidence</div>
              </div>
            </div>
            <Badge variant="verified" className="text-[10px]">VERIFIED</Badge>
          </div>

          <div className="p-3.5 rounded-xl border bg-slate-50/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <AlertOctagon className="h-5 w-5 text-amber-600" />
              <div>
                <div className="font-semibold text-slate-900">AIS_Annual_Information_202526.pdf</div>
                <div className="text-[11px] text-slate-400">TIS Income • 3 Facts Extracted • 98% confidence</div>
              </div>
            </div>
            <Badge variant="conflict" className="text-[10px]">1 CONFLICT</Badge>
          </div>
        </div>
      </section>

      {/* 4. RECONCILIATION SCREEN (Most Important Demo Screen) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Automated Reconciliation Engine
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-400 font-mono">Rule 114-I / Sec 139(9)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Tax Twin vs Document Discrepancy Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing your active Tax Twin baseline facts against extracted figures from official Form 16 and AIS records.
            </p>
          </div>

          <Badge variant="outline" className="text-xs bg-slate-50">
            {records.length} Reconciliation Items
          </Badge>
        </div>

        {/* Reconciliation Comparison Rows */}
        <div className="space-y-4">
          {records.map((rec) => {
            const isConflict = rec.verification_state === "CONFLICT";

            return (
              <div
                key={rec.id}
                className={`rounded-xl border p-5 transition space-y-4 ${
                  isConflict
                    ? "border-rose-300 bg-rose-50/40 shadow-xs"
                    : "border-slate-200 bg-slate-50/30"
                }`}
              >
                {/* Top Row: Fact info & verification badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        {rec.field_label}
                      </span>
                      <VerificationBadge state={rec.verification_state} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Source: <strong>{rec.source_document_title}</strong> (Confidence: {Math.round(rec.confidence * 100)}%)
                    </div>
                  </div>

                  {isConflict && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full self-start sm:self-center">
                      Action Required: Mismatch Detected
                    </span>
                  )}
                </div>

                {/* Middle Row: Comparison Values */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-medium">Active Tax Twin Value:</span>
                    <div className="text-lg font-mono font-extrabold text-slate-900">
                      {formatINR(rec.existing_twin_value)}
                    </div>
                    <span className="text-[10px] text-slate-400">Self-reported baseline</span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-medium">Document / AIS Reported:</span>
                    <div className="text-lg font-mono font-extrabold text-teal-900">
                      {formatINR(rec.document_extracted_value)}
                    </div>
                    <span className="text-[10px] text-teal-700 font-semibold">Reported by 3 Banks</span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-medium">Difference / Delta:</span>
                    <div className={`text-lg font-mono font-extrabold ${rec.delta_amount > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                      {rec.delta_amount > 0 ? `+${formatINR(rec.delta_amount)}` : "₹0 (Exact Match)"}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {rec.delta_amount > 0 ? "Under-reported Interest" : "Reconciled"}
                    </span>
                  </div>
                </div>

                {/* Conflict Explanation & Interactive Resolution Controls */}
                {isConflict && (
                  <div className="pt-2 border-t border-rose-200/80 space-y-3">
                    <div className="p-3 rounded-xl bg-white border border-rose-200 text-xs text-rose-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-800">
                        <AlertTriangle className="h-4 w-4" />
                        Discrepancy Cause &amp; Statutory Risk
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        {rec.conflict_explanation || "AIS reports higher interest income than previously declared. Failing to declare this interest leads to automated defect notice under Section 139(9)."}
                      </p>
                    </div>

                    {/* Resolution Choice Pills */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-800">Select Resolution Strategy:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedResolution("AIS")}
                          className={`p-3 rounded-xl border text-left transition ${
                            selectedResolution === "AIS"
                              ? "border-teal-600 bg-teal-50/80 ring-1 ring-teal-600 text-slate-900"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-900">
                            (Recommended) Accept AIS ({formatINR(rec.document_extracted_value)})
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Auto-sync with official bank reporting
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedResolution("TWIN")}
                          className={`p-3 rounded-xl border text-left transition ${
                            selectedResolution === "TWIN"
                              ? "border-teal-600 bg-teal-50/80 ring-1 ring-teal-600 text-slate-900"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-900">
                            Keep Tax Twin ({formatINR(rec.existing_twin_value)})
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Submit dispute feedback on AIS portal
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedResolution("CUSTOM")}
                          className={`p-3 rounded-xl border text-left transition ${
                            selectedResolution === "CUSTOM"
                              ? "border-teal-600 bg-teal-50/80 ring-1 ring-teal-600 text-slate-900"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-900">
                            Enter Custom Reconciled Amount
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Provide manual verified passbook figure
                          </div>
                        </button>
                      </div>

                      {selectedResolution === "CUSTOM" && (
                        <div className="pt-2 max-w-xs">
                          <label className="text-xs font-semibold text-slate-700">Enter Verified Interest Amount (₹)</label>
                          <Input
                            type="number"
                            placeholder="e.g. 18500"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            className="mt-1 bg-white h-9 text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>

                    {/* Resolve CTA */}
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        onClick={() => setIsConfirmModalOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                      >
                        Resolve Conflict &amp; Spawn Twin v{(activeTwin?.version || 2) + 1}
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Confirmation Modal (User Safety & Immutability Guarantee) */}
      {isConfirmModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsConfirmModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Create New Tax Twin Version?
                </h3>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
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
                  Resolving this conflict will generate <strong>Tax Twin v{(activeTwin?.version || 2) + 1}</strong> with the confirmed interest fact.
                </p>
                <p className="text-[11px] text-teal-800 font-medium">
                  • <strong>Tax Twin v{activeTwin?.version || 2}</strong> will remain permanently sealed in history.<br />
                  • Your new baseline will be 100% audit-proof against automated AIS department notices.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-slate-700">
                <div className="flex justify-between font-medium">
                  <span>Selected Value:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedResolution === "AIS"
                      ? "₹18,500 (AIS Reported)"
                      : selectedResolution === "TWIN"
                      ? "₹12,000 (Tax Twin Baseline)"
                      : formatINR(Number(customValue) || 18500)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>New Active Baseline:</span>
                  <span className="font-mono font-bold text-teal-800">
                    Tax Twin v{(activeTwin?.version || 2) + 1}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={resolving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmResolution}
                disabled={resolving}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
              >
                {resolving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Sealing Tax Twin v{(activeTwin?.version || 2) + 1}...
                  </>
                ) : (
                  <>
                    Confirm &amp; Spawn Twin v{(activeTwin?.version || 2) + 1}
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