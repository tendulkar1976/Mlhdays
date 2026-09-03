"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  Scale,
  Sparkles,
  FileText,
  FlaskConical,
  CheckSquare,
  ShieldCheck,
  X,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Tax Twin",
    href: "/tax-twin",
    icon: Layers,
    badge: "v2 Active",
  },
  {
    label: "Regime Comparison",
    href: "/regime-comparison",
    icon: Scale,
    badge: null,
  },
  {
    label: "AI Copilot",
    href: "/copilot",
    icon: Sparkles,
    badge: "Gemini",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
    badge: "Recon",
  },
  {
    label: "What-If Lab",
    href: "/what-if",
    icon: FlaskConical,
    badge: "Sandbox",
  },
  {
    label: "Action Plan",
    href: "/action-plan",
    icon: CheckSquare,
    badge: "4 Steps",
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 font-bold text-white shadow-sm text-sm">
              ₹
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-sm">
                TaxCopilot
              </span>
              <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded ml-1 font-semibold border border-teal-200">
                PRO
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close navigation"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Taxpayer Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      isActive
                        ? "bg-teal-200/60 text-teal-900"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Guarantee Banner */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Deterministic Audit</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tax calculations are verified against statutory rules (AY 2026-27). Historical Tax Twins remain immutable.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}