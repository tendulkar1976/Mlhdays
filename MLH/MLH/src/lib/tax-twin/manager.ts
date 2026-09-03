import { PrismaClient } from '@prisma/client';
import {
  TaxRegime,
  VerificationState,
  IncomeCategory,
  IncomeSourceInput,
  DeductionsInput,
  CalculationResponse,
} from '../types';
import { calculateRegimeTax } from '../tax-engine/calculator';
import { compareTaxRegimes } from '../tax-engine/comparator';
import { getStatutoryRules } from '../tax-rules/registry';

export interface CreateTwinOptions {
  taxProfileId: string;
  taxPeriodId: string;
  incomeSources?: {
    category: IncomeCategory;
    employerOrPayer?: string;
    tanNumber?: string;
    grossAmount: number;
    taxDeductedAtSource?: number;
    verificationState?: VerificationState;
    metadata?: any;
  }[];
  facts?: {
    factKey: string;
    category: string;
    factValue: any;
    verificationState?: VerificationState;
  }[];
  transactions?: {
    transactionDate: Date;
    description: string;
    amount: number;
    taxCategory?: string;
    verificationState?: VerificationState;
  }[];
  changeSummary?: string;
}

export interface TwinSnapshot {
  twinId: string;
  taxProfileId: string;
  taxPeriodId: string;
  versionNumber: number;
  parentTwinId: string | null;
  isActive: boolean;
  isLocked: boolean;
  incomeSources: any[];
  facts: any[];
  transactions: any[];
  createdAt: Date;
}

/**
 * Tax Twin Lifecycle & Immutability Manager.
 * Enforces historical immutability: Updates ALWAYS fork a new version (v1 -> v2 -> v3).
 */
export class TaxTwinManager {
  private db: PrismaClient;

  constructor(dbClient: PrismaClient) {
    this.db = dbClient;
  }

  /**
   * Creates Initial Tax Twin (Version 1).
   */
  async createInitialTwin(options: CreateTwinOptions): Promise<string> {
    return await this.db.$transaction(async (tx) => {
      // Create version 1
      const twin = await tx.taxTwin.create({
        data: {
          taxProfileId: options.taxProfileId,
          taxPeriodId: options.taxPeriodId,
          versionNumber: 1,
          parentTwinId: null,
          isActive: true,
          isLocked: false,
          changeSummary: options.changeSummary || 'Initial Tax Twin baseline created',
        },
      });

      // Insert income sources referencing tax_twin_id
      if (options.incomeSources && options.incomeSources.length > 0) {
        await tx.incomeSource.createMany({
          data: options.incomeSources.map((inc) => ({
            taxTwinId: twin.id,
            category: inc.category,
            employerOrPayer: inc.employerOrPayer,
            tanNumber: inc.tanNumber,
            grossAmount: inc.grossAmount,
            taxDeductedAtSource: inc.taxDeductedAtSource || 0,
            verificationState: inc.verificationState || VerificationState.NEEDS_CONFIRMATION,
            metadata: inc.metadata || undefined,
          })),
        });
      }

      // Insert facts referencing tax_twin_id
      if (options.facts && options.facts.length > 0) {
        await tx.fact.createMany({
          data: options.facts.map((f) => ({
            taxTwinId: twin.id,
            factKey: f.factKey,
            category: f.category,
            factValue: f.factValue,
            verificationState: f.verificationState || VerificationState.NEEDS_CONFIRMATION,
          })),
        });
      }

      // Insert transactions referencing tax_twin_id
      if (options.transactions && options.transactions.length > 0) {
        await tx.transaction.createMany({
          data: options.transactions.map((t) => ({
            taxTwinId: twin.id,
            transactionDate: t.transactionDate,
            description: t.description,
            amount: t.amount,
            taxCategory: t.taxCategory,
            verificationState: t.verificationState || VerificationState.NEEDS_CONFIRMATION,
          })),
        });
      }

      return twin.id;
    });
  }

  /**
   * Forks a New Tax Twin Version from an existing parent twin.
   * Preserves historical immutability.
   */
  async forkNewTwinVersion(
    parentTwinId: string,
    changes: {
      addedIncomeSources?: any[];
      updatedIncomeSources?: { id: string; [key: string]: any }[];
      removedIncomeSourceIds?: string[];
      addedFacts?: any[];
      updatedFacts?: { factKey: string; [key: string]: any }[];
      removedFactKeys?: string[];
      addedTransactions?: any[];
    },
    changeSummary: string
  ): Promise<string> {
    return await this.db.$transaction(async (tx) => {
      // 1. Fetch parent twin with all related records
      const parentTwin = await tx.taxTwin.findUnique({
        where: { id: parentTwinId },
        include: {
          incomeSources: true,
          facts: true,
          transactions: true,
        },
      });

      if (!parentTwin) {
        throw new Error(`Parent Tax Twin with ID ${parentTwinId} not found.`);
      }

      // 2. Lock parent twin and deactivate if it was active
      await tx.taxTwin.update({
        where: { id: parentTwinId },
        data: {
          isActive: false,
          isLocked: true,
        },
      });

      const nextVersion = parentTwin.versionNumber + 1;

      // 3. Create the new child Tax Twin snapshot
      const newTwin = await tx.taxTwin.create({
        data: {
          taxProfileId: parentTwin.taxProfileId,
          taxPeriodId: parentTwin.taxPeriodId,
          versionNumber: nextVersion,
          parentTwinId: parentTwin.id,
          isActive: true,
          isLocked: false,
          changeSummary: changeSummary || `Forked version ${nextVersion} from version ${parentTwin.versionNumber}`,
        },
      });

      // 4. Clone and apply income sources to new twin
      const removedIncSet = new Set(changes.removedIncomeSourceIds || []);
      const updatedIncMap = new Map((changes.updatedIncomeSources || []).map((u) => [u.id, u]));

      const newIncomeSourcesData: any[] = [];
      for (const inc of parentTwin.incomeSources) {
        if (removedIncSet.has(inc.id)) {
          continue; // Skipped
        }
        if (updatedIncMap.has(inc.id)) {
          const updated = updatedIncMap.get(inc.id)!;
          newIncomeSourcesData.push({
            taxTwinId: newTwin.id,
            category: updated.category ?? inc.category,
            employerOrPayer: updated.employerOrPayer ?? inc.employerOrPayer,
            tanNumber: updated.tanNumber ?? inc.tanNumber,
            grossAmount: updated.grossAmount ?? inc.grossAmount,
            taxDeductedAtSource: updated.taxDeductedAtSource ?? inc.taxDeductedAtSource,
            verificationState: updated.verificationState ?? inc.verificationState,
            metadata: updated.metadata ?? inc.metadata,
          });
        } else {
          newIncomeSourcesData.push({
            taxTwinId: newTwin.id,
            category: inc.category,
            employerOrPayer: inc.employerOrPayer,
            tanNumber: inc.tanNumber,
            grossAmount: inc.grossAmount,
            taxDeductedAtSource: inc.taxDeductedAtSource,
            verificationState: inc.verificationState,
            metadata: inc.metadata,
          });
        }
      }

      // Add completely new income sources
      if (changes.addedIncomeSources) {
        for (const inc of changes.addedIncomeSources) {
          newIncomeSourcesData.push({
            taxTwinId: newTwin.id,
            category: inc.category,
            employerOrPayer: inc.employerOrPayer,
            tanNumber: inc.tanNumber,
            grossAmount: inc.grossAmount,
            taxDeductedAtSource: inc.taxDeductedAtSource || 0,
            verificationState: inc.verificationState || VerificationState.NEEDS_CONFIRMATION,
            metadata: inc.metadata,
          });
        }
      }

      if (newIncomeSourcesData.length > 0) {
        await tx.incomeSource.createMany({ data: newIncomeSourcesData });
      }

      // 5. Clone and apply facts
      const removedFactSet = new Set(changes.removedFactKeys || []);
      const updatedFactMap = new Map((changes.updatedFacts || []).map((u) => [u.factKey, u]));

      const newFactsData: any[] = [];
      for (const fact of parentTwin.facts) {
        if (removedFactSet.has(fact.factKey)) {
          continue;
        }
        if (updatedFactMap.has(fact.factKey)) {
          const updated = updatedFactMap.get(fact.factKey)!;
          newFactsData.push({
            taxTwinId: newTwin.id,
            factKey: fact.factKey,
            category: updated.category ?? fact.category,
            factValue: updated.factValue ?? fact.factValue,
            verificationState: updated.verificationState ?? fact.verificationState,
          });
        } else {
          newFactsData.push({
            taxTwinId: newTwin.id,
            factKey: fact.factKey,
            category: fact.category,
            factValue: fact.factValue,
            verificationState: fact.verificationState,
          });
        }
      }

      if (changes.addedFacts) {
        for (const fact of changes.addedFacts) {
          newFactsData.push({
            taxTwinId: newTwin.id,
            factKey: fact.factKey,
            category: fact.category,
            factValue: fact.factValue,
            verificationState: fact.verificationState || VerificationState.NEEDS_CONFIRMATION,
          });
        }
      }

      if (newFactsData.length > 0) {
        await tx.fact.createMany({ data: newFactsData });
      }

      // 6. Clone transactions
      const newTransactionsData = parentTwin.transactions.map((t) => ({
        taxTwinId: newTwin.id,
        transactionDate: t.transactionDate,
        description: t.description,
        amount: t.amount,
        taxCategory: t.taxCategory,
        verificationState: t.verificationState,
      }));

      if (changes.addedTransactions) {
        for (const t of changes.addedTransactions) {
          newTransactionsData.push({
            taxTwinId: newTwin.id,
            transactionDate: t.transactionDate,
            description: t.description,
            amount: t.amount,
            taxCategory: t.taxCategory,
            verificationState: t.verificationState || VerificationState.NEEDS_CONFIRMATION,
          });
        }
      }

      if (newTransactionsData.length > 0) {
        await tx.transaction.createMany({ data: newTransactionsData });
      }

      return newTwin.id;
    });
  }

  /**
   * Retrieves full snapshot of a Tax Twin by ID.
   */
  async getTwinSnapshot(twinId: string): Promise<TwinSnapshot | null> {
    const twin = await this.db.taxTwin.findUnique({
      where: { id: twinId },
      include: {
        incomeSources: true,
        facts: true,
        transactions: true,
      },
    });

    if (!twin) return null;

    return {
      twinId: twin.id,
      taxProfileId: twin.taxProfileId,
      taxPeriodId: twin.taxPeriodId,
      versionNumber: twin.versionNumber,
      parentTwinId: twin.parentTwinId,
      isActive: twin.isActive,
      isLocked: twin.isLocked,
      incomeSources: twin.incomeSources,
      facts: twin.facts,
      transactions: twin.transactions,
      createdAt: twin.createdAt,
    };
  }

  /**
   * Runs authoritative deterministic tax calculation on an immutable Tax Twin.
   */
  async calculateTwinTax(
    twinId: string,
    regimePreference: 'NEW' | 'OLD' | 'COMPARE' = 'COMPARE'
  ): Promise<CalculationResponse> {
    const twin = await this.db.taxTwin.findUnique({
      where: { id: twinId },
      include: {
        taxProfile: true,
        taxPeriod: true,
        incomeSources: true,
        facts: true,
      },
    });

    if (!twin) {
      throw new Error(`Tax Twin ${twinId} not found`);
    }

    // Convert stored income sources to standard calculation input
    const incomeSources: IncomeSourceInput[] = twin.incomeSources.map((inc) => ({
      category: inc.category as IncomeCategory,
      employerOrPayer: inc.employerOrPayer || undefined,
      tanNumber: inc.tanNumber || undefined,
      grossAmount: Number(inc.grossAmount),
      taxDeductedAtSource: Number(inc.taxDeductedAtSource),
      metadata: (inc.metadata as Record<string, any>) || undefined,
    }));

    // Extract deductions from facts table
    const deductions: DeductionsInput = {};
    for (const fact of twin.facts) {
      const val = fact.factValue as any;
      const numVal = typeof val === 'number' ? val : (typeof val === 'object' && val !== null && 'amount' in val ? Number(val.amount) : 0);
      switch (fact.factKey) {
        case 'deduction_80c':
          deductions.section80C = numVal;
          break;
        case 'deduction_80d':
          deductions.section80D = numVal;
          break;
        case 'deduction_80ccd1b':
          deductions.section80CCD1B = numVal;
          break;
        case 'deduction_80ccd2':
          deductions.section80CCD2 = numVal;
          break;
        case 'deduction_24b':
          deductions.section24b = numVal;
          break;
        case 'exemption_hra':
          deductions.hraExemption = numVal;
          break;
        case 'deduction_80tta_ttb':
          deductions.section80TTA_TTB = numVal;
          break;
      }
    }

    const rules = getStatutoryRules(twin.taxPeriod.financialYear);
    const comparison = compareTaxRegimes(incomeSources, deductions, 30, true, rules.financialYear);
    const selectedRegime = regimePreference === 'COMPARE'
      ? (twin.taxProfile.regimePreference as TaxRegime)
      : (regimePreference as TaxRegime);

    const activeResult = selectedRegime === TaxRegime.NEW ? comparison.newRegime : comparison.oldRegime;

    // Save calculation record in database linked to tax_twin_id
    const calcRecord = await this.db.taxCalculation.create({
      data: {
        taxTwinId: twin.id,
        taxPeriodId: twin.taxPeriodId,
        ruleVersion: rules.ruleVersion,
        regime: selectedRegime,
        grossTotalIncome: activeResult.grossTotalIncome,
        totalDeductions: activeResult.totalExemptionsAndDeductions,
        taxableIncome: activeResult.netTaxableIncome,
        taxBeforeRebate: activeResult.taxOnSlabs,
        rebate: activeResult.rebate87A,
        surcharge: activeResult.surcharge,
        cess: activeResult.cess,
        totalTax: activeResult.totalTaxLiability,
        assumptions: activeResult.assumptions,
        warnings: activeResult.warnings,
        calculationTrace: activeResult.calculationTrace as any,
      },
    });

    return {
      calculationId: calcRecord.id,
      taxTwinId: twin.id,
      taxPeriod: {
        financialYear: twin.taxPeriod.financialYear,
        assessmentYear: twin.taxPeriod.assessmentYear,
      },
      ruleVersion: rules.ruleVersion,
      activeRegime: selectedRegime,
      result: activeResult,
      comparison: {
        recommendedRegime: comparison.recommendedRegime,
        taxDifference: comparison.taxDifference,
        oldRegime: comparison.oldRegime,
        newRegime: comparison.newRegime,
        summary: comparison.summary,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
