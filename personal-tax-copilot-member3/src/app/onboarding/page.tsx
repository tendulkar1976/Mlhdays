"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiClient } from "@/lib/api/client";
import { formatINR } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
  User,
  IndianRupee,
  Receipt,
  Sparkles,
  Loader2,
} from "lucide-react";
import { TaxpayerCategory } from "@/types/schema";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  // Step 1: Profile State
  const [category, setCategory] = useState<TaxpayerCategory>("SALARIED");
  const [residency, setResidency] = useState<"RESIDENT" | "NON_RESIDENT">("RESIDENT");
  const [ageCategory, setAgeCategory] = useState<"BELOW_60" | "SENIOR_60_TO_80">("BELOW_60");
  const [panMasked, setPanMasked] = useState("ABCDE1234F");

  // Step 2: Income State
  const [grossSalary, setGrossSalary] = useState<number>(1450000);
  const [otherIncome, setOtherIncome] = useState<number>(25000);

  // Step 3: Deductions State
  const [sec80c, setSec80c] = useState<number>(150000);
  const [sec80d, setSec80d] = useState<number>(25000);
  const [sec24b, setSec24b] = useState<number>(200000);
  const [nps80ccd, setNps80ccd] = useState<number>(50000);

  // Step navigation
  const nextStep = () => {
    if (currentStep < 4) setCurrentStep((prev) => (prev + 1) as any);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as any);
  };

  // Submission / Twin v1 Initialization
  const handleCreateTaxTwin = async () => {
    try {
      setIsSubmitting(true);
      setSubmitStatus("Creating your Tax Twin...");

      const client = getApiClient();
      await client.initializeTaxTwin({
        category,
        residency_status: residency,
        age_category: ageCategory,
        pan_masked: panMasked ? `${panMasked.slice(0, 5)}••••${panMasked.slice(-1)}` : undefined,
        gross_salary: Number(grossSalary) || 0,
        other_income: Number(otherIncome) || 0,
        deduction_80c: Number(sec80c) || 0,
        deduction_80d: Number(sec80d) || 0,
        deduction_24b: Number(sec24b) || 0,
        deduction_80ccd_nps: Number(nps80ccd) || 0,
      });

      setSubmitStatus("Tax Twin v1 created!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err) {
      setSubmitStatus(null);
      setIsSubmitting(false);
      alert("Failed to initialize Tax Twin. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b bg-white flex items-center px-4 sm:px-8 justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 font-bold text-white shadow-sm text-sm">
            ₹
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-sm">
            TaxCopilot <span className="text-teal-700 text-xs font-semibold">Onboarding</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-slate-100">
            AY 2026-27 (FY 2025-26)
          </Badge>
          <span className="text-xs text-slate-500 font-medium">Step {currentStep} of 4</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Step Progress Indicators */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { step: 1, title: "About You" },
              { step: 2, title: "Income" },
              { step: 3, title: "Deductions" },
              { step: 4, title: "Review" },
            ].map((s) => (
              <div
                key={s.step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep >= s.step ? "bg-teal-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Step 1: About You */}
          {currentStep === 1 && (
            <Card className="border bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold">
                  <User className="h-4 w-4" />
                  <span>STEP 1 OF 4</span>
                </div>
                <CardTitle className="text-xl">About You & Taxpayer Profile</CardTitle>
                <CardDescription>
                  Help us configure the appropriate statutory slabs and exemptions for AY 2026-27.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Employment Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-900">Taxpayer Persona</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: "SALARIED", label: "Salaried Employee", desc: "Form 16, HRA & standard deduction" },
                      { id: "FREELANCER_CONSULTANT", label: "Freelancer / Consultant", desc: "Sec 44ADA presumptive or books" },
                      { id: "INVESTOR", label: "Investor / Trader", desc: "Capital gains on equity, mutual funds" },
                      { id: "STUDENT_FIRST_TIME", label: "Student / First-Time Earner", desc: "Simplified first tax filing" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCategory(item.id as TaxpayerCategory)}
                        className={`p-3 rounded-xl border text-left transition ${
                          category === item.id
                            ? "border-teal-600 bg-teal-50/70 shadow-xs"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-semibold text-xs text-slate-900">{item.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Residency & Age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Residency Status</label>
                    <select
                      value={residency}
                      onChange={(e) => setResidency(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="RESIDENT">Resident Individual</option>
                      <option value="NON_RESIDENT">Non-Resident (NRI)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Age Category</label>
                    <select
                      value={ageCategory}
                      onChange={(e) => setAgeCategory(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="BELOW_60">Below 60 years</option>
                      <option value="SENIOR_60_TO_80">Senior Citizen (60 to 80 years)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Permanent Account Number (PAN)</label>
                  <Input
                    type="text"
                    value={panMasked}
                    onChange={(e) => setPanMasked(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="uppercase font-mono text-sm tracking-wider"
                  />
                  <span className="text-[11px] text-slate-400">Your PAN is masked and securely encrypted on our servers.</span>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="ghost" disabled className="text-slate-400">
                  Back
                </Button>
                <Button onClick={nextStep} className="bg-slate-900 hover:bg-slate-800 text-white">
                  Continue to Income <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 2: Income Sources */}
          {currentStep === 2 && (
            <Card className="border bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold">
                  <IndianRupee className="h-4 w-4" />
                  <span>STEP 2 OF 4</span>
                </div>
                <CardTitle className="text-xl">Annual Income Details</CardTitle>
                <CardDescription>
                  Enter your estimated gross annual earnings for FY 2025-26.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-900">Annual Gross Salary (Sec 17(1))</label>
                    <span className="text-xs font-bold text-teal-700 font-mono">
                      {formatINR(grossSalary)} ({formatINR(grossSalary, { compact: true })})
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(Number(e.target.value))}
                    step={10000}
                    min={0}
                    placeholder="1450000"
                  />
                  <p className="text-[11px] text-slate-500">
                    Includes basic salary, HRA, special allowances, and annual bonuses before any deductions.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-900">Savings & Other Income</label>
                    <span className="text-xs font-bold text-teal-700 font-mono">
                      {formatINR(otherIncome)}
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={otherIncome}
                    onChange={(e) => setOtherIncome(Number(e.target.value))}
                    step={1000}
                    min={0}
                    placeholder="25000"
                  />
                  <p className="text-[11px] text-slate-500">
                    Interest from savings accounts, fixed deposits (FD), dividends, or freelance income.
                  </p>
                </div>

                <div className="rounded-lg bg-teal-50/70 p-3 border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    In New Regime for FY 2025-26, a statutory standard deduction of <strong>₹75,000</strong> is automatically applied by the tax engine for salaried individuals.
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep} className="bg-slate-900 hover:bg-slate-800 text-white">
                  Continue to Deductions <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 3: Deductions / Investments */}
          {currentStep === 3 && (
            <Card className="border bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold">
                  <Receipt className="h-4 w-4" />
                  <span>STEP 3 OF 4</span>
                </div>
                <CardTitle className="text-xl">Deductions & Investments</CardTitle>
                <CardDescription>
                  Enter any investments that apply under Chapter VI-A (relevant for Old Regime evaluation).
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <label className="font-semibold text-slate-900">Section 80C</label>
                      <span className="font-mono text-slate-600">{formatINR(sec80c)}</span>
                    </div>
                    <Input
                      type="number"
                      value={sec80c}
                      onChange={(e) => setSec80c(Number(e.target.value))}
                      placeholder="150000"
                    />
                    <p className="text-[11px] text-slate-500">EPF, PPF, ELSS, Life Insurance</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <label className="font-semibold text-slate-900">Section 80D (Mediclaim)</label>
                      <span className="font-mono text-slate-600">{formatINR(sec80d)}</span>
                    </div>
                    <Input
                      type="number"
                      value={sec80d}
                      onChange={(e) => setSec80d(Number(e.target.value))}
                      placeholder="25000"
                    />
                    <p className="text-[11px] text-slate-500">Health insurance premiums paid for self & family</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <label className="font-semibold text-slate-900">Home Loan Interest (24b)</label>
                      <span className="font-mono text-slate-600">{formatINR(sec24b)}</span>
                    </div>
                    <Input
                      type="number"
                      value={sec24b}
                      onChange={(e) => setSec24b(Number(e.target.value))}
                      placeholder="200000"
                    />
                    <p className="text-[11px] text-slate-500">Interest on housing loan for self-occupied home</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <label className="font-semibold text-slate-900">NPS Tier 1 (80CCD 1B)</label>
                      <span className="font-mono text-slate-600">{formatINR(nps80ccd)}</span>
                    </div>
                    <Input
                      type="number"
                      value={nps80ccd}
                      onChange={(e) => setNps80ccd(Number(e.target.value))}
                      placeholder="50000"
                    />
                    <p className="text-[11px] text-slate-500">Voluntary National Pension System contribution</p>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Our deterministic calculation engine will compare these deductions against the New Regime slabs to determine which regime maximizes your take-home tax savings.
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep} className="bg-slate-900 hover:bg-slate-800 text-white">
                  Review & Initialize <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 4: Review & Initialize Tax Twin */}
          {currentStep === 4 && (
            <Card className="border bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold">
                  <Layers className="h-4 w-4" />
                  <span>STEP 4 OF 4</span>
                </div>
                <CardTitle className="text-xl">Review & Initialize Tax Twin v1</CardTitle>
                <CardDescription>
                  Review your baseline details before generating your initial immutable Tax Twin snapshot.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Summary Table */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Taxpayer Persona</div>
                      <div className="text-sm font-semibold text-slate-900">{category} • {residency}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="text-xs text-teal-700">
                      Edit
                    </Button>
                  </div>

                  <div className="p-3.5 rounded-xl border bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Annual Gross Income</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {formatINR(grossSalary + otherIncome)}
                        <span className="text-xs text-slate-500 font-normal ml-2">
                          (Salary: {formatINR(grossSalary)} + Other: {formatINR(otherIncome)})
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="text-xs text-teal-700">
                      Edit
                    </Button>
                  </div>

                  <div className="p-3.5 rounded-xl border bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Declared Deductions (Old Regime)</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {formatINR(sec80c + sec80d + sec24b + nps80ccd)}
                        <span className="text-xs text-slate-500 font-normal ml-2">
                          (80C: {formatINR(sec80c)}, 80D: {formatINR(sec80d)}, 24b: {formatINR(sec24b)}, NPS: {formatINR(nps80ccd)})
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)} className="text-xs text-teal-700">
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-teal-900 font-semibold text-sm">
                    <Layers className="h-4 w-4 text-teal-700" />
                    <span>Your information will be used to create your Tax Twin.</span>
                  </div>
                  <p className="text-xs text-teal-800 leading-relaxed">
                    Tax Twin v1 represents your self-declared baseline. As you upload Form 16, AIS, or salary slips later, confirmed reconciliations will create versioned, immutable updates (v2, v3) without altering historical records.
                  </p>
                </div>

                {submitStatus && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span>{submitStatus}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" disabled={isSubmitting} onClick={prevStep}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <Button
                  disabled={isSubmitting}
                  onClick={handleCreateTaxTwin}
                  className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...
                    </>
                  ) : (
                    <>
                      Initialize Tax Twin v1 <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}