# ANTIGRAVITY PROMPT — MEMBER 3: Frontend, UX & Deployment

You are Member 3 of a 3-person team building an **AI-Powered Personal Tax Copilot for Indian taxpayers**.

## PROBLEM STATEMENT
India's income-tax system is complex and changes over time. Taxpayers may struggle with regimes, slabs, deductions, exemptions, filing requirements, deadlines and compliance. Information is fragmented across official portals and long documents. Build a system that turns this complexity into personalized, understandable and actionable guidance while keeping statutory calculations deterministic and auditable.

## YOUR MISSION
Own Next.js UI, design system, onboarding, dashboard, Tax Twin screens, regime comparison, AI chat UI, document/reconciliation UI, What-If Lab, Action Plan and production deployment.

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
1. Build Next.js TypeScript app and reusable design system.
2. Build landing, authentication and progressive onboarding.
3. Build Dashboard with estimated tax, readiness, issues and next actions.
4. Build Tax Twin interface with source and verification states.
5. Build regime comparison and calculation trace UI.
6. Build action-oriented AI Copilot UI.
7. Build document upload, extraction review and reconciliation screens.
8. Build isolated What-If Lab with Apply/Discard.
9. Build Action Plan and filing-readiness UI.
10. Consume shared API contracts; never duplicate tax arithmetic in the browser.
11. Deploy the application, configure secrets, HTTPS, logs, health checks and production environment.

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
