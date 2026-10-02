import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { VerificationState } from '@/lib/types';

/**
 * GET /api/v1/tax/twin/{tax_twin_id}/readiness
 * Evaluates filing readiness score, document completeness, and action items for the frontend.
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

    const twin = await prisma.taxTwin.findUnique({
      where: { id: tax_twin_id },
      include: {
        taxProfile: true,
        taxPeriod: true,
        incomeSources: true,
        facts: true,
        transactions: true,
        actionItems: true,
        reconciliations: true,
      },
    });

    if (!twin) {
      return NextResponse.json({ error: 'Tax Twin not found' }, { status: 404 });
    }

    // Tally verification counts
    let verifiedCount = 0;
    let needsConfirmationCount = 0;
    let conflictCount = 0;
    let expertReviewCount = 0;
    const totalItems = twin.incomeSources.length + twin.facts.length;

    const checklist: { item: string; category: string; state: VerificationState; message: string }[] = [];

    // Evaluate Income Sources
    for (const inc of twin.incomeSources) {
      if (inc.verificationState === VerificationState.VERIFIED) verifiedCount++;
      else if (inc.verificationState === VerificationState.NEEDS_CONFIRMATION) needsConfirmationCount++;
      else if (inc.verificationState === VerificationState.CONFLICT) conflictCount++;
      else if (inc.verificationState === VerificationState.EXPERT_REVIEW) expertReviewCount++;

      checklist.push({
        item: `${inc.category} (${inc.employerOrPayer || 'Unknown'}) — ₹${Number(inc.grossAmount).toLocaleString('en-IN')}`,
        category: 'INCOME',
        state: inc.verificationState as VerificationState,
        message: inc.verificationState === VerificationState.VERIFIED
          ? 'Matched with Form 16 / 26AS'
          : 'Pending user confirmation against bank statement / AIS',
      });
    }

    // Evaluate Facts / Deductions
    for (const fact of twin.facts) {
      if (fact.verificationState === VerificationState.VERIFIED) verifiedCount++;
      else if (fact.verificationState === VerificationState.NEEDS_CONFIRMATION) needsConfirmationCount++;
      else if (fact.verificationState === VerificationState.CONFLICT) conflictCount++;
      else if (fact.verificationState === VerificationState.EXPERT_REVIEW) expertReviewCount++;

      checklist.push({
        item: `Deduction: ${fact.factKey}`,
        category: 'DEDUCTION',
        state: fact.verificationState as VerificationState,
        message: fact.verificationState === VerificationState.VERIFIED
          ? 'Proof verified'
          : 'Upload investment proof or receipt',
      });
    }

    // Compute Readiness Score (0 to 100)
    const readinessScore = totalItems > 0
      ? Math.round((verifiedCount / totalItems) * 100)
      : 50;

    const isReadyToDraft = conflictCount === 0 && readinessScore >= 80;

    const completedItems = checklist.filter((i) => i.state === VerificationState.VERIFIED);
    const pendingItems = checklist.filter((i) => i.state === VerificationState.NEEDS_CONFIRMATION);
    const needsReviewItems = checklist.filter((i) => i.state === VerificationState.EXPERT_REVIEW);
    const blockerItems = checklist.filter((i) => i.state === VerificationState.CONFLICT);

    return NextResponse.json(
      {
        taxTwinId: twin.id,
        versionNumber: twin.versionNumber,
        financialYear: twin.taxPeriod.financialYear,
        assessmentYear: twin.taxPeriod.assessmentYear,
        readinessScore,
        isReadyToDraft,
        stats: {
          totalItems,
          verifiedCount,
          needsConfirmationCount,
          conflictCount,
          expertReviewCount,
        },
        checklist,
        completedItems,
        pendingItems,
        needsReviewItems,
        blockerItems,
        actionItems: twin.actionItems,
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
      { error: 'Readiness Error', message: error?.message || 'Server error' },
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
