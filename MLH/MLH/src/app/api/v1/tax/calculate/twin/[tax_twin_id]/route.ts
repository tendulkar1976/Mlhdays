import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TaxTwinManager } from '@/lib/tax-twin/manager';

/**
 * POST /api/v1/tax/calculate/twin/{tax_twin_id}
 * Calculates tax on an immutable Tax Twin snapshot and records calculation history.
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

    let regimePreference: 'NEW' | 'OLD' | 'COMPARE' = 'COMPARE';
    try {
      const body = await request.json();
      if (body && body.regimePreference) {
        regimePreference = body.regimePreference;
      }
    } catch {
      // Body is optional
    }

    const twinManager = new TaxTwinManager(prisma);
    const result = await twinManager.calculateTwinTax(tax_twin_id, regimePreference);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }
    return NextResponse.json(
      {
        error: 'Twin Calculation Error',
        message: error?.message || 'Failed to calculate tax for the specified Tax Twin.',
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
