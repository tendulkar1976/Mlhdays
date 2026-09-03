# RULES.md — Frontend, UX & Deployment

## Rule authority
Deterministic, versioned rules are authoritative for tax arithmetic. Gemini can retrieve and explain rules.

## Target
FY 2025-26 / AY 2026-27.

## Baseline
Initial statutory baseline: FY 2025-26 / AY 2026-27. The Income Tax Department currently lists the new-regime slabs for individuals as ₹0–4L Nil; ₹4–8L 5%; ₹8–12L 10%; ₹12–16L 15%; ₹16–20L 20%; ₹20–24L 25%; above ₹24L 30%. It also states that eligible resident individuals can receive a Section 87A rebate up to ₹60,000 where total income does not exceed ₹12L from AY 2026-27. Treat this as a versioned rule baseline and verify against official statutory material before production.

## Requirements
- Store FY, AY, effective date and rule version.
- Add regression tests.
- Never silently replace a historical rule version.
- Before production, verify the implementation against official Income Tax Department/statutory material.
