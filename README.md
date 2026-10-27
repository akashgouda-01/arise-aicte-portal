# AICTE Centralized Approval & Institutional Compliance Portal
### Smart India Hackathon (SIH) Problem Statement: SIH26262

---

## 1. Executive Summary & Architectural Overview

The **AICTE Centralized Approval & Institutional Compliance Portal** is an enterprise-grade digital platform engineered to automate institutional approvals, monitor multi-regional pendency, coordinate Expert Visit Committee (EVC) schedules, manage post-approval compliance obligations, track lease/certificate expiry, and maintain an immutable national digital audit trail.

Under this implementation, **Compliance Evidence Intelligence (CEI)** and the **Regulatory Change Impact Engine (RCIE)** are fully integrated product capabilities operating on a **shared single source of truth**, rather than disconnected dashboard showcases:

1. **Embedded Compliance Evidence Intelligence (CEI)**:
   - Embedded directly within the **Application Dossier** (`/applications/:id`) and **Institution Portal** (`/institution`) under the *"Compliance Requirements & Evidence"* panel.
   - Provides deterministic explainability cards (*What Was Detected*, *Applicable Regulatory Clause*, *Why Attention Is Needed*, *Rule Version*, and *Permitted Next Action*).
   - Features a deep-dive **Clause 7.4 Cadre Ratio Audit Panel** detailing intake (480), mandated faculty (24), verified faculty (20), actual ratio (1:24), and quantified deficit (-4 faculty).
   - Features an operational **Cross-Application Evidence Review Queue** inside the Scrutiny Officer's Workbench (`/processing`) with multi-filter prioritization.

2. **Restricted Regulatory Change Impact Engine (RCIE)**:
   - Restricted to authorized policy administrators (**Central Decision Maker** & **System Admin**). Hidden from ordinary processing officers, committee experts, and institutions.
   - Features a 6-stage lifecycle progression stepper (*Draft Proposed*, *Deterministic Diff*, *Dependency Mapping*, *Active Impact Assessment*, *Competent Approval*, *Gazette Enactment*).
   - Performs automated clause-level diff comparison (*APH 2025-26 vs APH 2026-27*) with syntax-highlighted additions and deletions.
   - Upon authorized publication, it automatically attaches a **Regulatory Amendment Notice Banner** to affected live application dossiers and dispatches an authorized **Transition Review Task** into the officer's work queue without silently mutating historical records.

3. **Unified Workflow & Task Engine**:
   - Single authoritative task queue (`/api/tasks`) connecting evidence submissions, clarification requests, expiry warnings, and policy transition impacts to the authorized actors.
   - Shared relational and auditable state across all five statutory roles.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **Data & Persistence**:
  - Deterministic state-persistent repository with realistic synthetic seed data for national-scale judging.
  - PostgreSQL / Supabase ready (`supabase/migrations/001_initial_schema.sql`).
- **Design System & Fidelity**:
  - Faithful adherence to the original Stitch UI specification: Forest Green (`#123B32`), Deep Forest (`#0B2924`), Saffron (`#E5A900`), and Bento card grids.
  - **100% Functional Controls**: Every button across all screens triggers working state transitions, modals, API calls, or routing.
- **Quality Assurance**: 39/39 automated unit & integration tests passing (30 backend, 9 frontend).

---

## 3. Five Canonical Stakeholder Roles (SIH Stakeholder Analysis)

As specified in `03_Stakeholder_Wise_Analysis.docx`, the statutory AICTE approval ecosystem is consolidated into **5 canonical stakeholder roles**:

| Canonical Role | Canonical Persona | Scope & Accessible Views | Permitted Actions |
|---|---|---|---|
| **1. Institution Representative** | Prof. Anand Verma *(Principal, ABC College)* | `/institution`, `/applications` | View own institutional dossier, upload lease/NOC evidence, view permitted CEI findings, respond to deficiency notices. |
| **2. Scrutiny / Processing Officer** | Dr. Ramesh Chandra *(Scrutiny Officer)* | `/processing`, `/applications`, `/applications/:id`, `/dashboard` | Review assigned dossiers, inspect evidence documents, record deficiency notices, clear scrutiny, manage My Tasks work queue. |
| **3. EVC & Committee Member** | Prof. Sunita Kulkarni *(Lead Expert & SAC Chair)* | `/inspections`, `/applications`, `/dashboard` | Coordinate inspection roster, schedule physical/virtual visits, submit signed reports, record Standing Appellate Committee recommendations. |
| **4. Regional Officer (RO)** | Shri Vikramaditya Joshi *(Regional Director, WRO)* | `/regional-oversight`, `/applications`, `/inspections`, `/dashboard` | Monitor regional pendency, officer caseloads, aging heatmaps, and Level 1 statutory escalations. |
| **5. Central Decision Maker / Policy Admin** | Prof. T. G. Sitharam *(Chairman / Member Secretary)* | `/regional-oversight`, `/regulatory-changes`, `/applications/:id`, `/dashboard`, `/audit-trail` | Grant Letter of Approval (LoA), issue Speaking Orders, draft & enact regulatory amendments, national governance. |

*(A dedicated **System Administrator** persona is also provided for SLA configuration and system auditing at `/settings` and `/audit-trail`).*

> **Interactive Role Switcher**: Click on the user profile chip in the top navigation bar to instantaneously switch between all 5 personas during evaluation.

---

## 4. Key Workflows & Integrated Capabilities

### A. Integrated Compliance Evidence Intelligence (CEI) Workflow
1. **Dossier Requirement Register**: Each applicable statutory requirement displays its name, clause reference, required document type, submitted file, submission date, validity/expiry date, and verification status (`MISSING`, `RECEIVED`, `NEEDS_REVIEW`, `VERIFIED`, `DEFICIENT`, `EXPIRING`).
2. **Explainable Findings**: Deterministic rule evaluations clearly state *What was detected*, *Applicable Rule Version* (e.g., `APH 2026-27 v2.4`), *Metadata Checked*, and *Action Needed*.
3. **Quantitative Cadre Ratio Breakdown**: Explicitly breaks down total intake, mandated cadre distribution (Professors, Associate Professors, Assistant Professors), verified faculty count, and net deficit.
4. **Officer Review Actions**: Scrutiny officers can open evidence previews, verify documents, issue deficiency notices with formal reasons, or resolve findings.
5. **Operational Work Queue**: Cross-application review queue filtering cases by *Awaiting Verification*, *Clarifications Pending*, *Expiring Documents*, and *Due Soon*.

### B. Restricted Regulatory Change Impact Engine (RCIE) Workflow
1. **Policy Source Register**: Captures source title, issuing authority, version identifier, publication date, effective date, and document provenance hash.
2. **Side-by-Side Clause Diffing**: Visual comparison of existing configuration against proposed amendments with red/green syntax highlighting.
3. **Dependency & Active Case Mapping**: Maps changed clauses to affected requirements, application categories, and live active applications.
4. **Controlled Enactment**: Requires explicit authorized confirmation from `CENTRAL_DECISION_MAKER` or `SYSTEM_ADMIN`.
5. **Operational Cascade**:
   - Updates the active configuration version for future workflows.
   - Attaches a prominent **Regulatory Transition Notice Banner** to affected live application dossiers.
   - Automatically dispatches a `POLICY_IMPACT_REVIEW` task to assigned scrutiny officers.
### C. Secure Document Upload & Storage Architecture
1. **Multi-Role Document Upload Workflows**:
   - **Institution Portal & Dossier**: Upload and replace institutional evidence, land titles, fire NOCs, building approvals, and clarification responses.
   - **EVC Inspections**: Lead experts attach signed physical/virtual inspection reports and committee recommendations.
   - **Regulatory Changes (RCIE)**: Policy administrators upload official Gazette notifications and APH amendments.
2. **Secure Server-Side Storage Engine** (`/backend/src/services/storageService.ts`):
   - **15 MB File Size Limit**: Strictly enforced via stream limiters and Multer memory middleware.
   - **Permitted File Formats**: PDF, PNG, JPG/JPEG, DOC, DOCX. Disallowed executables (`.exe`, `.sh`, `.bat`) rejected with HTTP 400.
   - **Cryptographic Provenance**: Computes SHA-256 hash on upload for tamper verification and immutability.
   - **Safe Storage Keys**: Files saved with unguessable UUID keys (`doc_<uuid>.<ext>`) in private disk storage (`backend/uploads/documents`), fully preventing path traversal attacks.
   - **Sanitized Downloads**: `/api/documents/:id/download` provides RFC-safe Content-Disposition headers.
3. **Version History & Audit Integration**:
   - Replacing a document increments version (`version: 2+`), marks the superseded file as `ARCHIVED`, and maintains full historical lineage.
   - Every upload automatically writes a structured entry to the immutable national audit trail (`AuditService.logEvent`).

### D. Expanded Multi-Regional Synthetic College Dataset (15 Demo Institutions)
- **National Breadth & Coverage**: 15 synthetic demonstration institutions spanning all major AICTE operational regions:
  - *Central* (Demonstration Institute of Technology — Bhopal)
  - *Western* (Sample College of Engineering & Tech — Pune)
  - *Southern* (National Demonstration Institute of Management — Chennai, Regional Technical Institute — Bengaluru)
  - *Northern* (Northern Demo Institute of Engineering — Lucknow, Himalayan Demonstration Institute — Dehradun)
  - *North-West* (Demonstration Institute of Technology — Jaipur, Punjab Demonstration Polytechnic — Ludhiana)
  - *Eastern* (Eastern Demonstration College of Technology — Kolkata, Kalinga Demo Engineering Institute — Bhubaneswar)
  - *South-Central* (Deccan Demonstration Institute of Technology — Hyderabad, Demo Institute of Management Studies — Visakhapatnam)
  - *South-West* (Kerala Demo Institute of Technology — Thiruvananthapuram)
- **Diverse Academic Disciplines**: Engineering & Technology, Polytechnic, Management, and Pharmacy.
- **Synchronized Lifecycle Scenarios**: 15 active applications mapped 1:1 with stages spanning the full regulatory lifecycle:
  `SUBMITTED`, `SCRUTINY`, `CLARIFICATION_REQUIRED`, `RESUBMITTED`, `EVC_REQUIRED`, `EVC_SCHEDULED`, `REPORT_PENDING`, `COMMITTEE_REVIEW`, `DECISION_PENDING`, `DEFICIENCY_COMMUNICATED`, `APPROVED`.
- **Live Directory & Correlation Endpoints**: `/api/institutions` and `/api/institutions/:id` provide multi-filter queries by region, state, institution type, and status with live computed pendency.

### E. Consolidated Central Oversight & Decision Authority Workspace
- **Unified Information Architecture**: Replaced disconnected D1–D5 dashboard navigation with a consolidated central executive workspace (`/central-oversight`).
- **Interactive Multi-Tab Command Center**:
  - **My Decisions**: Pending decision roster with direct LoA sanction grant, speaking order rejection, and remand controls.
  - **National Pendency Pipeline**: Interactive stage cards with dynamic drill-down across active applications.
  - **Regional Performance Matrix**: Comparative intake, disposal, SLA compliance, and compliance rate across all 8 Regional Offices.
  - **Processing Bottlenecks & Escalations**: Level 1 and Level 2 delay tracking and policy transition notices.
  - **Recent Decisions & Audit Log**: Immutable record of granted Letters of Approval (LoA) with formal sanction order references.
- **Decision Execution Idempotency & Concurrency Guards**:
  - Implemented server-side mutex locks preventing race conditions from rapid duplicate submissions.
  - Idempotent request handling on already-approved dossiers (`alreadyCompleted` response), eliminating contradictory failure toasts.
  - Frontend in-flight lock preventing re-submissions during network requests.
- **Visual Rectification & Header Baseline Alignment**:
  - Fixed erratic header text jumping and vertically misaligned badges (`Central Headquarters`, `Consolidated Operational Workspace`).
  - Standardized table pagination (8 records per page with active range and counts), regional filtering, and clean responsive spacing.

---

## 5. Getting Started & Installation

### Prerequisites:
- **Node.js**: v18+ or v20+ LTS
- **npm**: v9+ or v10+

### Step-by-Step Instructions:

1. **Clone or Open the Workspace**:
   ```bash
   cd d:/SIH-PROJECT
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   copy .env.example .env
   ```
   *(Pre-configured for local deterministic simulation mode without external credential requirements).*

4. **Run the Full-Stack Application**:
   ```bash
   npm run dev
   ```
   - **Frontend Application**: `http://localhost:3000`
   - **Backend API Server**: `http://localhost:5000`

5. **Run the Automated Test Suite**:
   ```bash
   npm test
   ```
   *(Executes 39 Vitest unit and integration test cases covering workflow state transitions, CEI deterministic checks, task dispatching, decision execution idempotency, secure document uploads, file storage validation, and Express REST endpoints).*

6. **Build for Production**:
   ```bash
   npm run build
   ```
   *(Compiles TypeScript backend and builds optimized Vite frontend bundle with 0 errors).*

---

## 6. Demonstrated User Journeys for SIH Evaluation

### Journey A: Institution Submits Evidence & Responds to Deficiency
1. Switch role to **Prof. Anand Verma (Institution Representative)**.
2. Navigate to `/institution` or `/applications/app_101`.
3. View the **Compliance Requirements & Evidence** panel. Notice that *Fire Safety NOC* is flagged as nearing expiry and *Faculty Cadre Ratio* has a detected deficit.
4. Click **Upload Evidence**, select `Fire_Safety_Renewal_Certificate_2026.pdf`, enter document details, and submit.
5. Notice that the evidence record updates to `RECEIVED`, and an `EVIDENCE_VERIFICATION` task is automatically dispatched to the scrutiny officer.

### Journey B: Officer Reviews Evidence via My Tasks Queue
1. Switch role to **Dr. Ramesh Chandra (Processing Officer)**.
2. Go to `/processing` and click the **My Tasks & Queue** tab.
3. Observe the newly created task: *Verify Evidence: Fire Safety NOC (ABC Institute)*.
4. Click **Open Case ->**. The application dossier immediately opens at `/applications/app_101` with the evidence panel in focus.
5. Click **Inspect Document** to preview the uploaded certificate.
6. Click **Verify Evidence**. The status updates to `VERIFIED`, the CEI finding is resolved, and an immutable audit event is recorded.

### Journey C: Approaching Expiry Detection
1. Open application dossier `/applications/app_102`.
2. Observe the Land Lease Agreement showing an expiry warning (valid until 2026-11-12).
3. The embedded CEI explainability card details the clause requirement, remaining grace period, and next permitted action without invalidating the application prematurely.

### Journey D: Regulatory Change & Operational Impact Cascade
1. Switch role to **Prof. T. G. Sitharam (Central Decision Maker)**.
2. Navigate to `/regulatory-changes` (Notice this item is hidden for institution and EVC roles).
3. Review the active policy amendment: *Approval Process Handbook (APH) 2026-27 (Draft Rev 2)*.
4. Inspect the side-by-side diff comparing *Clause 7.4.1 (Faculty Cadre Ratio)* and *Clause 4.2.3 (Fire Safety Grace Period)*.
5. Review the **Active Application Impact Analysis** identifying affected engineering colleges.
6. Click **Enact & Publish Regulatory Amendment** and confirm.
7. Open `/applications/app_101`: Observe the **Regulatory Transition Notice Banner** (*"Regulatory Amendment Enacted: APH 2026-27 v2.4"*).
8. Open `/processing` under **My Tasks**: Observe the newly created **Regulatory Transition Review Task** dispatched to the scrutiny officer.

### Journey E: Security & Access Control Enforcement
1. Switch role to **Prof. Anand Verma (Institution Representative)**.
2. Attempt to navigate directly to `/regulatory-changes` or `/regional-oversight`.
3. Access is denied with an explicit RBAC governance banner explaining the required authority.
4. Open the dossier: Internal scrutiny notes and restricted reviewer comments are securely hidden from the institution view.

---

## 7. Project Structure

```
d:/SIH-PROJECT/
├── backend/
│   ├── src/
│   │   ├── data/mockData.ts            # Seeded applications, requirements, policies, tasks
│   │   ├── models/types.ts             # Domain models (PortalTask, ComplianceRequirement, etc.)
│   │   ├── services/
│   │   │   ├── workflowEngine.ts       # Finite-state machine & transition validator
│   │   │   ├── deadlineEngine.ts       # Stage aging & SLA escalation engine
│   │   │   ├── ceiEngine.ts            # Compliance Evidence Intelligence checker
│   │   │   ├── rcieEngine.ts           # Regulatory Change Impact Engine
│   │   │   └── auditService.ts         # Digital audit trail logger
│   │   ├── routes/
│   │   │   ├── applicationRoutes.ts    # /api/applications (dossiers, transitions, regulatory notice)
│   │   │   ├── complianceRoutes.ts     # /api/compliance (evidence upload, CEI findings)
│   │   │   ├── taskRoutes.ts           # /api/tasks (unified workflow task engine)
│   │   │   ├── policyRoutes.ts         # /api/policies (regulatory diffs, publication)
│   │   │   ├── inspectionRoutes.ts     # /api/inspections (EVC scheduling, SAC reviews)
│   │   │   ├── alertRoutes.ts          # /api/alerts (statutory escalations)
│   │   │   └── auditRoutes.ts          # /api/audit (national audit log)
│   │   └── index.ts                    # Express API server entry point (port 5000)
│   └── test/                           # 16 Vitest unit & integration tests
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts               # Type-safe API client (including tasks & policies)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx         # Canonical 5-role switcher & permission gates
│   │   │   └── ToastContext.tsx        # Toast notifications
│   │   ├── components/
│   │   │   ├── layout/                 # TopNavBar, SideNavBar, AppShell
│   │   │   └── ui/                     # Badge, Button, Card, Modal
│   │   ├── pages/
│   │   │   ├── ApplicationDetailPage.tsx # Embedded CEI panel, Clause 7.4 audit, verification modals
│   │   │   ├── ProcessingPage.tsx      # Scrutiny workbench, My Tasks queue, CEI checklist
│   │   │   ├── InstitutionPortalPage.tsx # Institution compliance register & evidence upload
│   │   │   ├── RegulatoryChangesPage.tsx # Restricted RCIE workspace, diff comparison, enactment
│   │   │   ├── InspectionsPage.tsx     # EVC & SAC workspace
│   │   │   ├── RegionalOversightPage.tsx # Regional performance matrix & heatmaps
│   │   │   ├── CompliancePage.tsx      # Cross-application evidence review queue
│   │   │   ├── DashboardPage.tsx       # Operations overview
│   │   │   ├── AlertsPage.tsx          # Multi-tier escalation queue
│   │   │   ├── AuditTrailPage.tsx      # National audit trail
│   │   │   └── SettingsPage.tsx        # Governance & SLA configuration
│   │   └── test/                       # 9 Vitest unit tests
│   └── vite.config.ts
│
├── supabase/
│   └── migrations/001_initial_schema.sql # PostgreSQL schema & RLS policies
└── mock-documents/                     # Statutory mock documents & PDF templates
```

---

## 8. Known Demonstration Boundaries & Production Integration Requirements

- **PKI Digital Signature Certificate (DSC)**: For national production deployment on NIC infrastructure, integrate with an authorized Certifying Authority (CCA / e-Mudhra token gateway). The current implementation verifies cryptographic hashes and simulation tokens deterministically.
- **Automated Faculty Verification (CBDT / Traces 24Q API)**: Faculty cadre verification currently evaluates verified seed rosters. Production integration requires connecting the CEI engine to the Income Tax TRACES 24Q API or EPFO unified member portal.
- **Supabase / PostgreSQL Cloud Database**: The platform runs seamlessly with in-memory state persistence for judging. Specifying `DATABASE_URL` in `.env` automatically routes queries to PostgreSQL.
- **SMS / Email Gateway**: Statutory dispatch notifications are logged to the console and displayed in the application alert drawer. Production deployment requires connecting CDAC Mobile Seva (SMS) or NIC GovMail SMTP credentials.
- **Zero Hardcoded Secrets**: All configuration values are loaded from environment variables; no credentials or secrets exist in the source repository.
