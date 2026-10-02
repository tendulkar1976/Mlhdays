import { PrismaClient, ResidentialStatus, TaxRegime, IncomeCategory, VerificationState } from '@prisma/client';
import { TaxTwinManager } from '../lib/tax-twin/manager';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding AI Tax Copilot Database ---');

  // 1. Create or Find Tax Period FY 2025-26
  const taxPeriod = await prisma.taxPeriod.upsert({
    where: { financialYear: '2025-2026' },
    update: {},
    create: {
      financialYear: '2025-2026',
      assessmentYear: '2026-2027',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isCurrent: true,
    },
  });
  console.log(`Tax Period: FY ${taxPeriod.financialYear} (AY ${taxPeriod.assessmentYear})`);

  // 2. Create Demo User
  const user = await prisma.user.upsert({
    where: { email: 'rahul.sharma@example.com' },
    update: {},
    create: {
      email: 'rahul.sharma@example.com',
      fullName: 'Rahul Sharma',
    },
  });
  console.log(`User created: ${user.fullName} (${user.email})`);

  // 3. Create Tax Profile
  let profile = await prisma.taxProfile.findFirst({
    where: { userId: user.id },
  });

  if (!profile) {
    profile = await prisma.taxProfile.create({
      data: {
        userId: user.id,
        panNumber: 'ABCDE1234F',
        dateOfBirth: new Date('1994-06-15'),
        residentialStatus: ResidentialStatus.RESIDENT,
        regimePreference: TaxRegime.NEW,
      },
    });
  }
  console.log(`Tax Profile created with PAN: ${profile.panNumber}`);

  // 4. Create Initial Tax Twin v1
  const twinManager = new TaxTwinManager(prisma);
  const twinId = await twinManager.createInitialTwin({
    taxProfileId: profile.id,
    taxPeriodId: taxPeriod.id,
    changeSummary: 'Initial baseline seeded from Form 16 and AIS',
    incomeSources: [
      {
        category: IncomeCategory.SALARY,
        employerOrPayer: 'Tech Enterprises India Pvt Ltd',
        tanNumber: 'BLRT12345A',
        grossAmount: 1475000,
        taxDeductedAtSource: 85000,
        verificationState: VerificationState.VERIFIED,
      },
      {
        category: IncomeCategory.OTHER_SOURCES,
        employerOrPayer: 'HDFC Bank Ltd (Savings Interest)',
        grossAmount: 18000,
        taxDeductedAtSource: 0,
        verificationState: VerificationState.VERIFIED,
      },
    ],
    facts: [
      {
        factKey: 'deduction_80c',
        category: 'CHAPTER_VI_A',
        factValue: { amount: 150000, components: ['EPF', 'ELSS_MUTUAL_FUND'] },
        verificationState: VerificationState.VERIFIED,
      },
      {
        factKey: 'deduction_80d',
        category: 'CHAPTER_VI_A',
        factValue: { amount: 25000, policy: 'Self and Family Mediclaim' },
        verificationState: VerificationState.VERIFIED,
      },
      {
        factKey: 'deduction_80ccd1b',
        category: 'CHAPTER_VI_A',
        factValue: { amount: 50000, scheme: 'NPS Tier 1 Voluntary' },
        verificationState: VerificationState.VERIFIED,
      },
    ],
    transactions: [
      {
        transactionDate: new Date('2025-08-10'),
        description: 'HDFC Ergo Health Insurance Premium',
        amount: 25000,
        taxCategory: '80D_HEALTH_INSURANCE',
        verificationState: VerificationState.VERIFIED,
      },
    ],
  });

  console.log(`Tax Twin v1 initialized with ID: ${twinId}`);

  // 5. Run Initial Authoritative Calculation on Twin v1
  const calculation = await twinManager.calculateTwinTax(twinId, 'COMPARE');
  console.log(`Calculation completed: Taxable Income = ₹${calculation.result.netTaxableIncome.toLocaleString('en-IN')}, Total Tax = ₹${calculation.result.totalTaxLiability.toLocaleString('en-IN')}`);
  console.log(`Optimal Regime: ${calculation.comparison?.recommendedRegime} (Savings: ₹${calculation.comparison?.taxDifference.toLocaleString('en-IN')})`);

  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
