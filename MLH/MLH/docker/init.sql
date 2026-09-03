-- AI Tax Copilot Database Initialization Script
-- Conforms to SCHEMA.md and SHARED_CONTRACTS.md

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums matching Prisma schema
DO $$ BEGIN
    CREATE TYPE "VerificationState" AS ENUM ('VERIFIED', 'NEEDS_CONFIRMATION', 'CONFLICT', 'EXPERT_REVIEW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TaxRegime" AS ENUM ('NEW', 'OLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ResidentialStatus" AS ENUM ('RESIDENT', 'NON_RESIDENT', 'RNOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "IncomeCategory" AS ENUM ('SALARY', 'HOUSE_PROPERTY', 'CAPITAL_GAINS', 'BUSINESS_PROFESSION', 'OTHER_SOURCES');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DocumentType" AS ENUM ('FORM_16', 'FORM_26AS', 'AIS_TIS', 'BANK_STATEMENT', 'RENT_RECEIPT', 'CAPITAL_GAINS_STATEMENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PARSED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ActionItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tax Periods
CREATE TABLE IF NOT EXISTS tax_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    financial_year VARCHAR(20) UNIQUE NOT NULL,
    assessment_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tax Profiles
CREATE TABLE IF NOT EXISTS tax_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pan_number VARCHAR(10),
    date_of_birth DATE,
    residential_status "ResidentialStatus" DEFAULT 'RESIDENT',
    regime_preference "TaxRegime" DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tax Twins (Immutable versioned snapshots)
CREATE TABLE IF NOT EXISTS tax_twins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_profile_id UUID NOT NULL REFERENCES tax_profiles(id) ON DELETE CASCADE,
    tax_period_id UUID NOT NULL REFERENCES tax_periods(id),
    version_number INTEGER NOT NULL DEFAULT 1,
    parent_twin_id UUID REFERENCES tax_twins(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tax_twin_version UNIQUE (tax_profile_id, tax_period_id, version_number)
);

-- 5. Sources
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(50) NOT NULL,
    document_id UUID,
    extraction_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Facts (FK -> tax_twin_id)
CREATE TABLE IF NOT EXISTS facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_twin_id UUID NOT NULL REFERENCES tax_twins(id) ON DELETE CASCADE,
    fact_key VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    fact_value JSONB NOT NULL,
    verification_state "VerificationState" DEFAULT 'NEEDS_CONFIRMATION',
    confidence_score NUMERIC(5,4),
    source_id UUID REFERENCES sources(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Income Sources (FK -> tax_twin_id)
CREATE TABLE IF NOT EXISTS income_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_twin_id UUID NOT NULL REFERENCES tax_twins(id) ON DELETE CASCADE,
    category "IncomeCategory" NOT NULL,
    employer_or_payer VARCHAR(255),
    tan_number VARCHAR(20),
    gross_amount NUMERIC(14,2) NOT NULL,
    tax_deducted_at_source NUMERIC(14,2) DEFAULT 0.00,
    verification_state "VerificationState" DEFAULT 'NEEDS_CONFIRMATION',
    confidence_score NUMERIC(5,4),
    source_id UUID REFERENCES sources(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Transactions (FK -> tax_twin_id)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_twin_id UUID NOT NULL REFERENCES tax_twins(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    tax_category VARCHAR(100),
    verification_state "VerificationState" DEFAULT 'NEEDS_CONFIRMATION',
    source_id UUID REFERENCES sources(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_profile_id UUID NOT NULL REFERENCES tax_profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type "DocumentType" NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    status "DocumentStatus" DEFAULT 'UPLOADED',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Extractions
CREATE TABLE IF NOT EXISTS extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    raw_extracted JSONB NOT NULL,
    confidence_score NUMERIC(5,4),
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link Source FKs to Document & Extraction
ALTER TABLE sources ADD CONSTRAINT fk_sources_document FOREIGN KEY (document_id) REFERENCES documents(id);
ALTER TABLE sources ADD CONSTRAINT fk_sources_extraction FOREIGN KEY (extraction_id) REFERENCES extractions(id);

-- 11. Tax Calculations
CREATE TABLE IF NOT EXISTS tax_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_twin_id UUID REFERENCES tax_twins(id) ON DELETE SET NULL,
    tax_period_id UUID REFERENCES tax_periods(id),
    rule_version VARCHAR(50) NOT NULL,
    regime "TaxRegime" NOT NULL,
    gross_total_income NUMERIC(14,2) NOT NULL,
    total_deductions NUMERIC(14,2) NOT NULL,
    taxable_income NUMERIC(14,2) NOT NULL,
    tax_before_rebate NUMERIC(14,2) NOT NULL,
    rebate NUMERIC(14,2) DEFAULT 0.00,
    surcharge NUMERIC(14,2) DEFAULT 0.00,
    cess NUMERIC(14,2) DEFAULT 0.00,
    total_tax NUMERIC(14,2) NOT NULL,
    assumptions JSONB NOT NULL,
    warnings JSONB NOT NULL,
    calculation_trace JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Scenarios
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_twin_id UUID NOT NULL REFERENCES tax_twins(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    proposed_diff JSONB NOT NULL,
    simulated_result JSONB,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Reconciliation Records
CREATE TABLE IF NOT EXISTS reconciliation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_twin_id UUID NOT NULL REFERENCES tax_twins(id) ON DELETE CASCADE,
    document_id UUID,
    fact_key VARCHAR(100) NOT NULL,
    original_value JSONB,
    extracted_value JSONB NOT NULL,
    resolution_state "VerificationState" DEFAULT 'NEEDS_CONFIRMATION',
    resolution_note TEXT,
    resulting_twin_id UUID REFERENCES tax_twins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_twin_id UUID NOT NULL REFERENCES tax_twins(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    potential_savings NUMERIC(14,2),
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Action Items
CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_twin_id UUID NOT NULL REFERENCES tax_twins(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status "ActionItemStatus" DEFAULT 'PENDING',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Decision Logs
CREATE TABLE IF NOT EXISTS decision_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_twin_id UUID NOT NULL REFERENCES tax_twins(id) ON DELETE CASCADE,
    decision_type VARCHAR(100) NOT NULL,
    rationale TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Tax Period (FY 2025-26 / AY 2026-27)
INSERT INTO tax_periods (id, financial_year, assessment_year, start_date, end_date, is_current)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '2025-2026',
    '2026-2027',
    '2025-04-01',
    '2026-03-31',
    TRUE
) ON CONFLICT (financial_year) DO NOTHING;
