"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, ArrowRight, Loader2, Sparkles, User, Briefcase, Award } from "lucide-react";

interface StagingProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  panMasked: string;
  incomeSummary: string;
  icon: typeof User;
}

const STAGING_PROFILES: StagingProfile[] = [
  {
    id: "prof_demo_01",
    name: "Aditya Sharma",
    email: "aditya.sharma@demo.taxcopilot.in",
    role: "Salaried Tech Lead",
    panMasked: "ABCDE1234F",
    incomeSummary: "₹14,50,000 (Form 16 + AIS Conflict)",
    icon: User,
  },
  {
    id: "prof_demo_02",
    name: "Priya Patel",
    email: "priya.patel@demo.taxcopilot.in",
    role: "Consultant / Freelancer",
    panMasked: "FGHIJ5678K",
    incomeSummary: "₹18,20,000 (Sec 44ADA Eligible)",
    icon: Briefcase,
  },
  {
    id: "prof_demo_03",
    name: "Ramesh Verma",
    email: "ramesh.verma@demo.taxcopilot.in",
    role: "Senior Citizen Investor",
    panMasked: "KLMNO9012P",
    incomeSummary: "₹9,50,000 (Pension + Dividend/Interest)",
    icon: Award,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("aditya.sharma@demo.taxcopilot.in");
  const [password, setPassword] = useState("stagingPass123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // Save session info in localStorage
    if (typeof window !== "undefined") {
      const selected = STAGING_PROFILES.find((p) => p.email === email) || {
        id: "prof_custom_user",
        name: email.split("@")[0],
        email: email,
        panMasked: "ABCDE1234F",
      };
      localStorage.setItem("tax_user_session", JSON.stringify(selected));
    }

    // Handshake and redirect to dashboard
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 500);
  };

  const handleSelectStagingProfile = (profile: StagingProfile) => {
    setEmail(profile.email);
    setPassword("stagingPass123");
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-8">
      <Card className="w-full max-w-lg shadow-sm border bg-white">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 font-bold text-white shadow-sm text-lg">
            ₹
          </div>
          <Badge variant="outline" className="mx-auto text-xs bg-teal-50 text-teal-800 border-teal-200">
            AY 2026-27 (FY 2025-26)
          </Badge>
          <CardTitle className="text-xl">Sign In to TaxCopilot</CardTitle>
          <CardDescription>
            Access your immutable Tax Twin & deterministic tax calculations.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2 text-xs">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Quick 1-Click Staging Profile Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Select a Staging / Demo Profile (1-Click)
                </label>
                <span className="text-[11px] text-teal-700 font-medium">Pre-loaded Tax Twins</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {STAGING_PROFILES.map((prof) => {
                  const Icon = prof.icon;
                  const isSelected = email === prof.email;
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => handleSelectStagingProfile(prof)}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? "border-teal-600 bg-teal-50/80 text-teal-950 ring-1 ring-teal-600"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{prof.name} <span className="text-[10px] text-slate-500 font-normal">({prof.role})</span></div>
                          <div className="text-[11px] text-slate-500">{prof.incomeSummary} • PAN: {prof.panMasked}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 font-normal">
                        {isSelected ? "Selected" : "Choose"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-slate-400">or enter credentials</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Email Address</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">Password</label>
                <span className="text-[11px] text-teal-700 hover:underline cursor-pointer">Forgot?</span>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Calculations are computed strictly via deterministic backend engine with Finance Act 2025 rules.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In to Tax Workspace <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-between w-full text-xs text-slate-500 pt-2 border-t">
              <span>Need a custom profile?</span>
              <Link href="/register" className="text-teal-700 font-semibold hover:underline">
                Create new account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}