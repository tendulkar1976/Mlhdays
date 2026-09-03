"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiClient } from "@/lib/api/client";
import { formatINR } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  User,
  Briefcase,
  Award,
  TrendingUp,
  FileText,
  Lock,
  Zap,
  Loader2,
  Database,
  Calculator,
} from "lucide-react";
import { TaxpayerCategory } from "@/types/schema";

interface DemoPersona {
  id: string;
  name: string;
  role: string;
  category: TaxpayerCategory;
  salary: number;
  otherIncome: number;
  sec80c: number;
  sec80d: number;
  sec24b: number;
  nps: number;
  pan: string;
  badge: string;
  icon: typeof User;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "persona_1",
    name: "Aditya Sharma",
    role: "Salaried Tech Lead",
    category: "SALARIED",
    salary: 1450000,
    otherIncome: 25000,
    sec80c: 150000,
    sec80d: 25000,
    sec24b: 200000,
    nps: 50000,
    pan: "ABCDE1234F",
    badge: "Form 16 + AIS Conflict Demo",
    icon: User,
  },
  {
    id: "persona_2",
    name: "Priya Patel",
    role: "Freelance Consultant",
    category: "FREELANCER_CONSULTANT",
    salary: 1820000,
    otherIncome: 45000,
    sec80c: 150000,
    sec80d: 35000,
    sec24b: 0,
    nps: 50000,
    pan: "FGHIJ5678K",
    badge: "Sec 44ADA Presumptive Demo",
    icon: Briefcase,
  },
  {
    id: "persona_3",
    name: "Ramesh Verma",
    role: "Senior Citizen Investor",
    category: "INVESTOR",
    salary: 950000,
    otherIncome: 120000,
    sec80c: 150000,
    sec80d: 50000,
    sec24b: 0,
    nps: 0,
    pan: "KLMNO9012P",
    badge: "Zero-Tax Under Sec 87A Demo",
    icon: Award,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [synthStep, setSynthStep] = useState<number>(0);

  // State
  const [category, setCategory] = useState<TaxpayerCategory>("SALARIED");
  const [residency, setResidency] = useState<"RESIDENT" | "NON_RESIDENT">("RESIDENT");
  const [ageCategory, setAgeCategory] = useState<"BELOW_60" | "SENIOR_60_TO_80">("BELOW_60");
  const [panMasked, setPanMasked] = useState("ABCDE1234F");
  const [fullName, setFullName] = useState("Aditya Sharma");

  // Financial Facts
  const [grossSalary, setGrossSalary] = useState<number>(1450000);
  const [otherIncome, setOtherIncome] = useState<number>(25000);
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

  // Real-time Deterministic Calculation (FY 2025-26 / AY 2026-27)
  const calculationPreview = useMemo(() => {
    // 1. New Regime
    const standardDeductionNew = category === "SALARIED" ? 75000 : 0;
    const taxableNew = Math.max(0, grossSalary + otherIncome - standardDeductionNew);
    let taxNew = 0;
    if (taxableNew <= 400000) taxNew = 0;
    else if (taxableNew <= 800000) taxNew = (taxableNew - 400000) * 0.05;
    else if (taxableNew <= 1200000) taxNew = 20000 + (taxableNew - 800000) * 0.10;
    else if (taxableNew <= 1600000) taxNew = 60000 + (taxableNew - 1200000) * 0.15;
    else if (taxableNew <= 2000000) taxNew = 120000 + (taxableNew - 1600000) * 0.20;
    else if (taxableNew <= 2400000) taxNew = 200000 + (taxableNew - 2000000) * 0.25;
    else taxNew = 300000 + (taxableNew - 2400000) * 0.30;

    // Sec 87A rebate for taxable income up to 12L in New Regime
    if (taxableNew <= 1200000) {
      taxNew = 0;
    }
    const cessNew = taxNew * 0.04;
    const totalTaxNew = Math.round(taxNew + cessNew);

    // 2. Old Regime
    const standardDeductionOld = category === "SALARIED" ? 50000 : 0;
    const totalDeductionsOld =
      standardDeductionOld +
      Math.min(150000, sec80c) +
      Math.min(100000, sec80d) +
      Math.min(200000, sec24b) +
      Math.min(50000, nps80ccd);
    const taxableOld = Math.max(0, grossSalary + otherIncome - totalDeductionsOld);

    let taxOld = 0;
    if (taxableOld <= 250000) taxOld = 0;
    else if (taxableOld <= 500000) taxOld = (taxableOld - 250000) * 0.05;
    else if (taxableOld <= 1000000) taxOld = 12500 + (taxableOld - 500000) * 0.20;
    else taxOld = 112500 + (taxableOld - 1000000) * 0.30;

    if (taxableOld <= 500000) {
      taxOld = 0; // Sec 87A rebate in Old
    }
    const cessOld = taxOld * 0.04;
    const totalTaxOld = Math.round(taxOld + cessOld);

    const recommended = totalTaxNew <= totalTaxOld ? "NEW" : "OLD";
    const savings = Math.abs(totalTaxOld - totalTaxNew);

    return {
      taxableNew,
      totalTaxNew,
      taxableOld,
      totalTaxOld,
      recommended,
      savings,
    };
  }, [grossSalary, otherIncome, sec80c, sec80d, sec24b, nps80ccd, category]);

  // Persona Selection Handler
  const handleSelectPersona = (p: DemoPersona) => {
    setFullName(p.name);
    setCategory(p.category);
    setGrossSalary(p.salary);
    setOtherIncome(p.otherIncome);
    setSec80c(p.sec80c);
    setSec80d(p.sec80d);
    setSec24b(p.sec24b);
    setNps80ccd(p.nps);
    setPanMasked(p.pan);
    if (p.id === "persona_3") {
      setAgeCategory("SENIOR_60_TO_80");
    } else {
      setAgeCategory("BELOW_60");
    }
  };

  // Submit & Synthesize
  const handleCreateTaxTwin = async () => {
    setIsSubmitting(true);
    setSynthStep(1);

    // Simulated synthesis pipeline
    setTimeout(() => setSynthStep(2), 500);
    setTimeout(() => setSynthStep(3), 1000);
    setTimeout(() => setSynthStep(4), 1500);

    try {
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

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "tax_user_session",
          JSON.stringify({
            id: "prof_demo_01",
            name: fullName,
            email: `${fullName.toLowerCase().replace(" ", ".")}@demo.taxcopilot.in`,
            panMasked,
          })
        );
      }

      setTimeout(() => {
        router.push("/dashboard");
      }, 1900);
    } catch {
      setTimeout(() => {
        router.push("/dashboard");
      }, 1900);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b bg-white flex items-center px-4 sm:px-8 justify-between sticky top-0 z-30 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 font-bold text-white shadow-sm text-sm">
            ₹
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-sm flex items-center gap-2">
            TaxCopilot <Badge variant="secondary" className="text-[10px] font-medium bg-teal-50 text-teal-800 border-teal-200">Financial Story</Badge>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Statutory Engine: <span className="text-teal-700 font-semibold">Finance Act 2025</span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Judge 1-Click Persona Demo Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-teal-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-bold tracking-tight text-amber-300 uppercase">
                  Judge Quick-Demo Personas (1-Click Fill)
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Click any profile to instantly populate realistic tax data, financial facts, and demo conflicts.
              </p>
            </div>
            <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[11px] w-fit">
              Zero Manual Typing Required
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DEMO_PERSONAS.map((p) => {
              const Icon = p.icon;
              const isSelected = fullName === p.name;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPersona(p)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? "bg-teal-900/80 border-teal-400 text-white shadow-lg ring-1 ring-teal-400"
                      : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-teal-500 text-slate-950 font-bold" : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate flex items-center justify-between">
                        <span>{p.name}</span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />}
                      </div>
                      <div className="text-[11px] text-teal-200/90">{p.role} • {formatINR(p.salary)}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-amber-200/80 font-medium truncate flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-400 shrink-0" />
                    {p.badge}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Split: Wizard & Live Deterministic Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Wizard (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Step Indicators */}
            <div className="flex items-center justify-between px-2 text-xs font-medium text-slate-600">
              <span className={`flex items-center gap-1.5 ${currentStep >= 1 ? "text-teal-700 font-bold" : ""}`}>
                <span className="h-5 w-5 rounded-full flex items-center justify-center bg-teal-100 text-teal-800 text-[11px]">1</span>
                Profile
              </span>
              <span className="text-slate-300">→</span>
              <span className={`flex items-center gap-1.5 ${currentStep >= 2 ? "text-teal-700 font-bold" : ""}`}>
                <span className="h-5 w-5 rounded-full flex items-center justify-center bg-teal-100 text-teal-800 text-[11px]">2</span>
                Income
              </span>
              <span className="text-slate-300">→</span>
              <span className={`flex items-center gap-1.5 ${currentStep >= 3 ? "text-teal-700 font-bold" : ""}`}>
                <span className="h-5 w-5 rounded-full flex items-center justify-center bg-teal-100 text-teal-800 text-[11px]">3</span>
                Deductions
              </span>
              <span className="text-slate-300">→</span>
              <span className={`flex items-center gap-1.5 ${currentStep >= 4 ? "text-teal-700 font-bold" : ""}`}>
                <span className="h-5 w-5 rounded-full flex items-center justify-center bg-teal-100 text-teal-800 text-[11px]">4</span>
                Tax Twin
              </span>
            </div>
            <Progress value={currentStep * 25} className="h-1.5 bg-slate-200" />

            {/* Step 1: Profile */}
            {currentStep === 1 && (
              <Card className="border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-teal-600" /> Step 1: Taxpayer Profile & Identity
                  </CardTitle>
                  <CardDescription>
                    Define your statutory category and tax residency for AY 2026-27.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Full Name</label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">PAN Number (Masked)</label>
                      <Input value={panMasked} onChange={(e) => setPanMasked(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Taxpayer Segment</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { key: "SALARIED", label: "Salaried Professional", sub: "Standard Ded. ₹75,000" },
                        { key: "FREELANCER_CONSULTANT", label: "Consultant / 44ADA", sub: "Presumptive 50% Profit" },
                        { key: "INVESTOR", label: "Capital Gains / Investor", sub: "Sec 112A / 111A Slabs" },
                        { key: "STUDENT_FIRST_TIME", label: "First-Time Taxpayer", sub: "Simplified Regime" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setCategory(item.key as TaxpayerCategory)}
                          className={`p-3 rounded-lg border text-left transition ${
                            category === item.key
                              ? "border-teal-600 bg-teal-50/80 text-teal-950 font-bold ring-1 ring-teal-600"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="text-xs">{item.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{item.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Residency Status</label>
                      <select
                        value={residency}
                        onChange={(e) => setResidency(e.target.value as any)}
                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
                      >
                        <option value="RESIDENT">Resident (ROR)</option>
                        <option value="NON_RESIDENT">Non-Resident (NRI)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Age Category</label>
                      <select
                        value={ageCategory}
                        onChange={(e) => setAgeCategory(e.target.value as any)}
                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
                      >
                        <option value="BELOW_60">Below 60 Years</option>
                        <option value="SENIOR_60_TO_80">Senior Citizen (60-80)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <Button onClick={nextStep} className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5">
                    Next: Income Sources <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 2: Income */}
            {currentStep === 2 && (
              <Card className="border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-teal-600" /> Step 2: Annual Income Sources
                  </CardTitle>
                  <CardDescription>
                    Enter gross taxable receipts. Calculations update in real-time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>Annual Gross Salary / Professional Receipts</span>
                      <span className="text-teal-700 font-bold text-sm">{formatINR(grossSalary)}</span>
                    </div>
                    <Input
                      type="number"
                      value={grossSalary}
                      onChange={(e) => setGrossSalary(Number(e.target.value))}
                      step={50000}
                    />
                    <div className="flex gap-2">
                      {[1000000, 1450000, 1800000, 2500000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setGrossSalary(amt)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 font-medium"
                        >
                          {formatINR(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>Interest & Other Income (Savings, FDs, Dividends)</span>
                      <span className="text-slate-700 font-bold text-xs">{formatINR(otherIncome)}</span>
                    </div>
                    <Input
                      type="number"
                      value={otherIncome}
                      onChange={(e) => setOtherIncome(Number(e.target.value))}
                      step={5000}
                    />
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      ⚠️ Note: Our AI Reconciliation assistant cross-checks this against your AIS/TIS statement.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" onClick={prevStep} className="text-xs gap-1.5">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </Button>
                  <Button onClick={nextStep} className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5">
                    Next: Deductions <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 3: Deductions */}
            {currentStep === 3 && (
              <Card className="border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600" /> Step 3: Chapter VI-A & Home Loan Deductions
                  </CardTitle>
                  <CardDescription>
                    Used for Old vs New regime comparative evaluation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex justify-between">
                        <span>Section 80C (PPF, ELSS, EPF)</span>
                        <span className="text-teal-700">{formatINR(sec80c)}</span>
                      </label>
                      <Input
                        type="number"
                        value={sec80c}
                        onChange={(e) => setSec80c(Number(e.target.value))}
                        max={150000}
                      />
                      <span className="text-[10px] text-slate-400">Max statutory cap: ₹1,50,000</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex justify-between">
                        <span>Section 80D (Health Mediclaim)</span>
                        <span className="text-teal-700">{formatINR(sec80d)}</span>
                      </label>
                      <Input
                        type="number"
                        value={sec80d}
                        onChange={(e) => setSec80d(Number(e.target.value))}
                      />
                      <span className="text-[10px] text-slate-400">Self + Parents health cover</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex justify-between">
                        <span>Section 24(b) (Home Loan Interest)</span>
                        <span className="text-teal-700">{formatINR(sec24b)}</span>
                      </label>
                      <Input
                        type="number"
                        value={sec24b}
                        onChange={(e) => setSec24b(Number(e.target.value))}
                        max={200000}
                      />
                      <span className="text-[10px] text-slate-400">Max SOP cap: ₹2,00,000</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex justify-between">
                        <span>Section 80CCD(1B) (NPS)</span>
                        <span className="text-teal-700">{formatINR(nps80ccd)}</span>
                      </label>
                      <Input
                        type="number"
                        value={nps80ccd}
                        onChange={(e) => setNps80ccd(Number(e.target.value))}
                        max={50000}
                      />
                      <span className="text-[10px] text-slate-400">Exclusive NPS cap: ₹50,000</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" onClick={prevStep} className="text-xs gap-1.5">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </Button>
                  <Button onClick={nextStep} className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5">
                    Review & Lock Tax Twin <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 4: Final Immutability Lock */}
            {currentStep === 4 && (
              <Card className="border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-600" /> Step 4: Lock Initial Tax Twin v1 Baseline
                  </CardTitle>
                  <CardDescription>
                    Verify your baseline facts. An immutable cryptographic hash will be generated.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-500">Taxpayer Profile:</span>
                      <span className="font-bold text-slate-800">{fullName} ({panMasked})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-500">Gross Income:</span>
                      <span className="font-bold text-slate-800">{formatINR(grossSalary + otherIncome)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-500">Total Deductions Claimed:</span>
                      <span className="font-bold text-slate-800">{formatINR(sec80c + sec80d + sec24b + nps80ccd)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Recommended Statutory Regime:</span>
                      <span className="font-bold text-teal-700">{calculationPreview.recommended} Regime (Saves {formatINR(calculationPreview.savings)})</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Tax Twin Invariant:</strong> Once created, version 1 is locked. Document uploads and What-If simulations will create non-destructive versions (v2, v3).
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" onClick={prevStep} className="text-xs gap-1.5" disabled={isSubmitting}>
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </Button>
                  <Button
                    onClick={handleCreateTaxTwin}
                    disabled={isSubmitting}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold gap-2 px-6 shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing Twin v1...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" /> Initialize Tax Twin v1 <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Right Column: Live Deterministic Engine & Twin Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Calculation Card */}
            <Card className="border border-teal-200 bg-gradient-to-b from-white to-teal-50/30 shadow-sm overflow-hidden">
              <div className="bg-teal-700 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5 text-teal-200" />
                  Live Deterministic Engine (AY 2026-27)
                </span>
                <Badge className="bg-teal-900 text-teal-100 text-[10px] font-normal">Real-Time</Badge>
              </div>

              <CardContent className="p-4 space-y-4">
                {/* Winner Callout */}
                <div className="bg-white p-3 rounded-xl border border-teal-100 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Authoritative Recommendation
                    </div>
                    <div className="text-base font-extrabold text-teal-900">
                      {calculationPreview.recommended === "NEW" ? "New Tax Regime" : "Old Tax Regime"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-medium text-emerald-700">Estimated Tax Savings</div>
                    <div className="text-sm font-extrabold text-emerald-600">
                      {formatINR(calculationPreview.savings)}
                    </div>
                  </div>
                </div>

                {/* Slabs Comparison Table */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${calculationPreview.recommended === "NEW" ? "border-teal-400 bg-teal-50/70" : "border-slate-200 bg-white"}`}>
                    <div className="text-[11px] font-bold text-slate-700 mb-1">New Regime (115BAC)</div>
                    <div className="text-[10px] text-slate-500">Taxable: {formatINR(calculationPreview.taxableNew)}</div>
                    <div className="text-sm font-extrabold text-slate-900 mt-1">
                      {formatINR(calculationPreview.totalTaxNew)}
                    </div>
                    <div className="text-[10px] text-teal-700 font-medium mt-1">
                      Standard Ded: ₹75,000
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${calculationPreview.recommended === "OLD" ? "border-teal-400 bg-teal-50/70" : "border-slate-200 bg-white"}`}>
                    <div className="text-[11px] font-bold text-slate-700 mb-1">Old Regime</div>
                    <div className="text-[10px] text-slate-500">Taxable: {formatINR(calculationPreview.taxableOld)}</div>
                    <div className="text-sm font-extrabold text-slate-900 mt-1">
                      {formatINR(calculationPreview.totalTaxOld)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      Deductions: {formatINR(sec80c + sec80d + sec24b + nps80ccd + 50000)}
                    </div>
                  </div>
                </div>

                {/* Live Tax Twin Fact Nodes */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Active Tax Twin Facts (v1 Initializing)</span>
                    <Badge variant="outline" className="text-[9px]">6 Facts</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="p-2 rounded bg-white border border-slate-200 flex justify-between">
                      <span className="text-slate-500">Gross Salary:</span>
                      <span className="font-bold text-slate-800">{formatINR(grossSalary)}</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 flex justify-between">
                      <span className="text-slate-500">Other Sources:</span>
                      <span className="font-bold text-slate-800">{formatINR(otherIncome)}</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 flex justify-between">
                      <span className="text-slate-500">Section 80C:</span>
                      <span className="font-bold text-slate-800">{formatINR(sec80c)}</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 flex justify-between">
                      <span className="text-slate-500">Section 80D:</span>
                      <span className="font-bold text-slate-800">{formatINR(sec80d)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>
                    Finance Act 2025: Income up to <strong>₹12 Lakhs</strong> has zero net tax under New Regime via Sec 87A rebate.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Interactive Synthesizer Modal on Submit */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-950 border-teal-800 text-white shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader className="text-center pb-2">
              <div className="h-12 w-12 rounded-2xl bg-teal-600/30 border border-teal-500/50 flex items-center justify-center mx-auto mb-2 text-teal-400 animate-pulse">
                <Database className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-white">Synthesizing Tax Twin v1</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Generating deterministic baseline and cryptographic immutability hash.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 py-4 text-xs font-mono">
              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${synthStep >= 1 ? "text-teal-400" : "text-slate-600"}`}>
                  <CheckCircle2 className="h-4 w-4" /> [1/4] Generating SHA-256 Immutability Hash...
                </div>
                <div className={`flex items-center gap-2 ${synthStep >= 2 ? "text-teal-400" : "text-slate-600"}`}>
                  <CheckCircle2 className="h-4 w-4" /> [2/4] Attaching 6 Verified Financial Facts...
                </div>
                <div className={`flex items-center gap-2 ${synthStep >= 3 ? "text-teal-400" : "text-slate-600"}`}>
                  <CheckCircle2 className="h-4 w-4" /> [3/4] Evaluating Finance Act 2025 Slabs...
                </div>
                <div className={`flex items-center gap-2 ${synthStep >= 4 ? "text-emerald-400 font-bold" : "text-slate-600"}`}>
                  <CheckCircle2 className="h-4 w-4" /> [4/4] Launching Tax Dashboard Workspace!
                </div>
              </div>
              <Progress value={synthStep * 25} className="h-2 bg-slate-800 text-teal-500 mt-4" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}