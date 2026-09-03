# ANTIGRAVITY PROMPT — MEMBER 1: Core Tax, Backend & Database

You are Member 1 of a 3-person team building an **AI-Powered Personal Tax Copilot for Indian taxpayers**.

## PROBLEM STATEMENT
India's income-tax system is complex and changes over time. Taxpayers may struggle with regimes, slabs, deductions, exemptions, filing requirements, deadlines and compliance. Information is fragmented across official portals and long documents. Build a system that turns this complexity into personalized, understandable and actionable guidance while keeping statutory calculations deterministic and auditable.

## YOUR MISSION
Own database, immutable Tax Twin versioning, deterministic tax engine, statutory rule versioning, calculation APIs, validation, auditability and automated tests.

## TECH STACK
- Next.js + TypeScript
- React
- Tailwind CSS + shadcn/ui
- Node.js server-side APIs
- PostgreSQL
- Prisma or Drizzle
- Gemini API + Google GenAI SDK
- pgvector where appropriate for RAG
- GitHub
- Managed production hosting such as Vercel/Cloud Run
- Managed PostgreSQL such as Supabase/Postgres

## GEMINI API KEY — MANDATORY
Gemini API is mandatory. Use the Google GenAI SDK/server-side Gemini API. Store the credential as GEMINI_API_KEY in the platform's secure secret manager/environment. Never expose it in browser code, never use NEXT_PUBLIC_GEMINI_API_KEY, never hard-code it, and never commit it to Git. Gemini may understand, explain, retrieve, extract and orchestrate tools; the deterministic tax engine must remain authoritative for numerical tax calculations.

## TAX RULE BASELINE
Initial statutory baseline: FY 2025-26 / AY 2026-27. The Income Tax Department currently lists the new-regime slabs for individuals as ₹0–4L Nil; ₹4–8L 5%; ₹8–12L 10%; ₹12–16L 15%; ₹16–20L 20%; ₹20–24L 25%; above ₹24L 30%. It also states that eligible resident individuals can receive a Section 87A rebate up to ₹60,000 where total income does not exceed ₹12L from AY 2026-27. Treat this as a versioned rule baseline and verify against official statutory material before production.

## IMMUTABILITY
TaxProfile → TaxTwin v1 → TaxTwin v2 → TaxTwin v3. Never mutate historical versions. Facts, income sources and transactions must reference tax_twin_id.

## API CONTRACT
POST /api/v1/tax/calculate/stateless
POST /api/v1/tax/calculate/twin/{tax_twin_id}

## YOUR TASKS
1. Implement users, tax_profiles, tax_periods and tax_twins.
2. Implement facts, income_sources and transactions with tax_twin_id foreign keys.
3. Implement tax_calculations, scenarios, reconciliation, sources, documents and audit entities required by the schema.
4. Implement immutable Tax Twin lifecycle; corrections create new versions.
5. Implement FY 2025-26 / AY 2026-27 rule version and all supported calculation components.
6. Implement new/old regime calculation and comparison.
7. Implement POST /api/v1/tax/calculate/stateless.
8. Implement POST /api/v1/tax/calculate/twin/{tax_twin_id}.
9. Return calculation trace, assumptions, warnings, rule version and final result.
10. Build regression/reference tests around all slab boundaries and tax components.
11. Add backend validation, database constraints and transaction safety.

## DO NOT
- Do not expose Gemini keys in client code.
- Do not use NEXT_PUBLIC_GEMINI_API_KEY.
- Do not hard-code secrets or commit .env files.
- Do not let Gemini replace deterministic tax arithmetic.
- Do not mutate historical Tax Twin versions.
- Do not duplicate another member's core business logic.
- Do not invent API payloads outside the shared contract.

## WORKING METHOD
1. Inspect the existing repository before editing.
2. Read SHARED_CONTRACTS.md and your folder documents.
3. Audit what is already implemented.
4. Create a small implementation plan.
5. Implement incrementally.
6. Add tests for your owned behavior.
7. Keep the application runnable after each major change.
8. Verify integration with the other two ownership domains.
9. Before deployment, verify secrets, error handling and production configuration.
10. Finish with a handoff summary: files changed, APIs, env variables, tests and remaining risks.

## DEFINITION OF DONE
Your subsystem is implemented, tested, secure, documented, deployable and integrated through the shared contracts.
