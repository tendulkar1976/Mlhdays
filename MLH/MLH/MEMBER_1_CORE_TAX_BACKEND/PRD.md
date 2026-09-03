# PRD — Core Tax, Backend & Database

## Mission
Own database, immutable Tax Twin versioning, deterministic tax engine, statutory rule versioning, calculation APIs, validation, auditability and automated tests.

## Problem Statement
India's income-tax system is complex and continuously evolving, with different regimes, slabs, deductions, exemptions, filing requirements, deadlines and compliance rules. Students, first-time earners, salaried employees and other ordinary taxpayers may lack the tax literacy required to understand what applies to their circumstances. Information is fragmented across official portals, notifications and lengthy documents, making it difficult to obtain accurate, relevant and understandable guidance.

The product is an **AI-powered personal tax guidance and planning platform for Indian taxpayers**. It must convert complex tax information into personalized, explainable and actionable guidance while preserving statutory correctness, evidence, privacy and historical immutability.

## Your role
Own database, immutable Tax Twin versioning, deterministic tax engine, statutory rule versioning, calculation APIs, validation, auditability and automated tests.

## Functional scope
- [ ] Implement users, tax_profiles, tax_periods and tax_twins.
- [ ] Implement facts, income_sources and transactions with tax_twin_id foreign keys.
- [ ] Implement tax_calculations, scenarios, reconciliation, sources, documents and audit entities required by the schema.
- [ ] Implement immutable Tax Twin lifecycle; corrections create new versions.
- [ ] Implement FY 2025-26 / AY 2026-27 rule version and all supported calculation components.
- [ ] Implement new/old regime calculation and comparison.
- [ ] Implement POST /api/v1/tax/calculate/stateless.
- [ ] Implement POST /api/v1/tax/calculate/twin/{tax_twin_id}.
- [ ] Return calculation trace, assumptions, warnings, rule version and final result.
- [ ] Build regression/reference tests around all slab boundaries and tax components.
- [ ] Add backend validation, database constraints and transaction safety.

## Non-negotiable boundaries
- Gemini is not the final tax arithmetic engine.
- Historical Tax Twin versions are immutable.
- Financial facts are attached to tax_twin_id.
- Reconciliation changes create a new Tax Twin version.
- Rule sets are versioned by FY/AY/effective date.
- Shared API/schema contracts must not be silently changed.

## Technology
Next.js + TypeScript, Node.js server APIs, PostgreSQL, Prisma/Drizzle, Gemini API/Google GenAI SDK, GitHub and managed deployment. Use pgvector for RAG where appropriate.

## Gemini
Gemini API is mandatory. Use the Google GenAI SDK/server-side Gemini API. Store the credential as GEMINI_API_KEY in the platform's secure secret manager/environment. Never expose it in browser code, never use NEXT_PUBLIC_GEMINI_API_KEY, never hard-code it, and never commit it to Git. Gemini may understand, explain, retrieve, extract and orchestrate tools; the deterministic tax engine must remain authoritative for numerical tax calculations.

## Tax baseline
Initial statutory baseline: FY 2025-26 / AY 2026-27. The Income Tax Department currently lists the new-regime slabs for individuals as ₹0–4L Nil; ₹4–8L 5%; ₹8–12L 10%; ₹12–16L 15%; ₹16–20L 20%; ₹20–24L 25%; above ₹24L 30%. It also states that eligible resident individuals can receive a Section 87A rebate up to ₹60,000 where total income does not exceed ₹12L from AY 2026-27. Treat this as a versioned rule baseline and verify against official statutory material before production.

## Acceptance
The subsystem must work locally, pass its tests, respect shared contracts and integrate with the other two team members without duplicating their business logic.
