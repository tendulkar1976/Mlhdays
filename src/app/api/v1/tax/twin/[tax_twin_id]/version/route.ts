import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TaxTwinManager } from '@/lib/tax-twin/manager';
import { z } from 'zod';

const ForkVersionRequestSchema = z.object({
  changeSummary: z.string().min(1, 'Change summary is required to document reason for new version'),
  addedIncomeSources: z.array(z.any()).optional().default([]),
  updatedIncomeSources: z.array(z.any()).optional().default([]),
  removedIncomeSourceIds: z.array(z.string()).optional().default([]),
  addedFacts: z.array(z.any()).optional().default([]),
  updatedFacts: z.array(z.any()).optional().default([]),
  removedFactKeys: z.array(z.string()).optional().default([]),
  addedTransactions: z.array(z.any()).optional().default([]),
});

/**
 * POST /api/v1/tax/twin/{tax_twin_id}/version
 * Creates a new Tax Twin version (v2, v3, etc.) while preserving parent immutability.
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
    const parsed = ForkVersionRequestSchema.safeParse(body);

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

    const manager = new TaxTwinManager(prisma);
    const newTwinId = await manager.forkNewTwinVersion(
      tax_twin_id,
      parsed.data,
      parsed.data.changeSummary
    );

    const snapshot = await manager.getTwinSnapshot(newTwinId);

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'TAX_TWIN',
        entityId: newTwinId,
        action: 'FORK_NEW_VERSION',
        details: {
          parentTwinId: tax_twin_id,
          versionNumber: snapshot?.versionNumber,
          changeSummary: parsed.data.changeSummary,
        },
      },
    });

    return NextResponse.json(
      {
        message: `Tax Twin v${snapshot?.versionNumber} created successfully`,
        twinId: newTwinId,
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
        error: 'Failed to fork new Tax Twin version',
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
