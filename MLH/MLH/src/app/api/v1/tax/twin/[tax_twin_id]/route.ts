import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TaxTwinManager } from '@/lib/tax-twin/manager';

/**
 * GET /api/v1/tax/twin/{tax_twin_id}
 * Fetches full immutable state snapshot of a specific Tax Twin version.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tax_twin_id: string }> }
) {
  try {
    const { tax_twin_id } = await params;
    if (!tax_twin_id) {
      return NextResponse.json({ error: 'tax_twin_id is required' }, { status: 400 });
    }

    const manager = new TaxTwinManager(prisma);
    const snapshot = await manager.getTwinSnapshot(tax_twin_id);

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Not Found', message: `Tax Twin ${tax_twin_id} does not exist.` },
        { status: 404 }
      );
    }

    // Also fetch associated calculation history and scenarios
    const calculations = await prisma.taxCalculation.findMany({
      where: { taxTwinId: tax_twin_id },
      orderBy: { createdAt: 'desc' },
    });

    const scenarios = await prisma.scenario.findMany({
      where: { taxTwinId: tax_twin_id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      {
        twin: snapshot,
        calculations,
        scenarios,
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
      {
        error: 'Fetch Error',
        message: error?.message || 'Failed to retrieve Tax Twin.',
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
