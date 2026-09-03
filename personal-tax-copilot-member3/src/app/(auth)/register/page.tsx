"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, ArrowRight, Loader2, UserCheck } from "lucide-react";
import { TaxpayerCategory } from "@/types/schema";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("Vikas A");
  const [email, setEmail] = useState("vikas@example.com");
  const [password, setPassword] = useState("password123");
  const [category, setCategory] = useState<TaxpayerCategory>("SALARIED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      router.push("/onboarding");
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg shadow-sm border bg-white">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 font-bold text-white shadow-sm text-lg">
            ₹
          </div>
          <Badge variant="outline" className="mx-auto text-xs bg-teal-50 text-teal-800 border-teal-200">
            AY 2026-27 (FY 2025-26)
          </Badge>
          <CardTitle className="text-xl">Create TaxCopilot Account</CardTitle>
          <CardDescription>
            Personal tax planning & immutable Tax Twin for Indian taxpayers.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2 text-xs">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Full Name</label>
                <Input
                  type="text"
                  placeholder="Vikas A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Email Address</label>
                <Input
                  type="email"
                  placeholder="vikas@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Taxpayer Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Taxpayer Profile</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: "SALARIED", label: "Salaried Employee" },
                  { key: "FREELANCER_CONSULTANT", label: "Freelancer / Consultant" },
                  { key: "INVESTOR", label: "Investor / Trader" },
                  { key: "STUDENT_FIRST_TIME", label: "Student / First-time" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key as TaxpayerCategory)}
                    className={`p-2.5 rounded-lg border text-left font-medium transition ${
                      category === item.key
                        ? "border-teal-600 bg-teal-50/70 text-teal-900 font-semibold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Your tax data creates an isolated, versioned Tax Twin. Historical records are strictly immutable.
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Profile...
                </>
              ) : (
                <>
                  Continue to Onboarding <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-between w-full text-xs text-slate-500 pt-2 border-t">
              <span>Already registered?</span>
              <Link href="/login" className="text-teal-700 font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}