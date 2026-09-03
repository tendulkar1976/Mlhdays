# AI-Powered Personal Tax Copilot (Indian Taxpayers — FY 2025-26 / AY 2026-27)

A 3-member production-ready platform providing deterministic tax calculations, immutable Tax Twin tracking, and Gemini AI explanations for Indian individual taxpayers.

---

## 1. Repository Structure

```
personal-tax-copilot/
├── frontend/          # Member 3 — Next.js 14, Tailwind CSS, TypeScript (Port 3001)
├── tax-engine/        # Member 1 — FastAPI, Deterministic Rules & Tax Twin (Port 3000)
├── ai-backend/        # Member 2 — Gemini GenAI, OCR & Document Extraction (Port 3002)
├── docs/              # API Contracts (API_CONTRACT.md) & Architecture (ARCHITECTURE.md)
├── docker-compose.yml # Container orchestration across all 3 services
├── README.md          # Project guide
└── .gitignore         # Secret and artifact exclusion
```

---

## 2. Service Ownership & Architecture

| Service | Port | Owner | Responsibilities |
|---|---|---|---|
| **tax-engine** | `3000` | **Member 1** | Deterministic tax calculations, statutory slabs (0–4L to >24L), Sec 87A rebate, Tax Twin state & versioning, What-If simulation, readiness metrics, deadlines. |
| **ai-backend** | `3002` | **Member 2** | Gemini API orchestration, plain-English tax explanations, document OCR (Form 16/AIS), discrepancy detection, statutory citations. |
| **frontend** | `3001` | **Member 3** | Next.js App Router, design tokens, progressive onboarding, interactive reconciliation UI, What-If Lab, Action Plan, deployment, zero client-side math. |

---

## 3. Quick Start

### Running with Docker Compose
```bash
# Set your server-side Gemini API key
export GEMINI_API_KEY="your_api_key_here"

# Boot all services (PostgreSQL, tax-engine, ai-backend, frontend)
docker-compose up --build
```
- Access Frontend: `http://localhost:3001`
- Access Tax Engine API: `http://localhost:3000/api/v1`
- Access AI Backend: `http://localhost:3002/api/v1`

### Running the Frontend Standalone (Development / Demo Mode)
```bash
cd frontend

# Mock mode (independent offline demo):
NEXT_PUBLIC_ENABLE_MOCKS=true npm run dev

# Live backend integration mode:
NEXT_PUBLIC_ENABLE_MOCKS=false NEXT_PUBLIC_TAX_API_URL=http://localhost:3000 NEXT_PUBLIC_AI_API_URL=http://localhost:3002 npm run dev
```

---

## 4. End-to-End Verification Flow

1. **Landing & Authentication (`/login`, `/register`)**: Persona selection (Salaried, Freelancer, Investor, Student).
2. **Progressive Onboarding (`/onboarding`)**: Guided wizard creating initial baseline `Tax Twin v1`.
3. **Command Center Dashboard (`/dashboard`)**: Side-by-side New vs Old regime estimated tax liability, 83% readiness score, action plan tasks.
4. **Immutable Tax Twin Explorer (`/tax-twin`)**: Version timeline (`v1` $\rightarrow$ `v2` $\rightarrow$ `v3`), audit hash display, fact provenance modal.
5. **Regime Comparison (`/regime-comparison`)**: Side-by-side slabs breakdown, Section 87A rebate trace, deterministic calculation audit log.
6. **AI Copilot (`/copilot`)**: Conversational guidance with controlled tool execution and legal citations.
7. **Document Intelligence & Reconciliation (`/documents`)**: Form 16 & AIS upload, discrepancy discovery (₹12,000 vs ₹18,500 interest), user acceptance, spawning `Tax Twin v3`.
8. **What-If Scenario Lab (`/what-if`)**: Sandbox simulation (e.g. ₹50,000 NPS contribution) saving ₹15,600 under the Old Regime, with optional commit spawning `Tax Twin v4`.
9. **Action Plan & Readiness (`/action-plan`)**: Statutory milestones checklist, official tax compliance calendar, and print-ready audit package.