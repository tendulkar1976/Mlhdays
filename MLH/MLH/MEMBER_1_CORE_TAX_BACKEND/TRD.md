# TRD.md — Core Tax, Backend & Database

## Stack
Next.js + TypeScript; Node.js server-side APIs; PostgreSQL; Prisma/Drizzle; Gemini API/Google GenAI SDK; GitHub; managed deployment.

## Calculation APIs
POST /api/v1/tax/calculate/stateless
POST /api/v1/tax/calculate/twin/{tax_twin_id}

## Gemini requirement
Gemini API is mandatory. Use the Google GenAI SDK/server-side Gemini API. Store the credential as GEMINI_API_KEY in the platform's secure secret manager/environment. Never expose it in browser code, never use NEXT_PUBLIC_GEMINI_API_KEY, never hard-code it, and never commit it to Git. Gemini may understand, explain, retrieve, extract and orchestrate tools; the deterministic tax engine must remain authoritative for numerical tax calculations.

## Implementation
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

## Shared calculation response
calculation_id, tax_twin_id, tax_period, rule_version, taxable_income, tax_before_rebate, rebate, surcharge, cess, total_tax, assumptions, warnings, calculation_trace.
