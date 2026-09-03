import { NextResponse } from "next/server";

/**
 * Public health endpoint (TRD.md / Security specification).
 * Returns minimal service status without leaking backend connection strings or credentials.
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    app: "AI-Powered Personal Tax Copilot (India)",
    target_period: "FY 2025-26",
    assessment_year: "AY 2026-27",
    timestamp: new Date().toISOString(),
  });
}
