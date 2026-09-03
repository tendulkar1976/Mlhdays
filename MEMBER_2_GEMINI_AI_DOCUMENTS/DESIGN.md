# DESIGN.md — Gemini AI, RAG & Document Intelligence

## Ownership
Own Gemini integration, AI orchestration, tool calling, authoritative tax knowledge retrieval, document extraction, confidence, reconciliation assistance, AI safety and AI observability.

## System boundary
Frontend → API → Tax Twin → Deterministic Tax Engine → Result
AI → Gemini → controlled tools → backend/tax engine → validated result → explanation

## Modules
- `packages/ai/`
- `packages/rag/`
- `document-processing/`

## Security
- Secrets are server-side.
- Gemini key is never exposed to the browser.
- Validate user/document inputs.
- Keep demo data separate from real sensitive taxpayer information.
