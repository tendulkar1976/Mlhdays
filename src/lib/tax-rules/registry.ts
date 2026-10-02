import { StatutoryRuleSet } from './types';
import { RULES_FY_2025_26 } from './fy2025_26';

const rulesRegistry: Map<string, StatutoryRuleSet> = new Map([
  ['2025-2026', RULES_FY_2025_26],
  ['2025-26', RULES_FY_2025_26],
  ['IN-ITD-FY2025-26-v1.0', RULES_FY_2025_26],
]);

/**
 * Retrieves the statutory rule set for a given financial year or rule version string.
 * Defaults to FY 2025-26 baseline.
 */
export function getStatutoryRules(identifier: string = '2025-2026'): StatutoryRuleSet {
  const normalized = identifier.trim();
  const rules = rulesRegistry.get(normalized);
  if (rules) {
    return rules;
  }
  // Fallback to latest verified statutory baseline
  return RULES_FY_2025_26;
}

export * from './types';
export * from './fy2025_26';
