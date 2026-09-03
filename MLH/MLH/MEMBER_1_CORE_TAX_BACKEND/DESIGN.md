# DESIGN.md — Core Tax, Backend & Database

## Ownership
Own database, immutable Tax Twin versioning, deterministic tax engine, statutory rule versioning, calculation APIs, validation, auditability and automated tests.

## System boundary
Frontend → API → Tax Twin → Deterministic Tax Engine → Result
AI → Gemini → controlled tools → backend/tax engine → validated result → explanation

## Modules
- `apps/api/`
- `packages/tax-engine/`
- `packages/tax-rules/`
- `database/`

## Security
- Secrets are server-side.
- Gemini key is never exposed to the browser.
- Validate user/document inputs.
- Keep demo data separate from real sensitive taxpayer information.
