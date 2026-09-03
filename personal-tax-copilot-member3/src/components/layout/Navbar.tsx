"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Menu,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  User,
  ChevronDown,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeTwinVersion?: number;
  recommendedRegime?: "NEW" | "OLD";
  assessmentYear?: string;
  financialYear?: string;
}

export function Navbar({
  onToggleSidebar,
  activeTwinVersion = 2,
  recommendedRegime = "NEW",
  assessmentYear = "AY 2026-27",
  financialYear = "FY 2025-26",
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle + Logo */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 font-bold text-white shadow-sm">
            ₹
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900">
                TaxCopilot
              </span>
              <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 border border-teal-200">
                AI
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400">
              Personal Tax Copilot (India)
            </p>
          </div>
        </Link>
      </div>

      {/* Center / Right: Indicators & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Assessment Year Pill */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{assessmentYear}</span>
          <span className="text-slate-400">({financialYear})</span>
        </div>

        {/* Tax Twin Version Indicator */}
        <Link href="/tax-twin" className="group">
          <div className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/80 px-2.5 py-1 text-xs font-medium text-teal-800 transition hover:bg-teal-100">
            <Layers className="h-3 w-3 text-teal-600" />
            <span>Twin v{activeTwinVersion}</span>
            <span className="hidden sm:inline text-[10px] text-teal-600 bg-teal-100 px-1 rounded font-semibold">Active</span>
          </div>
        </Link>

        {/* Regime Indicator */}
        <Link href="/regime-comparison" className="hidden sm:block">
          <Badge variant="regime_recommended" className="text-xs px-2.5 py-0.5">
            {recommendedRegime} Regime Recommended
          </Badge>
        </Link>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            VA
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-900">Vikas A</div>
            <div className="text-[10px] text-slate-400">Salaried • Resident</div>
          </div>
        </div>
      </div>
    </header>
  );
}