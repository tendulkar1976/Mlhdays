import { TaxCopilotApiClient, OnboardingPayload, TaxDeadlineItem } from "./types";
import { ApiError } from "./errors";
import { TaxProfile, TaxTwin, FinancialFact } from "@/types/schema";
import {
  RegimeComparisonResult,
  WhatIfScenarioInput,
  WhatIfScenarioResult,
  DocumentUploadResponse,
  ReconciliationRecord,
  ActionPlanItem,
  AIChatMessage,
} from "@/types/tax";

export class LiveTaxCopilotApiClient implements TaxCopilotApiClient {
  private taxApiUrl: string;
  private aiApiUrl: string;
  private timeoutMs: number;

  constructor(taxApiUrl?: string, aiApiUrl?: string, timeoutMs: number = 15000) {
    const rawTaxUrl =
      taxApiUrl ||
      process.env.NEXT_PUBLIC_TAX_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3000";
    const cleanTax = rawTaxUrl.replace(/\/$/, "");
    this.taxApiUrl = cleanTax.endsWith("/api/v1") ? cleanTax : `${cleanTax}/api/v1`;

    const rawAiUrl =
      aiApiUrl ||
      process.env.NEXT_PUBLIC_AI_API_URL ||
      "http://localhost:3002";
    const cleanAi = rawAiUrl.replace(/\/$/, "");
    this.aiApiUrl = cleanAi.endsWith("/api/v1") ? cleanAi : `${cleanAi}/api/v1`;

    this.timeoutMs = timeoutMs;
  }

  private async request<T>(baseUrl: string, endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw ApiError.timeout();
      }
      throw ApiError.networkFailure(err);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let rawText = "";
      try {
        rawText = await response.text();
      } catch {
        // Ignore parsing failure
      }
      throw ApiError.fromStatus(response.status, rawText);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw ApiError.malformedResponse();
    }
  }

  // ============================================================================
  // MEMBER 1: DETERMINISTIC TAX ENGINE & TAX TWIN PERSISTENCE (localhost:3000)
  // ============================================================================

  async getTaxProfile(): Promise<TaxProfile> {
    return this.request<TaxProfile>(this.taxApiUrl, "/profile");
  }

  async getTaxTwins(): Promise<TaxTwin[]> {
    try {
      const active = await this.request<TaxTwin>(this.taxApiUrl, "/tax/twin/active");
      return [active];
    } catch {
      return [
        {
          id: "twin_v1",
          tax_profile_id: "prof_in_001",
          version: 1,
          is_active_baseline: true,
          created_at: new Date().toISOString(),
          notes: "Active Baseline",
        },
      ];
    }
  }

  async initializeTaxTwin(payload: OnboardingPayload): Promise<{ twin: TaxTwin; facts: FinancialFact[] }> {
    return this.request<{ twin: TaxTwin; facts: FinancialFact[] }>(this.taxApiUrl, "/tax/twin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getTaxTwin(id: string): Promise<{ twin: TaxTwin; facts: FinancialFact[] }> {
    return this.request<{ twin: TaxTwin; facts: FinancialFact[] }>(this.taxApiUrl, `/tax/twin/${id}`);
  }

  async calculateStateless(facts: Partial<FinancialFact>[]): Promise<RegimeComparisonResult> {
    return this.request<RegimeComparisonResult>(this.taxApiUrl, "/tax/calculate/stateless", {
      method: "POST",
      body: JSON.stringify({ facts }),
    });
  }

  async calculateTwin(twinId: string): Promise<RegimeComparisonResult> {
    return this.request<RegimeComparisonResult>(this.taxApiUrl, `/tax/calculate/twin/${twinId}`, {
      method: "POST",
    });
  }

  async compareRegimes(twinId: string): Promise<RegimeComparisonResult> {
    return this.request<RegimeComparisonResult>(this.taxApiUrl, `/tax/calculate/twin/${twinId}`, {
      method: "POST",
    });
  }

  async getDeadlines(): Promise<TaxDeadlineItem[]> {
    return this.request<TaxDeadlineItem[]>(this.taxApiUrl, "/tax/deadlines");
  }

  async getActionPlan(): Promise<ActionPlanItem[]> {
    try {
      return await this.request<ActionPlanItem[]>(this.taxApiUrl, "/tax/twin/active/readiness");
    } catch {
      return [
        {
          id: "act_01",
          title: "File ITR-1 / ITR-2 Before Statutory Deadline",
          description: "Statutory deadline for individual taxpayers for AY 2026-27 is July 31, 2026.",
          category: "FILING",
          status: "PENDING",
          deadline: "2026-07-31",
          statutory_reference: "Sec 139(1)",
        },
      ];
    }
  }

  async getWhatIfScenarios(twinId: string): Promise<WhatIfScenarioResult[]> {
    return this.request<WhatIfScenarioResult[]>(this.taxApiUrl, `/tax/twin/${twinId}/scenarios`);
  }

  async runWhatIfSimulation(input: WhatIfScenarioInput): Promise<WhatIfScenarioResult> {
    return this.request<WhatIfScenarioResult>(this.taxApiUrl, `/tax/twin/${input.baseline_twin_id}/scenario`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async applyWhatIfScenario(scenarioId: string): Promise<{ new_twin: TaxTwin; message: string }> {
    return this.request<{ new_twin: TaxTwin; message: string }>(this.taxApiUrl, `/tax/twin/${scenarioId}/version`, {
      method: "POST",
    });
  }

  async confirmReconciliation(updates: { fact_id: string; confirmed_value: number }[]): Promise<{ new_twin: TaxTwin; message: string }> {
    return this.request<{ new_twin: TaxTwin; message: string }>(this.taxApiUrl, "/tax/twin/active/version", {
      method: "POST",
      body: JSON.stringify({ updates }),
    });
  }

  // ============================================================================
  // MEMBER 2: GEMINI AI COPILOT & DOCUMENT INTELLIGENCE (localhost:3002)
  // ============================================================================

  async getDocuments(): Promise<DocumentUploadResponse[]> {
    return this.request<DocumentUploadResponse[]>(this.aiApiUrl, "/documents");
  }

  async uploadDocument(formData: FormData): Promise<DocumentUploadResponse> {
    const url = `${this.aiApiUrl}/documents/upload`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw ApiError.timeout();
      }
      throw ApiError.networkFailure(err);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw ApiError.fromStatus(response.status);
    }

    try {
      return (await response.json()) as DocumentUploadResponse;
    } catch {
      throw ApiError.malformedResponse();
    }
  }

  async getReconciliationRecords(twinId: string): Promise<ReconciliationRecord[]> {
    return this.request<ReconciliationRecord[]>(this.aiApiUrl, `/reconciliation?twin_id=${twinId}`);
  }

  async sendAIChat(messages: { role: "user" | "assistant"; content: string }[]): Promise<AIChatMessage> {
    return this.request<AIChatMessage>(this.aiApiUrl, "/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
  }

  async getHealth(): Promise<{ status: string; rule_version: string; timestamp: string }> {
    return this.request<{ status: string; rule_version: string; timestamp: string }>(this.taxApiUrl, "/health");
  }
}

export * from "./errors";