# Architecture & Tax Twin Versioning Specification

## 1. Core Architectural Principle

```text
MEMBER 1 = CALCULATE + OWN AUTHORITATIVE TAX STATE
MEMBER 2 = EXTRACT + EXPLAIN (GEMINI ORCHESTRATION)
MEMBER 3 = DISPLAY + ORCHESTRATE UX
GITHUB   = SINGLE SOURCE CODEBASE
```

---

## 2. Authoritative Tax Twin Versioning Lifecycle

To prevent state fragmentation and competing databases:
* **Member 1 (`tax-engine`) is the ONLY authority for Tax Twin state and versioning.**
* **Member 2 (`ai-backend`) NEVER maintains a separate Tax Twin database.**
* **Member 3 (`frontend`) NEVER fakes version numbers or calculates taxes in React.**

### Lifecycle Diagram:

```text
1. User Onboarding / Initial Form 16
   └─► Member 1 creates TaxTwin v1 (isActive: true, isLocked: false)

2. Member 2 extracts AIS (Discovers ₹12,000 vs ₹18,500 Interest Conflict)
   └─► Status: CONFLICT / NEEDS_CONFIRMATION

3. User confirms ₹18,500 in Frontend
   └─► Member 2 / Frontend calls Member 1 POST /api/v1/tax/twin/{v1_id}/version
   └─► Member 1 locks v1 (isLocked: true, isActive: false)
   └─► Member 1 creates TaxTwin v2 (parentTwinId: v1_id, versionNumber: 2, isActive: true)
   └─► Recalculates outputs deterministically

4. User runs What-If Simulation (₹50,000 NPS)
   └─► Baseline TaxTwin v2 evaluated in-memory
   └─► User clicks "Apply to Profile"
   └─► Member 1 locks v2 and creates TaxTwin v3 (versionNumber: 3)
```

---

## 3. Port & Service Configuration

```text
┌────────────────────────────────────────────────────────┐
│             DOCKER VIRTUAL NETWORK                     │
│                                                        │
│   ┌────────────────────────┐  HTTP   ┌──────────────┐  │
│   │   frontend (Port 3001) │ ◄─────► │  tax-engine  │  │
│   └───────────┬────────────┘         │  (Port 3000) │  │
│               │                      └──────┬───────┘  │
│               │ HTTP                        │ SQL      │
│               ▼                             ▼          │
│   ┌────────────────────────┐         ┌──────────────┐  │
│   │  ai-backend (Port 3002)│         │   postgres   │  │
│   │  (Gemini AI & OCR)     │         │ (Port 5432)  │  │
│   └────────────────────────┘         └──────────────┘  │
└────────────────────────────────────────────────────────┘
```

* **Frontend**: `http://localhost:3001`
* **Tax Engine**: `http://localhost:3000` (Docker internal: `http://tax-engine:3000`)
* **AI Backend**: `http://localhost:3002` (Docker internal: `http://ai-backend:3002`)
* **PostgreSQL**: Host: `localhost:5433` (Docker internal: `postgres:5432`)
