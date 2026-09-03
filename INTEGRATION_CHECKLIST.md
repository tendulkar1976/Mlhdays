# INTEGRATION CHECKLIST — Member 2 (Gemini AI, RAG & Document Intelligence)

This checklist defines the cross-member contracts, required APIs, schema payloads, and database invariants required to transition Member 2 from local standalone operation to full 3-member production integration.

---

## 1. Member 1 (Core Tax, Backend & Database) APIs Required by Member 2

Member 2 requires Member 1 to expose and maintain the following authoritative backend APIs:

| Endpoint | Method | Purpose | Consuming Member 2 Component |
| :--- | :---: | :--- | :--- |
| `/api/v1/tax/calculate/stateless` | `POST` | Deterministic tax calculation without persistence | `calculate_tax` tool, `compare_regimes` tool |
| `/api/v1/tax/calculate/twin/{tax_twin_id}` | `POST` | Deterministic tax calculation based on twin's stored facts | `calculate_tax` tool |
| `/api/v1/tax/twin/{tax_twin_id}` | `GET` | Fetch immutable Tax Twin version snapshot | `get_tax_twin` tool, `reconciliation-assistant` |
| `/api/v1/tax/twin/{tax_twin_id}/facts` | `GET` | Fetch all financial facts bound to `tax_twin_id` | `get_facts` tool, `reconciliation-assistant` |
| `/api/v1/tax/profile/{profile_id}` | `GET` | Fetch taxpayer profile & preferences | `get_tax_profile` tool |
| `/api/v1/tax/twin/version` | `POST` | Create new immutable version ($v_{n+1}$) upon confirmed reconciliation | `reconciliation-assistant` |
| `/api/v1/audit/log` | `POST` | Persist AI trace & decision logs | `aiOrchestrator` trace persistence |

---

## 2. Exact Request Schemas Expected

### A. Stateless Tax Calculation Request (`POST /api/v1/tax/calculate/stateless`)
```json
{
  "regime": "NEW",
  "gross_salary": 1500000,
  "exemptions_sec_10": 0,
  "standard_deduction": 75000,
  "house_property_income_or_loss": 0,
  "other_income": 50000,
  "deductions_80c": 150000,
  "deductions_80d": 25000,
  "deductions_80ccd_1b": 50000,
  "deductions_80ccd_2": 0,
  "deductions_80tta": 10000,
  "other_chapter_via_deductions": 0,
  "tds_paid": 95000,
  "advance_tax_paid": 0,
  "age_category": "GENERAL"
}
```

### B. Twin Tax Calculation Request (`POST /api/v1/tax/calculate/twin/{tax_twin_id}`)
```json
{
  "override_regime": "NEW",
  "apply_marginal_relief": true
}
```

### C. Create New Tax Twin Version Request (`POST /api/v1/tax/twin/version`)
```json
{
  "parent_twin_id": "twin_prof_01_v1",
  "created_by": "SYSTEM_RECONCILIATION",
  "notes": "Reconciled with Form 16 confirmation",
  "facts": [
    {
      "category": "SALARY",
      "field_name": "gross_salary",
      "amount": 1600000,
      "verification_state": "VERIFIED",
      "source_document_id": "doc_f16_2025"
    },
    {
      "category": "DEDUCTION_80C",
      "field_name": "ppf_epf_elss",
      "amount": 150000,
      "verification_state": "VERIFIED",
      "source_document_id": "doc_f16_2025"
    }
  ]
}
```

---

## 3. Exact Response Schemas Expected from Member 1

### A. Tax Calculation Response (`POST /api/v1/tax/calculate/*`)
```json
{
  "calculation_id": "calc_1741070000000_abc",
  "tax_twin_id": "twin_prof_01_v1",
  "tax_period": {
    "financial_year": "2025-2026",
    "assessment_year": "2026-2027"
  },
  "regime": "NEW",
  "rule_version": "FY2025_26_AY2026_27",
  "gross_total_income": 1550000,
  "total_exemptions_deductions": 75000,
  "taxable_income": 1475000,
  "tax_before_rebate": 101250,
  "rebate_87a": 0,
  "tax_after_rebate": 101250,
  "surcharge": 0,
  "cess": 4050,
  "total_tax": 105300,
  "tds_and_advance_tax_credits": 95000,
  "net_tax_payable_or_refundable": 10300,
  "slab_breakdown": [
    {
      "slab_range": "₹0 to ₹4,00,000",
      "rate_percent": 0,
      "taxable_amount_in_slab": 400000,
      "tax_in_slab": 0
    },
    {
      "slab_range": "₹4,00,001 to ₹8,00,000",
      "rate_percent": 5,
      "taxable_amount_in_slab": 400000,
      "tax_in_slab": 20000
    },
    {
      "slab_range": "₹8,00,001 to ₹12,00,000",
      "rate_percent": 10,
      "taxable_amount_in_slab": 400000,
      "tax_in_slab": 40000
    },
    {
      "slab_range": "₹12,00,001 to ₹16,00,000",
      "rate_percent": 15,
      "taxable_amount_in_slab": 275000,
      "tax_in_slab": 41250
    }
  ],
  "assumptions": [
    "Calculated under Section 115BAC (New Tax Regime) for FY 2025-26 / AY 2026-27.",
    "Standard deduction of ₹75,000 applied for salaried taxpayers."
  ],
  "warnings": [],
  "calculation_trace": [
    { "step": "Gross Total Income", "description": "Salary + Other", "computed_value": 1550000 },
    { "step": "Standard Deduction", "description": "Section 16(ia)", "computed_value": 75000 },
    { "step": "Taxable Income", "description": "Gross - Deductions", "computed_value": 1475000 },
    { "step": "Total Tax Liability", "description": "Tax + Cess", "computed_value": 105300 }
  ]
}
```

---

## 4. Tax Twin Dependencies & Invariants

1. **Foreign Key Invariant:**
   * `facts.tax_twin_id` $\rightarrow$ `tax_twins.id` (MANDATORY)
   * `income_sources.tax_twin_id` $\rightarrow$ `tax_twins.id` (MANDATORY)
   * `transactions.tax_twin_id` $\rightarrow$ `tax_twins.id` (MANDATORY)
2. **Immutability:**
   * `tax_twins` rows must NEVER be updated or deleted once created.
   * Modifying facts creates `version = N + 1` with a new `tax_twin_id`.

---

## 5. Tax Calculation Dependencies
* Statutory rule baseline: **FY 2025-26 / AY 2026-27** (Finance Act 2025).
* Slabs: ₹0-4L Nil, ₹4-8L 5%, ₹8-12L 10%, ₹12-16L 15%, ₹16-20L 20%, ₹20-24L 25%, >₹24L 30%.
* Section 87A rebate: Up to ₹60,000 for taxable income $\le$ ₹12,00,000 in New Regime.
* Standard deduction: ₹75,000 (New Regime) / ₹50,000 (Old Regime).

---

## 6. Reconciliation Dependencies
* Member 1 must provide transactional creation of new twin versions upon reconciliation commit.
* Verification states must strictly adhere to: `VERIFIED`, `NEEDS_CONFIRMATION`, `CONFLICT`, `EXPERT_REVIEW`.

---

## 7. Authentication / Authorization Dependencies
* Member 1 / Member 3 must supply user identity in requests via headers:
  * `Authorization: Bearer <jwt>`
  * `x-user-id: <user_id>`
  * `x-tax-twin-id: <active_twin_id>` (optional fallback)

---

## 8. Member 3 (Frontend & UX) Integration Points

Member 3 consumes the following Member 2 endpoints:

1. **Copilot Chat Interface:**
   * `POST /api/v1/ai/chat` $\rightarrow$ Accepts `{ message: string, history?: [], tax_twin_id?: string }`
   * Displays AI explanation, tool call badges, citations, and disclaimer.
2. **Form 16 Upload & Document Review Screen:**
   * `POST /api/v1/ai/extract` $\rightarrow$ Accepts OCR JSON or raw text.
   * Displays field confidence badges (Green for `VERIFIED`, Yellow for `NEEDS_CONFIRMATION`, Red for `CONFLICT`/`EXPERT_REVIEW`).
3. **Reconciliation Modal / Diff Viewer:**
   * `POST /api/v1/ai/reconcile` $\rightarrow$ Compares extracted data with current Tax Twin facts.
   * Renders side-by-side comparison with action buttons: `[Accept Form 16 Value]` or `[Keep Current Value]`.
   * Sends confirmed decisions back with `action: "APPLY_CONFIRMATION"` to generate next twin version.
4. **Knowledge Search & Help Desk:**
   * `POST /api/v1/ai/knowledge` $\rightarrow$ Search tax laws with FY 2025-26 metadata.
5. **Statutory Deadlines Widget:**
   * `GET /api/v1/ai/deadlines` $\rightarrow$ Displays upcoming ITR & advance tax countdowns.

---

## 9. Environment Variables Required

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-side secret | Mandatory Google GenAI key for LLM & embeddings. |
| `GEMINI_MODEL` | Server-side config | `gemini-2.5-flash` |
| `GEMINI_EMBEDDING_MODEL` | Server-side config | `text-embedding-004` |
| `TAX_RULE_VERSION_DEFAULT` | Server-side config | `FY2025_26_AY2026_27` |
| `DATABASE_URL` | Server-side secret | PostgreSQL connection string with pgvector. |
| `PORT` | Server-side config | `3000` |
| `NODE_ENV` | Server-side config | `development` / `production` |

---

## 10. Shared Contract Mismatches

* **Current Status:** **ZERO MISMATCHES**.
* Member 2 types in [`src/types/shared.ts`](file:///c:/Users/tendu/OneDrive/Desktop/MLH/src/types/shared.ts) strictly reflect all entities in `SCHEMA.md` and `SHARED_CONTRACTS.md`.
