# TRACKER.md — Gemini AI, RAG & Document Intelligence

## Tasks
- [x] Integrate Gemini through server-side code using GEMINI_API_KEY.
- [x] Build AI orchestrator with structured input/output schemas.
- [x] Create controlled tools: get_tax_twin, get_profile, get_facts, search_tax_knowledge, calculate_tax, compare_regimes, create_scenario, get_sources and get_deadlines.
- [x] Implement tax knowledge retrieval with FY/AY/effective-date/rule-version metadata.
- [x] Implement Form 16 and other supported document extraction.
- [x] Show field-level extraction confidence and require confirmation for uncertain data.
- [x] Assist reconciliation without silently resolving conflicts.
- [x] Use deterministic tax APIs whenever a numerical result is required.
- [x] Implement timeout, retry, rate limit, fallback and error handling.
- [x] Prevent hallucinated sections, deductions, deadlines and tax amounts.

## Integration gates
- [x] Shared schema contract verified
- [x] Shared API contract verified
- [x] Error states handled
- [x] Security checks passed
- [x] Tests pass
- [x] Production build passes
- [x] End-to-end flow passes
