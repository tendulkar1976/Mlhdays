"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("vikas@example.com");
  const [password, setPassword] = useState("password123");
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

    // Mock authentication handshake
    setTimeout(() => {
      setLoading(false);
      router.push("/onboarding");
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-sm border bg-white">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 font-bold text-white shadow-sm text-lg">
            ₹
          </div>
          <Badge variant="outline" className="mx-auto text-xs bg-teal-50 text-teal-800 border-teal-200">
            AY 2026-27 (FY 2025-26)
          </Badge>
          <CardTitle className="text-xl">Sign In to TaxCopilot</CardTitle>
          <CardDescription>
            Deterministic personal tax copilot & immutable Tax Twin for Indian taxpayers.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2 text-xs">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                Statutory calculations are computed strictly via authoritative backend APIs. Zero client-side math.
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
                  Sign In to Workspace <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-between w-full text-xs text-slate-500 pt-2 border-t">
              <span>New taxpayer?</span>
              <Link href="/register" className="text-teal-700 font-semibold hover:underline">
                Create an account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}