import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TaxTwinManager } from '@/lib/tax-twin/manager';
import { compareTaxRegimes } from '@/lib/tax-engine/comparator';
import { IncomeCategory, IncomeSourceInput, DeductionsInput, TaxRegime } from '@/lib/types';
import { z } from 'zod';

const ScenarioRequestSchema = z.object({
  name: z.string().optional().default('What-If Simulation'),
  description: z.string().optional(),
  additionalSalary: z.number().optional().default(0),
  additionalOtherIncome: z.number().optional().default(0),
  additional80C: z.number().optional().default(0),
  additional80D: z.number().optional().default(0),
  additionalNPS: z.number().optional().default(0),
  additionalHra: z.number().optional().default(0),
  additionalSec24b: z.number().optional().default(0),
  applyToNewVersion: z.boolean().optional().default(false),
});

/**
 * POST /api/v1/tax/twin/{tax_twin_id}/scenario
 * Runs What-If simulation against an immutable Tax Twin baseline.
 * If applyToNewVersion = true, commits changes into a new Tax Twin version.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tax_twin_id: string }> }
) {
  try {
    const { tax_twin_id } = await params;
    if (!tax_twin_id) {
      return NextResponse.json({ error: 'tax_twin_id is required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = ScenarioRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      additionalSalary,
      additionalOtherIncome,
      additional80C,
      additional80D,
      additionalNPS,
      additionalHra,
      additionalSec24b,
      applyToNewVersion,
    } = parsed.data;

    const twin = await prisma.taxTwin.findUnique({
      where: { id: tax_twin_id },
      include: {
        taxProfile: true,
        taxPeriod: true,
        incomeSources: true,
        facts: true,
      },
    });

    if (!twin) {
      return NextResponse.json({ error: 'Tax Twin not found' }, { status: 404 });
    }

    // Build base income sources
    const incomeSources: IncomeSourceInput[] = twin.incomeSources.map((inc) => ({
      category: inc.category as IncomeCategory,
      grossAmount: Number(inc.grossAmount),
      employerOrPayer: inc.employerOrPayer || undefined,
    }));

    if (additionalSalary !== 0) {
      const salIndex = incomeSources.findIndex((i) => i.category === IncomeCategory.SALARY);
      if (salIndex >= 0) {
        incomeSources[salIndex].grossAmount += additionalSalary;
      } else {
        incomeSources.push({ category: IncomeCategory.SALARY, grossAmount: Math.max(0, additionalSalary) });
      }
    }

    if (additionalOtherIncome !== 0) {
      const otherIndex = incomeSources.findIndex((i) => i.category === IncomeCategory.OTHER_SOURCES);
      if (otherIndex >= 0) {
        incomeSources[otherIndex].grossAmount += additionalOtherIncome;
      } else {
        incomeSources.push({ category: IncomeCategory.OTHER_SOURCES, grossAmount: Math.max(0, additionalOtherIncome) });
      }
    }

    // Base deductions from facts + what-if adjustments
    const deductions: DeductionsInput = {};
    for (const f of twin.facts) {
      const val = f.factValue as any;
      const numVal = typeof val === 'number' ? val : (typeof val === 'object' && val !== null && 'amount' in val ? Number(val.amount) : 0);
      if (f.factKey === 'deduction_80c') deductions.section80C = numVal;
      if (f.factKey === 'deduction_80d') deductions.section80D = numVal;
      if (f.factKey === 'deduction_80ccd1b') deductions.section80CCD1B = numVal;
      if (f.factKey === 'exemption_hra') deductions.hraExemption = numVal;
      if (f.factKey === 'deduction_24b') deductions.section24b = numVal;
    }

    deductions.section80C = (deductions.section80C || 0) + additional80C;
    deductions.section80D = (deductions.section80D || 0) + additional80D;
    deductions.section80CCD1B = (deductions.section80CCD1B || 0) + additionalNPS;
    deductions.hraExemption = (deductions.hraExemption || 0) + additionalHra;
    deductions.section24b = (deductions.section24b || 0) + additionalSec24b;

    // Run baseline comparison vs simulated comparison
    const simulatedComparison = compareTaxRegimes(
      incomeSources,
      deductions,
      30,
      true,
      twin.taxPeriod.financialYear
    );

    // Save scenario record
    const scenarioRecord = await prisma.scenario.create({
      data: {
        taxTwinId: twin.id,
        name,
        description: description || 'What-If scenario simulation',
        proposedDiff: {
          additionalSalary,
          additionalOtherIncome,
          additional80C,
          additional80D,
          additionalNPS,
          additionalHra,
          additionalSec24b,
        },
        simulatedResult: simulatedComparison as any,
        isApplied: applyToNewVersion,
      },
    });

    let newVersionTwinId: string | null = null;
    if (applyToNewVersion) {
      const manager = new TaxTwinManager(prisma);
      newVersionTwinId = await manager.forkNewTwinVersion(
        twin.id,
        {
          addedFacts: [
            ...(additional80C > 0 ? [{ factKey: 'deduction_80c', category: 'CHAPTER_VI_A', factValue: { amount: deductions.section80C } }] : []),
            ...(additional80D > 0 ? [{ factKey: 'deduction_80d', category: 'CHAPTER_VI_A', factValue: { amount: deductions.section80D } }] : []),
            ...(additionalNPS > 0 ? [{ factKey: 'deduction_80ccd1b', category: 'CHAPTER_VI_A', factValue: { amount: deductions.section80CCD1B } }] : []),
          ],
        },
        `Applied Scenario: ${name}`
      );
    }

    // Compute baseline tax for comparison
    const baselineIncomeSources: IncomeSourceInput[] = twin.incomeSources.map((inc) => ({
      category: inc.category as IncomeCategory,
      grossAmount: Number(inc.grossAmount),
      employerOrPayer: inc.employerOrPayer || undefined,
    }));
    const baselineDeductions: DeductionsInput = {};
    for (const f of twin.facts) {
      const val = f.factValue as any;
      const numVal = typeof val === 'number' ? val : (typeof val === 'object' && val !== null && 'amount' in val ? Number(val.amount) : 0);
      if (f.factKey === 'deduction_80c') baselineDeductions.section80C = numVal;
      if (f.factKey === 'deduction_80d') baselineDeductions.section80D = numVal;
      if (f.factKey === 'deduction_80ccd1b') baselineDeductions.section80CCD1B = numVal;
      if (f.factKey === 'exemption_hra') baselineDeductions.hraExemption = numVal;
      if (f.factKey === 'deduction_24b') baselineDeductions.section24b = numVal;
    }
    const baselineComparison = compareTaxRegimes(
      baselineIncomeSources,
      baselineDeductions,
      30,
      true,
      twin.taxPeriod.financialYear
    );

    const baselineActiveTax = twin.taxProfile.regimePreference === TaxRegime.OLD
      ? baselineComparison.oldRegime.totalTaxLiability
      : baselineComparison.newRegime.totalTaxLiability;

    const simulatedActiveTax = twin.taxProfile.regimePreference === TaxRegime.OLD
      ? simulatedComparison.oldRegime.totalTaxLiability
      : simulatedComparison.newRegime.totalTaxLiability;

    const taxDelta = baselineActiveTax - simulatedActiveTax; // Positive means tax savings

    return NextResponse.json(
      {
        scenarioId: scenarioRecord.id,
        name,
        baselineTwinId: twin.id,
        appliedNewVersionTwinId: newVersionTwinId,
        isApplied: applyToNewVersion,
        baselineTax: baselineActiveTax,
        simulatedTax: simulatedActiveTax,
        taxDelta,
        savings: Math.max(0, taxDelta),
        recommendedRegime: simulatedComparison.recommendedRegime,
        summary: simulatedComparison.summary,
        statutoryExplanation: simulatedComparison.recommendationDetails,
        simulatedResult: simulatedComparison,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Scenario Calculation Error', message: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
