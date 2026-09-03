# SCHEMA.md — Shared Contract

## Core entities
users, tax_profiles, tax_periods, tax_twins, facts, income_sources, transactions, documents, extractions, sources, tax_calculations, scenarios, reconciliation_records, recommendations, action_items, decision_logs, audit_logs.

## Critical invariant
facts.tax_twin_id → tax_twins.id
income_sources.tax_twin_id → tax_twins.id
transactions.tax_twin_id → tax_twins.id

## Verification
VERIFIED | NEEDS_CONFIRMATION | CONFLICT | EXPERT_REVIEW

## Tax Twin
Immutable versioned snapshot of taxpayer state. Updates create a new version.
