# 🇮🇳 AI Personal Tax Copilot & Immutable Tax Twin
### *Deterministic Personal Tax Guidance & Financial History for Indian Taxpayers*

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_%26_2.0_Flash-8E75B2?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Finance Act 2025](https://img.shields.io/badge/Statutory_Baseline-FY_2025--26_/_AY_2026--27-emerald?style=for-the-badge)](https://incometaxindia.gov.in/)
[![Vercel Deployed](https://img.shields.io/badge/Live_Deployment-Vercel-success?style=for-the-badge&logo=vercel)](https://mlhdays.vercel.app)
[![Tests Passing](https://img.shields.io/badge/Test_Suite-50%2F50_Passed-brightgreen?style=for-the-badge&logo=vitest)](https://github.com/tendulkar1976/Mlhdays)

---

## 🌐 Live Web Application & Quick Links

* 🚀 **Production URL:** [https://mlhdays.vercel.app](https://mlhdays.vercel.app)
* 🐙 **GitHub Repository:** [https://github.com/tendulkar1976/Mlhdays.git](https://github.com/tendulkar1976/Mlhdays.git)
* 🔐 **1-Click Staging Profiles on Login:** [https://mlhdays.vercel.app/login](https://mlhdays.vercel.app/login)

---

## 📌 Problem Statement & Vision

Indian personal taxation for **FY 2025-26 / AY 2026-27** presents immense friction for individual taxpayers:
1. **Regime Confusion:** Complex mathematical trade-offs between the **New Tax Regime (Section 115BAC)** and the **Old Tax Regime**.
2. **Document Mismatches:** Unreconciled discrepancies across Form 16, AIS/TIS, and Form 26AS leading to automated **Section 139(9)** defective return notices.
3. **Destructive State Overwrites:** Traditional tax portals lack historical versioning, making What-If scenario modeling risky and non-auditable.
4. **AI Hallucinations:** Generative AI models struggle with precise arithmetic calculations and invent arbitrary deductions.

### 💡 The Solution: TaxCopilot Core Invariants
* **Zero Mental Math Policy:** Gemini AI orchestrates and explains; **100% of mathematical calculations are computed deterministically** by an authoritative engine.
* **Cryptographic Tax Twin:** Financial facts are sealed into immutable, versioned snapshots (`v1` $\rightarrow$ `v2` $\rightarrow$ `v3`) with SHA-256 lineage tracking.
* **Statutory Grounding:** Every recommendation is backed by specific legal provisions under the **Income Tax Act, 1961** and **Finance Act 2025**.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               MEMBER 3: FRONTEND                                │
│                     Next.js 14 • React 18 • Tailwind CSS                        │
│                   Production: https://mlhdays.vercel.app                        │
│                                                                                 │
│   [ 1-Click Onboarding ] ──▶ [ Tax Twin Lineage ] ──▶ [ Live Dashboard ]        │
│   [ AI Copilot Chat ]    ──▶ [ What-If Sandbox ]  ──▶ [ AIS Reconciliation ]    │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ Typed REST APIs
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     MEMBER 2: AI ORCHESTRATION & RECONCILIATION                 │
│              Node.js • Google Gemini SDK • Semantic Knowledge Engine            │
│                              Port 3002 / Edge API                               │
│                                                                                 │
│   • Controlled Tool Calling: calculate_tax, compare_regimes, create_scenario    │
│   • Form 16 / AIS Document OCR & 4-State Confidence Matrix                      │
│   • Multi-Domain Semantic Tax Knowledge Base (30+ Tax Scenarios)                │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ Authoritative Bridge
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       MEMBER 1: CORE DETERMINISTIC TAX ENGINE                   │
│                         Prisma ORM • PostgreSQL • FastAPI                      │
│                                     Port 3000                                   │
│                                                                                 │
│   • Finance Act 2025 Progressive Slabs (0-4L Nil, 4-8L 5%, 8-12L 10%...)        │
│   • Section 87A Full Rebate up to ₹12 Lakhs (Zero tax up to ₹12.75L salary)     │
│   • Cryptographic SHA-256 State Persistence & Mathematical Calculation Traces   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Capabilities

### 1. ⚡ 1-Click Judge Quick-Demo Onboarding
* **Pre-Loaded Personas:** Select from *Salaried Tech Lead (₹14.5L)*, *Freelance Consultant (₹18.2L / Sec 44ADA)*, or *Senior Citizen (₹9.5L)* with zero manual typing required.
* **Live Split-View Calculation:** Real-time side-by-side computation of Old vs New regime tax as inputs change.
* **Cryptographic Synthesis Animation:** Visual generation of the SHA-256 hash for **Tax Twin v1**.

### 2. 🤖 Grounded AI Tax Copilot
* Ask any open-ended question: *"Can I claim HRA if I pay rent to parents?"*, *"What is capital gains tax on equity mutual funds?"*, or *"Which regime is better for 15 Lakhs salary?"*.
* **Controlled Tool Execution:** Gemini triggers authoritative backend tools and displays live tool execution badges.
* **Statutory Citations:** Answers cite specific sections (e.g. *Section 115BAC*, *Section 10(13A)*, *Section 112A*, *Section 80D*).

### 3. 📑 Document Intelligence & AIS Reconciliation
* Drag-and-drop parser for Form 16, AIS/TIS, and Form 26AS.
* **4-State Confidence Matrix:** `VERIFIED`, `NEEDS_CONFIRMATION`, `CONFLICT`, `FLAGGED`.
* **Conflict Resolution:** Detects ₹6,500 savings interest discrepancy between self-declared income (₹12,000) and AIS (₹18,500). Confirming the reconciliation spawns **Tax Twin v2** without overwriting historical facts.

### 4. 🧪 What-If Optimization Lab
* Non-destructive sandbox to model voluntary NPS contributions (**Section 80CCD 1B**), health insurance (**Section 80D**), and home loans (**Section 24b**).
* Calculates exact marginal tax deltas before committing changes.

### 5. 📋 Pre-Flight Filing Readiness & Action Plan
* **Filing Readiness Score (83%):** Interactive pre-flight checklist verifying TDS credits, Section 80D cashless receipts, and regime elections.
* **Statutory Deadlines Calendar:** Tracks Section 139(1) deadlines and Section 234F late fee warnings.

---

## 📊 Statutory Tax Baseline (Finance Act 2025 / AY 2026-27)

### New Tax Regime (Section 115BAC — Default)
| Taxable Income Slab | Statutory Tax Rate | Notes |
| :--- | :---: | :--- |
| **₹0 – ₹4,00,000** | **0% (Nil)** | Baseline exemption limit |
| **₹4,00,001 – ₹8,00,000** | **5%** | ₹20,000 on slab |
| **₹8,00,001 – ₹12,00,000** | **10%** | **Full Sec 87A Rebate** (Net Tax = ₹0 up to ₹12L) |
| **₹12,00,001 – ₹16,00,000** | **15%** | ₹60,000 on slab |
| **₹16,00,001 – ₹20,00,000** | **20%** | ₹80,000 on slab |
| **₹20,00,001 – ₹24,00,000** | **25%** | ₹1,00,000 on slab |
| **Above ₹24,00,000** | **30%** | Maximum marginal rate |
| **Standard Deduction (Sec 16(ia))** | **₹75,000** | Salaried employees & pensioners |
| **Health & Education Cess** | **4%** | Applied on tax after rebate |

---

## 🛠️ Local Installation & Development

### Prerequisites
* **Node.js:** `>= 18.x` or `20.x`
* **npm:** `>= 9.x`

### 1. Clone the Repository
```bash
git clone https://github.com/tendulkar1976/Mlhdays.git
cd Mlhdays
```

### 2. Install Dependencies
```bash
# Root & Backend dependencies
npm install

# Frontend dependencies
cd personal-tax-copilot-member3
npm install
cd ..
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3002
MEMBER1_TAX_ENGINE_URL=http://localhost:3000
MEMBER3_FRONTEND_URL=http://localhost:3001
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Full Suite
```bash
# Start Frontend UI (Port 3001)
cd personal-tax-copilot-member3
npm run dev

# Start AI Orchestrator & Backend (Port 3002)
npm start
```

---

## 🧪 Test Suite & Verification

All 50 unit and integration tests across 10 test suites pass cleanly:

```bash
npx vitest run
```

```
 ✓ tests/deterministic-tax-engine.test.ts (4 tests)
 ✓ tests/form16-extraction-confidence.test.ts (3 tests)
 ✓ MLH/MLH/tests/tax-twin.test.ts (2 tests)
 ✓ tests/rag-retriever.test.ts (3 tests)
 ✓ MLH/MLH/tests/api-stateless.test.ts (4 tests)
 ✓ MLH/MLH/tests/tax-engine.test.ts (10 tests)
 ✓ tests/reconciliation-assistant.test.ts (3 tests)
 ✓ tests/controlled-tools.test.ts (9 tests)
 ✓ tests/server-api.test.ts (8 tests)
 ✓ tests/ai-orchestrator-resilience.test.ts (4 tests)

 Test Files  10 passed (10)
      Tests  50 passed (50)
   Duration  4.21s
```

---

## 👥 Team Division of Responsibilities (4-Member Team)

* **Member 1 — Core Tax Engine & Database Architecture:**  
  Authoritative deterministic calculation logic for Finance Act 2025 slabs, Section 87A rebate math, statutory calculation traces, PostgreSQL database design, and Prisma schemas.

* **Member 2 — AI Orchestration & Gemini Tool-Calling:**  
  Google Gemini LLM pipeline, zero-hallucination guardrails, controlled tool execution (`compare_regimes`, `calculate_tax`, `create_scenario`), and multi-domain semantic tax reasoning engine.

* **Member 3 — Frontend Engineering & Cloud Deployment:**  
  Next.js 14 web application architecture, responsive design system, real-time split-view onboarding, interactive Tax Twin lineage timeline, What-If simulation lab, and Vercel cloud CI/CD deployment.

* **Member 4 — Document Intelligence & Reconciliation Engine:**  
  Form 16 / AIS / 26AS OCR extraction pipeline, 4-state confidence evaluation matrix (`VERIFIED`, `CONFLICT`, `NEEDS_CONFIRMATION`), automated notice prevention algorithms (Section 139(9) & 143(1)), and statutory pre-flight compliance workflows.

---

## 📄 License & Disclaimer

This project is built for evaluation and demonstration purposes during the MLH Hackathon. Tax calculations adhere to statutory provisions of the **Finance Act 2025**. Always consult a certified Chartered Accountant (CA) before final return submission under Section 139(1).
