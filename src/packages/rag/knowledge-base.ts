/**
 * Authoritative Tax Knowledge Base for Indian Income Tax
 * Targeted Baseline: FY 2025-26 / AY 2026-27 (Finance Act 2025)
 */

import { TaxKnowledgeChunk, StatutoryDeadline } from '../../types/shared.js';

export const STATUTORY_TAX_KNOWLEDGE_BASE: TaxKnowledgeChunk[] = [
  {
    id: 'kb_new_regime_slabs_2025_26',
    title: 'New Tax Regime Slabs & Rates (Section 115BAC)',
    section_or_topic: 'Section 115BAC',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    effective_date: '2025-04-01',
    rule_version: 'FY2025_26_AY2026_27',
    source_authority: 'Income Tax Department / Finance Act 2025',
    source_url: 'https://incometaxindia.gov.in',
    keywords: ['new regime', 'slabs', 'rates', 'tax rates', '115bac', 'tax brackets'],
    content: `Under the New Tax Regime (Section 115BAC) for FY 2025-26 (AY 2026-27), the income tax slabs for individuals are:
- ₹0 to ₹4,00,000: Nil (0%)
- ₹4,00,001 to ₹8,00,000: 5%
- ₹8,00,001 to ₹12,00,000: 10%
- ₹12,00,001 to ₹16,00,000: 15%
- ₹16,00,001 to ₹20,00,000: 20%
- ₹20,00,001 to ₹24,00,000: 25%
- Above ₹24,00,000: 30%

The New Tax Regime is the default tax regime unless specifically opted out by filing Form 10-IEA.`,
  },
  {
    id: 'kb_sec_87a_rebate_2025_26',
    title: 'Section 87A Tax Rebate for FY 2025-26',
    section_or_topic: 'Section 87A',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    effective_date: '2025-04-01',
    rule_version: 'FY2025_26_AY2026_27',
    source_authority: 'Income Tax Department / Finance Act 2025',
    source_url: 'https://incometaxindia.gov.in',
    keywords: ['87a', 'rebate', 'zero tax', 'tax free', '12 lakh', 'limit'],
    content: `Under Section 87A for FY 2025-26 (AY 2026-27):
- In the New Tax Regime, resident individuals with total taxable income up to ₹12,00,000 are entitled to a full tax rebate of up to ₹60,000, resulting in zero net tax payable.
- Combined with the ₹75,000 standard deduction, salaried employees with a gross income of up to ₹12,75,000 pay zero income tax under the New Regime.
- In the Old Tax Regime, the Section 87A rebate remains capped at ₹12,500 for total taxable income up to ₹5,00,000.`,
  },
  {
    id: 'kb_standard_deduction_2025_26',
    title: 'Standard Deduction for Salaried Employees & Pensioners',
    section_or_topic: 'Section 16(ia)',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    effective_date: '2025-04-01',
    rule_version: 'FY2025_26_AY2026_27',
    source_authority: 'Income Tax Department / Finance Act 2024 & 2025',
    keywords: ['standard deduction', 'salary', 'pensioner', '16ia', '75000', '50000'],
    content: `For FY 2025-26 (AY 2026-27):
- Under the New Tax Regime, standard deduction under Section 16(ia) is ₹75,000 for salaried employees and pensioners.
- Under the Old Tax Regime, standard deduction remains ₹50,000.
- Standard deduction is automatically available without requiring any bills, receipts, or investment proof.`,
  },
  {
    id: 'kb_sec_80c_deductions',
    title: 'Section 80C Deductions (Old Tax Regime)',
    section_or_topic: 'Section 80C',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    effective_date: '2025-04-01',
    rule_version: 'FY2025_26_AY2026_27',
    source_authority: 'Income Tax Act, 1961',
    keywords: ['80c', 'ppf', 'epf', 'elss', 'lic', 'tuition fees', 'home loan principal', '1.5 lakh'],
    content: `Section 80C allows a maximum deduction of up to ₹1,50,000 from gross total income in the Old Tax Regime.
Eligible investments/expenses include:
- Employee Provident Fund (EPF) and Public Provident Fund (PPF)
- Equity Linked Savings Schemes (ELSS mutual funds with 3-year lock-in)
- Life Insurance premiums (LIC)
- National Savings Certificate (NSC) & Sukanya Samriddhi Yojana (SSY)
- Principal repayment of Home Loan
- Children's tuition fees (up to 2 children)
- 5-year tax-saving Fixed Deposits

Note: Section 80C deduction is NOT allowed under the New Tax Regime.`,
  },
  {
    id: 'kb_sec_80d_health_insurance',
    title: 'Section 80D Health Insurance Deductions',
    section_or_topic: 'Section 80D',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    effective_date: '2025-04-01',
    rule_version: 'FY2025_26_AY2026_27',
    source_authority: 'Income Tax Act, 1961',
    keywords: ['80d', 'health insurance', 'medical insurance', 'parents', 'senior citizen', 'preventive checkup'],
    content: `Section 80D provides tax deductions for health insurance premiums paid in the Old Tax Regime:
- Self, spouse, and dependent children: Up to ₹25,000 (₹50,000 if self/spouse is a senior citizen aged 60+).
- Parents: Additional deduction up to ₹25,000 (₹50,000 if parents are senior citizens).
- Preventive Health Checkup: Up to ₹5,000 within the overall limits mentioned above.
- Maximum possible deduction: Up to ₹1,00,000 if both taxpayer and parents are senior citizens.

Note: Section 80D is NOT deductible under the New Tax Regime.`,
  },
  {
    id: 'kb_nps_80ccd',
    title: 'National Pension System (NPS) Deductions — 80CCD(1B) & 80CCD(2)',
    section_or_topic: 'Section 80CCD',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    effective_date: '2025-04-01',
    rule_version: 'FY2025_26_AY2026_27',
    source_authority: 'Income Tax Act, 1961',
    keywords: ['nps', '80ccd', '80ccd1b', '80ccd2', 'pension', 'employer nps', '50000'],
    content: `NPS Tax Deductions:
1. Section 80CCD(1B): Self-contribution to NPS Tier 1 allows an exclusive deduction of up to ₹50,000 over and above the ₹1.5L 80C limit (Old Regime only).
2. Section 80CCD(2): Employer contribution to employee NPS account:
   - Allowed in BOTH Old and New Tax Regimes.
   - Up to 14% of Basic + DA for Central/State Government employees, and up to 14% for private sector employees under the revised rules.`,
  },
  {
    id: 'kb_hra_exemption_10_13a',
    title: 'House Rent Allowance (HRA) Exemption — Section 10(13A)',
    section_or_topic: 'Section 10(13A)',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    effective_date: '2025-04-01',
    rule_version: 'FY2025_26_AY2026_27',
    source_authority: 'Income Tax Rules, Rule 2A',
    keywords: ['hra', 'house rent allowance', 'rent receipt', 'section 10(13a)', 'metro 50%', 'non-metro 40%'],
    content: `HRA Exemption under Section 10(13A) in the Old Regime is calculated as the minimum of the following three:
1. Actual HRA received from employer.
2. Rent paid minus 10% of Basic Salary + DA.
3. 50% of Basic Salary + DA (for metro cities: Mumbai, Delhi, Kolkata, Chennai) or 40% for non-metro cities.

Note: HRA exemption cannot be claimed under the New Tax Regime.`,
  },
  {
    id: 'kb_home_loan_interest_sec_24',
    title: 'Home Loan Interest Deduction — Section 24(b)',
    section_or_topic: 'Section 24(b)',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    effective_date: '2025-04-01',
    rule_version: 'FY2025_26_AY2026_27',
    source_authority: 'Income Tax Act, 1961',
    keywords: ['home loan', 'interest', 'section 24', '24b', 'house property loss', '2 lakh'],
    content: `Under Section 24(b) (Old Regime):
- Interest paid on a housing loan for a self-occupied property is deductible up to a maximum limit of ₹2,00,000 per financial year.
- For let-out properties, the full interest is deductible against rental income, but overall house property loss that can be set off against other heads of income in a given year is capped at ₹2,00,000.
- In the New Tax Regime, deduction of interest on self-occupied house property is NOT allowed, and loss from let-out property cannot be set off against salary or other income.`,
  },
];

export const STATUTORY_DEADLINES: StatutoryDeadline[] = [
  {
    id: 'dl_itr_individual_non_audit',
    category: 'ITR_FILING',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    due_date: '2026-07-31',
    applicable_to: 'Individual taxpayers, salaried employees, HUFs not liable for tax audit',
    description: 'Due date for filing Income Tax Return (ITR-1 / ITR-2 / ITR-4) for AY 2026-27 without late fees.',
    consequences_of_delay: 'Late fee under Section 234F (up to ₹5,000) and interest under Section 234A (1% per month on unpaid tax).',
    source_authority: 'Section 139(1), Income Tax Act, 1961',
  },
  {
    id: 'dl_advance_tax_q1',
    category: 'ADVANCE_TAX',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    due_date: '2025-06-15',
    applicable_to: 'All taxpayers where estimated tax liability exceeds ₹10,000',
    description: '1st Installment of Advance Tax — 15% of estimated total tax liability.',
    consequences_of_delay: 'Interest under Section 234C at 1% per month for deferment of advance tax.',
    source_authority: 'Section 208 & 211, Income Tax Act, 1961',
  },
  {
    id: 'dl_advance_tax_q2',
    category: 'ADVANCE_TAX',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    due_date: '2025-09-15',
    applicable_to: 'All taxpayers with net tax liability > ₹10,000',
    description: '2nd Installment of Advance Tax — 45% of cumulative estimated tax liability.',
    consequences_of_delay: 'Interest under Section 234C at 1% per month.',
    source_authority: 'Section 208 & 211, Income Tax Act, 1961',
  },
  {
    id: 'dl_advance_tax_q3',
    category: 'ADVANCE_TAX',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    due_date: '2025-12-15',
    applicable_to: 'All taxpayers with net tax liability > ₹10,000',
    description: '3rd Installment of Advance Tax — 75% of cumulative estimated tax liability.',
    consequences_of_delay: 'Interest under Section 234C at 1% per month.',
    source_authority: 'Section 208 & 211, Income Tax Act, 1961',
  },
  {
    id: 'dl_advance_tax_q4',
    category: 'ADVANCE_TAX',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    due_date: '2026-03-15',
    applicable_to: 'All taxpayers with net tax liability > ₹10,000',
    description: '4th Installment of Advance Tax — 100% of estimated tax liability.',
    consequences_of_delay: 'Interest under Section 234B and 234C.',
    source_authority: 'Section 208 & 211, Income Tax Act, 1961',
  },
  {
    id: 'dl_belated_revised_return',
    category: 'BELATED_REVISED_RETURN',
    financial_year: '2025-2026',
    assessment_year: '2026-2027',
    due_date: '2026-12-31',
    applicable_to: 'Taxpayers who missed July 31 deadline or need to revise filed return',
    description: 'Last date to file Belated Return under Section 139(4) or Revised Return under Section 139(5) for AY 2026-27.',
    consequences_of_delay: 'Inability to file regular return; must wait for updated return (ITR-U) with additional tax penalty.',
    source_authority: 'Section 139(4) & 139(5), Income Tax Act, 1961',
  },
];
