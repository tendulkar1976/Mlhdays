# SHARED CONTRACTS

## Product
AI-Powered Personal Tax Copilot for Indian taxpayers.

## Architecture
User → Next.js UI → server API → Tax Twin → deterministic Tax Engine → validated result.
AI path: UI → server AI endpoint → Gemini → controlled tools → Tax Engine/API → validated result → Gemini explanation.

## Immutable Tax Twin
TaxProfile → TaxTwin v1 → TaxTwin v2 → TaxTwin v3. Historical versions are immutable.

## Financial fact invariant
facts.tax_twin_id → tax_twins.id
income_sources.tax_twin_id → tax_twins.id
transactions.tax_twin_id → tax_twins.id

## Calculation APIs
POST /api/v1/tax/calculate/stateless
POST /api/v1/tax/calculate/twin/{tax_twin_id}

## Verification states
VERIFIED, NEEDS_CONFIRMATION, CONFLICT, EXPERT_REVIEW.
A confirmed reconciliation that changes financial state creates a new Tax Twin version and recalculates affected outputs.

## Tax baseline
Initial statutory baseline: FY 2025-26 / AY 2026-27. The Income Tax Department currently lists the new-regime slabs for individuals as ₹0–4L Nil; ₹4–8L 5%; ₹8–12L 10%; ₹12–16L 15%; ₹16–20L 20%; ₹20–24L 25%; above ₹24L 30%. It also states that eligible resident individuals can receive a Section 87A rebate up to ₹60,000 where total income does not exceed ₹12L from AY 2026-27. Treat this as a versioned rule baseline and verify against official statutory material before production.

## Gemini
Gemini API is mandatory. Use the Google GenAI SDK/server-side Gemini API. Store the credential as GEMINI_API_KEY in the platform's secure secret manager/environment. Never expose it in browser code, never use NEXT_PUBLIC_GEMINI_API_KEY, never hard-code it, and never commit it to Git. Gemini may understand, explain, retrieve, extract and orchestrate tools; the deterministic tax engine must remain authoritative for numerical tax calculations.

## Shared stack
Next.js + TypeScript, React, Tailwind CSS + shadcn/ui, Node.js server-side APIs, PostgreSQL, Prisma or Drizzle, Google Gemini API/Google GenAI SDK, pgvector where appropriate, managed object storage, GitHub, managed deployment such as Vercel/Cloud Run, managed PostgreSQL such as Supabase/Postgres.

## Git branches
main
feature/core-tax-engine
feature/ai-copilot
feature/frontend
