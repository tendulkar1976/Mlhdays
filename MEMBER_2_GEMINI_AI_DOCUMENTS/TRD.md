# TRD.md — Gemini AI, RAG & Document Intelligence

## Stack
Next.js + TypeScript; Node.js server-side APIs; PostgreSQL; Prisma/Drizzle; Gemini API/Google GenAI SDK; GitHub; managed deployment.

## Calculation APIs
POST /api/v1/tax/calculate/stateless
POST /api/v1/tax/calculate/twin/{tax_twin_id}

## Gemini requirement
Gemini API is mandatory. Use the Google GenAI SDK/server-side Gemini API. Store the credential as GEMINI_API_KEY in the platform's secure secret manager/environment. Never expose it in browser code, never use NEXT_PUBLIC_GEMINI_API_KEY, never hard-code it, and never commit it to Git. Gemini may understand, explain, retrieve, extract and orchestrate tools; the deterministic tax engine must remain authoritative for numerical tax calculations.

## Implementation
- [ ] Integrate Gemini through server-side code using GEMINI_API_KEY.
- [ ] Build AI orchestrator with structured input/output schemas.
- [ ] Create controlled tools: get_tax_twin, get_profile, get_facts, search_tax_knowledge, calculate_tax, compare_regimes, create_scenario, get_sources and get_deadlines.
- [ ] Implement tax knowledge retrieval with FY/AY/effective-date/rule-version metadata.
- [ ] Implement Form 16 and other supported document extraction.
- [ ] Show field-level extraction confidence and require confirmation for uncertain data.
- [ ] Assist reconciliation without silently resolving conflicts.
- [ ] Use deterministic tax APIs whenever a numerical result is required.
- [ ] Implement timeout, retry, rate limit, fallback and error handling.
- [ ] Prevent hallucinated sections, deductions, deadlines and tax amounts.

## Shared calculation response
calculation_id, tax_twin_id, tax_period, rule_version, taxable_income, tax_before_rebate, rebate, surcharge, cess, total_tax, assumptions, warnings, calculation_trace.
