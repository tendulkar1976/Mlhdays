import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/tax/deadlines
 * Returns official statutory compliance and filing deadlines for FY 2025-26 (AY 2026-27).
 */
export async function GET(request: NextRequest) {
  const deadlines = [
    {
      id: 'dl-adv-tax-q1',
      title: 'Advance Tax — 1st Installment (15%)',
      dueDate: '2025-06-15',
      category: 'ADVANCE_TAX',
      description: '15% of estimated net tax liability payable if total tax exceeds ₹10,000.',
      status: 'UPCOMING',
    },
    {
      id: 'dl-adv-tax-q2',
      title: 'Advance Tax — 2nd Installment (45%)',
      dueDate: '2025-09-15',
      category: 'ADVANCE_TAX',
      description: 'Cumulative 45% of estimated tax liability.',
      status: 'UPCOMING',
    },
    {
      id: 'dl-adv-tax-q3',
      title: 'Advance Tax — 3rd Installment (75%)',
      dueDate: '2025-12-15',
      category: 'ADVANCE_TAX',
      description: 'Cumulative 75% of estimated tax liability.',
      status: 'UPCOMING',
    },
    {
      id: 'dl-adv-tax-q4',
      title: 'Advance Tax — 4th Installment (100%)',
      dueDate: '2026-03-15',
      category: 'ADVANCE_TAX',
      description: '100% of net tax liability to avoid Section 234B & 234C interest.',
      status: 'UPCOMING',
    },
    {
      id: 'dl-investment-proof',
      title: 'Tax Saving Investment Proof Submission to Employer',
      dueDate: '2026-03-31',
      category: 'INVESTMENT_PROOF',
      description: 'Final date to make Section 80C, 80D, and NPS investments for FY 2025-26.',
      status: 'UPCOMING',
    },
    {
      id: 'dl-itr-filing',
      title: 'ITR Filing Deadline for Non-Audit Individuals (AY 2026-27)',
      dueDate: '2026-07-31',
      category: 'ITR_FILING',
      description: 'Statutory due date for filing ITR-1 / ITR-2 / ITR-4 without late fees under Section 234F.',
      status: 'UPCOMING',
    },
    {
      id: 'dl-belated-itr',
      title: 'Belated / Revised Return Filing Deadline',
      dueDate: '2026-12-31',
      category: 'BELATED_RETURN',
      description: 'Last date to file belated return with late fee or revise previously filed return.',
      status: 'UPCOMING',
    },
  ];

  return NextResponse.json(
    {
      financialYear: '2025-2026',
      assessmentYear: '2026-2027',
      deadlines,
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
