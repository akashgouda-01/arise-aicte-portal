-- ==============================================================================
-- AICTE Centralized Approval & Institutional Compliance Portal (SIH26262)
-- Relational Schema for PostgreSQL / Supabase
-- ==============================================================================

-- 1. Users & Roles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    designation TEXT NOT NULL,
    organization TEXT NOT NULL,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Institutions
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permanent_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    region TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    authorized_officer_name TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT UNIQUE NOT NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    region TEXT NOT NULL,
    current_stage TEXT NOT NULL,
    status TEXT NOT NULL,
    assigned_officer_id UUID REFERENCES users(id),
    submission_date DATE NOT NULL,
    target_completion_date DATE,
    requires_evc BOOLEAN DEFAULT FALSE,
    programme_name TEXT,
    intake_proposed INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Application Stage History
CREATE TABLE IF NOT EXISTS application_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    actor_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    reason TEXT,
    duration_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Compliance Requirements (APH Clauses)
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    clause_reference TEXT NOT NULL,
    description TEXT,
    applicable_category TEXT NOT NULL,
    evidence_type TEXT NOT NULL,
    validity_months INTEGER,
    verification_required_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Evidence Documents & Verification Records
CREATE TABLE IF NOT EXISTS evidence_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID REFERENCES compliance_requirements(id),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_size TEXT,
    document_type TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    status TEXT NOT NULL,
    verification_notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EVC Inspections
CREATE TABLE IF NOT EXISTS evc_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_number TEXT UNIQUE NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    region TEXT NOT NULL,
    scheduled_date DATE,
    reporting_deadline DATE,
    status TEXT NOT NULL,
    lead_expert_name TEXT,
    lead_expert_organization TEXT,
    inspection_type TEXT NOT NULL,
    visit_outcome TEXT,
    report_summary TEXT,
    committee_recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Regulatory Policies & Versioned Handbooks
CREATE TABLE IF NOT EXISTS regulatory_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    handbook_year TEXT NOT NULL,
    gazette_reference TEXT,
    effective_date DATE,
    status TEXT NOT NULL,
    source_url TEXT,
    transition_policy TEXT,
    published_by TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. System Alerts & Escalations
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    responsible_role TEXT NOT NULL,
    deadline DATE,
    is_escalated BOOLEAN DEFAULT FALSE,
    escalation_level INTEGER DEFAULT 0,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Trail (Tamper-Evident Event Log)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    details TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    ip_address TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_institution ON applications(institution_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(current_stage);
CREATE INDEX IF NOT EXISTS idx_evidence_requirement ON evidence_documents(requirement_id);
CREATE INDEX IF NOT EXISTS idx_evidence_institution ON evidence_documents(institution_id);
CREATE INDEX IF NOT EXISTS idx_alerts_role ON system_alerts(responsible_role);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);
