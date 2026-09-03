# TRD.md — Frontend, UX & Deployment

## Stack
Next.js + TypeScript; Node.js server-side APIs; PostgreSQL; Prisma/Drizzle; Gemini API/Google GenAI SDK; GitHub; managed deployment.

## Calculation APIs
POST /api/v1/tax/calculate/stateless
POST /api/v1/tax/calculate/twin/{tax_twin_id}

## Gemini requirement
Gemini API is mandatory. Use the Google GenAI SDK/server-side Gemini API. Store the credential as GEMINI_API_KEY in the platform's secure secret manager/environment. Never expose it in browser code, never use NEXT_PUBLIC_GEMINI_API_KEY, never hard-code it, and never commit it to Git. Gemini may understand, explain, retrieve, extract and orchestrate tools; the deterministic tax engine must remain authoritative for numerical tax calculations.

## Implementation
- [ ] Build Next.js TypeScript app and reusable design system.
- [ ] Build landing, authentication and progressive onboarding.
- [ ] Build Dashboard with estimated tax, readiness, issues and next actions.
- [ ] Build Tax Twin interface with source and verification states.
- [ ] Build regime comparison and calculation trace UI.
- [ ] Build action-oriented AI Copilot UI.
- [ ] Build document upload, extraction review and reconciliation screens.
- [ ] Build isolated What-If Lab with Apply/Discard.
- [ ] Build Action Plan and filing-readiness UI.
- [ ] Consume shared API contracts; never duplicate tax arithmetic in the browser.
- [ ] Deploy the application, configure secrets, HTTPS, logs, health checks and production environment.

## Shared calculation response
calculation_id, tax_twin_id, tax_period, rule_version, taxable_income, tax_before_rebate, rebate, surcharge, cess, total_tax, assumptions, warnings, calculation_trace.
