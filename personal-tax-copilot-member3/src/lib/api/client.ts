import { TaxCopilotApiClient } from "./types";
import { MockTaxCopilotApiClient } from "./mock";
import { LiveTaxCopilotApiClient } from "./live";

export const isMockEnabled: boolean =
  process.env.NEXT_PUBLIC_ENABLE_MOCKS === "true" ||
  process.env.NEXT_PUBLIC_ENABLE_MOCKS === undefined;

export const apiClient: TaxCopilotApiClient = isMockEnabled
  ? new MockTaxCopilotApiClient()
  : new LiveTaxCopilotApiClient();

export function getApiClient(): TaxCopilotApiClient {
  return apiClient;
}

export * from "./types";
export * from "./errors";