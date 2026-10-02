# AI-Powered Personal Tax Copilot (FY 2025-26 / AY 2026-27)

A unified 3-member architecture providing deterministic statutory calculations, immutable Tax Twin state snapshots, document intelligence, and interactive Next.js UX for Indian taxpayers.

---

## Service Architecture & Port Mapping

| Service | Directory | Owner | Port | Role |
| :--- | :--- | :---: | :---: | :--- |
| **`tax-engine`** | `src/` / `prisma/` | **Member 1** | `3000` | Authoritative Deterministic Tax Engine & Immutable Tax Twin State |
| **`ai-backend`** | `ai-backend/` | **Member 2** | `3002` | Gemini AI Orchestration, Document Intelligence (AIS/26AS), Citations |
| **`frontend`** | `frontend/` | **Member 3** | `3001` | Next.js User Interface, UX Orchestration (No client-side math) |
| **`postgres`** | `docker/` | Infrastructure | `5433` | PostgreSQL 16 Relational Database |

---

## Quick Start with Docker

Start all 3 services and the database with a single command:

```bash
docker compose up --build
```

### Access URLs:
* **Frontend UI (Member 3)**: [http://localhost:3001](http://localhost:3001)
* **Tax Engine Backend (Member 1)**: [http://localhost:3000](http://localhost:3000)
* **AI Backend & Document OCR (Member 2)**: [http://localhost:3002](http://localhost:3002)

---

## Database Seeding & Testing

```bash
# Seed demo taxpayer facts (Form 16 & AIS):
docker compose run --rm tax-engine npx tsx src/scripts/seed.ts

# Run all 16 regression tests:
docker compose run --rm tax-engine npm test
```

---

## Architectural Principles

1. **One Authoritative Tax Twin**: Member 1 owns Tax Twin persistence and versioning ($v_1 \rightarrow v_2 \rightarrow v_3$). Zero in-place mutations.
2. **Deterministic Arithmetic**: Gemini explains and orchestrates; Member 1 computes all numerical tax arithmetic.
3. **No Client-Side Math**: Member 3's frontend consumes authoritative backend API payloads exclusively.
4. **Security**: All API keys and database credentials remain strictly server-side.
