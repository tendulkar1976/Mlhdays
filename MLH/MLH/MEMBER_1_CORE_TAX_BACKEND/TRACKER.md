# TRACKER.md — Core Tax, Backend & Database

## Tasks
- [x] Implement users, tax_profiles, tax_periods and tax_twins.
- [x] Implement facts, income_sources and transactions with tax_twin_id foreign keys.
- [x] Implement tax_calculations, scenarios, reconciliation, sources, documents and audit entities required by the schema.
- [x] Implement immutable Tax Twin lifecycle; corrections create new versions.
- [x] Implement FY 2025-26 / AY 2026-27 rule version and all supported calculation components.
- [x] Implement new/old regime calculation and comparison.
- [x] Implement POST /api/v1/tax/calculate/stateless.
- [x] Implement POST /api/v1/tax/calculate/twin/{tax_twin_id}.
- [x] Return calculation trace, assumptions, warnings, rule version and final result.
- [x] Build regression/reference tests around all slab boundaries and tax components.
- [x] Add backend validation, database constraints and transaction safety.

## Integration gates
- [x] Shared schema contract verified
- [x] Shared API contract verified
- [x] Error states handled
- [x] Security checks passed
- [x] Tests pass
- [x] Production build passes
- [x] End-to-end flow passes
