# DESIGN.md — Frontend, UX & Deployment

## Ownership
Own Next.js UI, design system, onboarding, dashboard, Tax Twin screens, regime comparison, AI chat UI, document/reconciliation UI, What-If Lab, Action Plan and production deployment.

## System boundary
Frontend → API → Tax Twin → Deterministic Tax Engine → Result
AI → Gemini → controlled tools → backend/tax engine → validated result → explanation

## Modules
- `apps/web/`
- `components/`
- `deployment/`

## Security
- Secrets are server-side.
- Gemini key is never exposed to the browser.
- Validate user/document inputs.
- Keep demo data separate from real sensitive taxpayer information.
