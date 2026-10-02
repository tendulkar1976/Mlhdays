# Unified API Contract — AI Personal Tax Copilot

This document specifies the authoritative contracts for all inter-service and frontend-backend communications.

---

## Service Map & Ports

| Service | Owner | Port | Base URL | Role |
| :--- | :---: | :---: | :--- | :--- |
| **`tax-engine`** | **Member 1** | `3000` | `http://localhost:3000` (`http://tax-engine:3000` in Docker) | Deterministic Tax Arithmetic, Immutable Tax Twin State, Deadlines, Readiness |
| **`frontend`** | **Member 3** | `3001` | `http://localhost:3001` | Next.js User Interface, UX Orchestration (No client-side math) |
| **`ai-backend`** | **Member 2** | `3002` | `http://localhost:3002` (`http://ai-backend:3002` in Docker) | Gemini AI Orchestration, Document OCR, AIS/Form 16 Reconciliation |

---

## 1. Member 1 (`tax-engine`) Endpoints

### 1.1 `POST /api/v1/tax/calculate/stateless`
Calculates progressive income tax under New and Old regimes deterministically with full trace.

* **Request**:
```json
{
  "financialYear": "2025-2026",
  "assessmentYear": "2026-2027",
  "regimePreference": "COMPARE",
  "incomeSources": [
    {
      "category": "SALARY",
      "grossAmount": 1500000,
      "employerOrPayer": "Infosys Ltd"
    }
  ],
  "deductions": {
    "section80C": 150000,
    "section80D": 25000,
    "section80CCD1B": 50000
  },
  "age": 30,
  "isResident": true
}
```

* **Response (`200 OK`)**:
```json
{
  "calculationId": "uuid-string",
  "taxTwinId": null,
  "taxPeriod": { "financialYear": "2025-2026", "assessmentYear": "2026-2027" },
  "ruleVersion": "IN-ITD-FY2025-26-v1.0",
  "activeRegime": "NEW",
  "result": {
    "regime": "NEW",
    "grossTotalIncome": 1500000,
    "standardDeduction": 75000,
    "totalExemptionsAndDeductions": 75000,
    "netTaxableIncome": 1425000,
    "taxOnSlabs": 93750,
    "rebate87A": 0,
    "surcharge": 0,
    "cess": 3750,
    "totalTaxLiability": 97500,
    "calculationTrace": [ ... ]
  },
  "comparison": {
    "recommendedRegime": "NEW",
    "taxDifference": 97500,
    "summary": "New Tax Regime saves ₹97,500 in total tax liability.",
    "newRegime": { ... },
    "oldRegime": { ... }
  }
}
```

---

### 1.2 `POST /api/v1/tax/twin`
Initializes Tax Twin ($v_1$).

* **Request**:
```json
{
  "taxProfileId": "uuid-string",
  "taxPeriodId": "uuid-string",
  "changeSummary": "Initial baseline from onboarding",
  "incomeSources": [
    { "category": "SALARY", "grossAmount": 1475000, "verificationState": "VERIFIED" }
  ],
  "facts": [
    { "factKey": "deduction_80c", "category": "CHAPTER_VI_A", "factValue": { "amount": 150000 } }
  ]
}
```
* **Response (`201 Created`)**:
```json
{
  "message": "Tax Twin v1 created successfully",
  "twinId": "b2b18984-a7fa-48e6-8f33-d0a3ee70956c",
  "twin": { "versionNumber": 1, "isActive": true, "isLocked": false, ... }
}
```

---

### 1.3 `POST /api/v1/tax/twin/{tax_twin_id}/version`
Forks a new version ($v_{n+1}$) upon reconciliation or fact update. Historical twin is locked.

* **Request**:
```json
{
  "changeSummary": "Reconciled ₹18,500 savings interest from AIS",
  "addedIncomeSources": [
    {
      "category": "OTHER_SOURCES",
      "employerOrPayer": "HDFC Bank (Savings Interest)",
      "grossAmount": 18500,
      "verificationState": "VERIFIED"
    }
  ],
  "removedIncomeSourceIds": [ "old-source-id" ]
}
```

* **Response (`201 Created`)**:
```json
{
  "message": "Tax Twin v2 created successfully",
  "twinId": "new-version-uuid",
  "twin": { "versionNumber": 2, "parentTwinId": "b2b18984-a7fa-48e6-8f33-d0a3ee70956c", "isActive": true }
}
```

---

### 1.4 `POST /api/v1/tax/twin/{tax_twin_id}/scenario`
Runs What-If scenario (e.g. ₹50k NPS investment or salary hike).

* **Request**:
```json
{
  "name": "What-If ₹50k NPS Tier 1 Investment",
  "additionalNPS": 50000,
  "applyToNewVersion": false
}
```

* **Response (`200 OK`)**:
```json
{
  "scenarioId": "uuid-string",
  "name": "What-If ₹50k NPS Tier 1 Investment",
  "baselineTwinId": "b2b18984-a7fa-48e6-8f33-d0a3ee70956c",
  "baselineTax": 97500,
  "simulatedTax": 87100,
  "taxDelta": 10400,
  "savings": 10400,
  "recommendedRegime": "NEW",
  "summary": "Investing ₹50,000 in NPS saves ₹10,400 in tax.",
  "simulatedResult": { ... }
}
```

---

### 1.5 `GET /api/v1/tax/twin/{tax_twin_id}/readiness`
Filing readiness score, document completeness, and action plan.

* **Response (`200 OK`)**:
```json
{
  "taxTwinId": "b2b18984-a7fa-48e6-8f33-d0a3ee70956c",
  "versionNumber": 1,
  "readinessScore": 85,
  "isReadyToDraft": true,
  "completedItems": [ ... ],
  "pendingItems": [ ... ],
  "needsReviewItems": [ ... ],
  "blockerItems": [ ... ]
}
```

---

### 1.6 `GET /api/v1/tax/deadlines`
Statutory compliance calendar for FY 2025-26 (AY 2026-27).

---

## 2. Member 2 (`ai-backend`) Endpoints

### 2.1 `POST /api/v1/ai/extract`
Extracts structured facts from Form 16, AIS, or Bank Statement PDFs.

* **Request**: `multipart/form-data` with `file` and `documentType` (`FORM_16` | `AIS_TIS` | `BANK_STATEMENT`).
* **Response (`200 OK`)**:
```json
{
  "documentId": "doc-uuid",
  "documentType": "AIS_TIS",
  "confidenceScore": 0.98,
  "extractedFacts": {
    "savingsInterest": 18500,
    "salaryGross": 1475000,
    "tdsDeducted": 85000
  },
  "conflictsDetected": [
    {
      "factKey": "savings_interest",
      "userDeclared": 12000,
      "aisExtracted": 18500,
      "status": "CONFLICT",
      "message": "AIS reports ₹18,500 interest from HDFC Bank, but current Tax Twin lists ₹12,000. Reconciliation required."
    }
  ]
}
```

### 2.2 `POST /api/v1/ai/reconcile`
Applies reconciliation decision and triggers Member 1 Tax Twin version increment ($v_{n+1}$).

* **Request**:
```json
{
  "taxTwinId": "b2b18984-a7fa-48e6-8f33-d0a3ee70956c",
  "factKey": "savings_interest",
  "acceptedValue": 18500,
  "reason": "Accepted AIS official bank report"
}
```
* **Action**: Calls Member 1 `POST /api/v1/tax/twin/{id}/version` and returns newly created twin $v_2$.

### 2.3 `POST /api/v1/ai/explain`
Natural language Gemini explanation with authoritative tool citation.

* **Request**: `{ "prompt": "Why is New Regime better for me?" }`
* **Response**: `{ "reply": "Under FY 2025-26...", "citations": [...] }`
