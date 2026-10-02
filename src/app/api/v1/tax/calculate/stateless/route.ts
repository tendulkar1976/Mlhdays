import { NextRequest, NextResponse } from 'next/server';
import { StatelessCalculationRequestSchema, CalculationResponse, TaxRegime } from '@/lib/types';
import { compareTaxRegimes } from '@/lib/tax-engine/comparator';
import { calculateRegimeTax } from '@/lib/tax-engine/calculator';
import { getStatutoryRules } from '@/lib/tax-rules/registry';
import { randomUUID } from 'crypto';

/**
 * POST /api/v1/tax/calculate/stateless
 * Authoritative deterministic calculation for arbitrary input payloads without DB dependency.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = StatelessCalculationRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { financialYear, regimePreference, incomeSources, deductions, age, isResident } =
      parseResult.data;

    const rules = getStatutoryRules(financialYear);
    const comparison = compareTaxRegimes(incomeSources, deductions, age, isResident, rules.financialYear);

    const activeRegime = regimePreference === 'OLD' ? TaxRegime.OLD : TaxRegime.NEW;
    const activeResult = activeRegime === TaxRegime.NEW ? comparison.newRegime : comparison.oldRegime;

    const responsePayload: CalculationResponse = {
      calculationId: randomUUID(),
      taxTwinId: null,
      taxPeriod: {
        financialYear: rules.financialYear,
        assessmentYear: rules.assessmentYear,
      },
      ruleVersion: rules.ruleVersion,
      activeRegime,
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

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal Calculation Error',
        message: error?.message || 'An unexpected error occurred during tax calculation.',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
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
