import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TaxTwinManager } from '@/lib/tax-twin/manager';
import { z } from 'zod';
import { IncomeCategory, VerificationState } from '@/lib/types';

const CreateTwinRequestSchema = z.object({
  taxProfileId: z.string().uuid(),
  taxPeriodId: z.string().uuid(),
  changeSummary: z.string().optional().default('Initial Tax Twin Baseline'),
  incomeSources: z
    .array(
      z.object({
        category: z.nativeEnum(IncomeCategory),
        employerOrPayer: z.string().optional(),
        tanNumber: z.string().optional(),
        grossAmount: z.number().nonnegative(),
        taxDeductedAtSource: z.number().nonnegative().optional().default(0),
        verificationState: z.nativeEnum(VerificationState).optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .optional()
    .default([]),
  facts: z
    .array(
      z.object({
        factKey: z.string(),
        category: z.string(),
        factValue: z.any(),
        verificationState: z.nativeEnum(VerificationState).optional(),
      })
    )
    .optional()
    .default([]),
  transactions: z
    .array(
      z.object({
        transactionDate: z.string().or(z.date()),
        description: z.string(),
        amount: z.number().nonnegative(),
        taxCategory: z.string().optional(),
        verificationState: z.nativeEnum(VerificationState).optional(),
      })
    )
    .optional()
    .default([]),
});

/**
 * POST /api/v1/tax/twin
 * Creates initial Tax Twin (v1) linked to tax profile and tax period.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateTwinRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { taxProfileId, taxPeriodId, changeSummary, incomeSources, facts, transactions } =
      parsed.data;

    const manager = new TaxTwinManager(prisma);
    const twinId = await manager.createInitialTwin({
      taxProfileId,
      taxPeriodId,
      changeSummary,
      incomeSources,
      facts,
      transactions: transactions.map((t) => ({
        ...t,
        transactionDate: new Date(t.transactionDate),
      })),
    });

    const snapshot = await manager.getTwinSnapshot(twinId);

    return NextResponse.json(
      {
        message: 'Tax Twin v1 created successfully',
        twinId,
        twin: snapshot,
      },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to create Tax Twin',
        message: error?.message || 'Unexpected server error',
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
