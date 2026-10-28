# ARISE — Project Guide

**ARISE** = **A**ICTE **R**egulatory **I**ntelligence & **S**tatutory **E**ngine  
*Smart India Hackathon 2026, Problem Statement SIH26262 (AICTE — Centralized Approval Workflow Automation, Institutional Compliance Monitoring and Alert Management System).*


---

## 1. What Problem It Solves

Every academic year, the All India Council for Technical Education (AICTE) processes tens of thousands of statutory approval applications from technical institutions across India—encompassing New Institution setups, Extension of Approval (EoA), Course Alterations, Intake Expansions, and NRI/Supernumerary seat sanctions.

Currently, regulatory compliance is fragmented across physical inspection files, disconnected state portals, scattered PDF uploads, email exchanges, and manual registers. A generic "Under Review" label conceals critical bottlenecks. AICTE officers need to know:
1. **What the institution claims vs. what is independently evidenced** (e.g., uploading an unverified faculty roster does not guarantee compliance with the 1:20 cadre ratio; an unverified land lease may expire before classes commence).
2. **Which deadlines and milestones are approaching** (Fire Safety NOC validity, building occupancy, environmental clearances, and EVC inspection scheduling SLAs).
3. **Who owns each pending action right now** (whether a case is stalled with the Scrutiny Officer, EVC Lead Expert, Regional Officer, or Central Decision Maker).
4. **The blast radius of regulatory amendments** (if statutory handbook clauses change mid-cycle, which active applications, requirements, and compliance templates are impacted?).

**ARISE** is an integrated statutory case-management portal that connects every approval obligation to its legal instruments, verifiable evidence, physical/virtual inspections, SLA deadlines, and authorized decisions—with an immutable digital audit trail.

**Core Principle**: *Submitted claims are never treated as statutory verification. Evidence is an independent entity with cryptographic SHA-256 provenance, verification states, reviewer ownership, and timestamped transitions.*

---

## 2. Feature Overview

| Area | What It Does |
|---|---|
| **Application Lifecycle & Scoped Dossiers** | Multi-category application drafts (New Technical Institution, Extension of Approval, Intake Expansion). Deterministic Finite State Machine (FSM) transitions, form validation, and immutable audit snapshots upon submission. |
| **Evidence & Secure Document Storage** | Upload PDF, PNG, JPG/JPEG, DOC, DOCX up to 15 MB. Enforces MIME checks, SHA-256 cryptographic provenance, UUID-keyed private disk storage (`backend/uploads/documents`), version history (`v1 → v2 ARCHIVED`), and safe Content-Disposition downloads. |
| **Compliance Evidence Intelligence (CEI)** | Requirement-centred verification framework (Land Lease, Fire Safety NOC, Building Plan, Land Use Certificate, Clause 7.4 Faculty Cadre Ratio). Deterministic explainability cards: *Detected State, Applicable Rule, Why Attention Is Needed, Permitted Next Action*. |
| **Quantitative Cadre Ratio Audit Panel** | Deep-dive mathematical audit for Clause 7.4: evaluates Approved Intake (480), Mandated Cadre (24 faculty at 1:20 ratio), Verified Faculty Count (20), and explicitly calculates net deficit (-4 faculty). |
| **On-Site Geotagged EVC Inspection (Mobile Responsive)** | Field inspection engine using real HTML5 Geolocation API (device coordinates, not hardcoded mock locations), live camera snapshot capture, audio voice memo recording, and automated on-the-fly PDF inspection report generation with instant download. |
| **Regulatory Change Impact Engine (RCIE)** | Restricted 6-stage lifecycle for policy amendments (*Draft Proposed → Deterministic Diff → Dependency Mapping → Active Impact Assessment → Competent Approval → Gazette Enactment*). Clause-level diffing between APH 2025-26 and APH 2026-27 with syntax-highlighted additions/deletions. |
| **Non-Destructive Regulatory Cascade** | Publishing a policy amendment never alters historical completed approvals. It attaches a prominent **Regulatory Transition Notice Banner** to affected live dossiers and dispatches an authorized **Transition Review Task** to assigned scrutiny officers. |
| **Unified Task Queue & Dispatcher** | Authoritative workflow task queue (`/api/tasks`) categorizing actions by `MY_TASKS`, `ALL_TASKS`, `AWAITING_VERIFICATION`, `CLARIFICATION_PENDING`, and `EXPIRING_DOCUMENTS`. Direct routing to application dossiers via `Open Case →`. |
| **Regional Oversight & Aging Heatmaps** | Multi-regional monitoring across all 8 AICTE regions (WRO, SRO, SWRO, SCRO, NRO, NWRO, CRO, ERO). Visualizes disposal rates, intake volumes, SLA pendency, and aging heatmaps. |
| **Central Authority & Decision Command Center** | Executive command center for the Central Decision Maker. Enables instant Letter of Approval (LoA) sanctions, formal Speaking Orders, and committee remands with server-side mutex concurrency locks preventing duplicate submissions. |
| **Multi-Tier Statutory Alerts & Escalation Matrix** | Automated deadline monitoring engine tracking 30-day and 15-day expiry windows. Multi-tier statutory escalations (Level 1: Regional Officer, Level 2: Central Bureau, Level 3: Member Secretary). |
| **Role-Based Access Control (RBAC) & Governance** | 5 Canonical statutory personas + System Administrator. Strict server-side route guards, unauthorized route denial banners, and zero credential leakage. |
| **National Digital Audit Trail** | Tamper-evident, append-only audit log recording every transition, evidence verification, document upload, and regulatory enactment with actor, timestamp, before/after diff, and correlation ID. |

---

## 3. Architecture

```
Browser (React 18 + Vite + UX4G UI)
  │
  ├── HTTP REST + Multipart Uploads ──▶ Express API Server (Node.js + TypeScript)
  │                                       │
  │                                       ├── Finite State Machine (FSM) Engine
  │                                       ├── Compliance Evidence Intelligence (CEI) Engine
  │                                       ├── Regulatory Change Impact Engine (RCIE)
  │                                       ├── SLA Deadline & Escalation Engine
  │                                       ├── Storage & SHA-256 Integrity Service
  │                                       └── Immutable Digital Audit Service
  │                                               │
  │                                               ├── In-Memory Deterministic State Store (Default)
  │                                               └── PostgreSQL / Supabase Migration (Production Ready)
```

### Key Architectural Decisions (ADRs)

1. **Unified TypeScript Stack**: Both frontend and backend share exact domain models and interfaces (`backend/src/models/types.ts` and `frontend/src/types/index.ts`), eliminating API contract drift and type mismatch errors.
2. **Deterministic In-Memory Repository with Supabase Target**: The platform runs out-of-the-box in zero-dependency local simulation mode with realistic synthetic seed data across 15 institutions. Supplying `DATABASE_URL` routes queries directly to PostgreSQL without code refactoring.
3. **Non-Destructive Regulatory Enactment**: The RCIE never retroactively modifies or invalidates completed approvals. It attaches transition notice banners to affected active applications and dispatches review tasks into the officer queue.
4. **Real Device Sensor Capture for EVC**: Utilizes the native HTML5 `navigator.geolocation` API with `enableHighAccuracy: true` and `navigator.mediaDevices.getUserMedia` for genuine field inspection evidence, with graceful manual fallback.
5. **Concurrency Mutex Locks & Idempotency**: Decision endpoints implement server-side mutex locks and idempotency checks (`alreadyCompleted` state response), eliminating duplicate approval orders or contradictory failure toasts during rapid button clicks.

### Repository Layout

```
SIH-PROJECT/
├── backend/
│   ├── src/
│   │   ├── data/mockData.ts            # Seeded institutions, dossiers, requirements, policies, tasks
│   │   ├── models/types.ts             # Domain models (Application, ComplianceRequirement, PortalTask, etc.)
│   │   ├── services/
│   │   │   ├── workflowEngine.ts       # FSM finite-state machine & transition validator
│   │   │   ├── deadlineEngine.ts       # Stage aging & SLA escalation engine
│   │   │   ├── ceiEngine.ts            # Compliance Evidence Intelligence rule engine
│   │   │   ├── rcieEngine.ts           # Regulatory Change Impact Engine & diff builder
│   │   │   ├── storageService.ts       # Multipart upload, SHA-256 hash, and safe storage
│   │   │   └── auditService.ts         # Append-only digital audit trail logger
│   │   ├── routes/
│   │   │   ├── applicationRoutes.ts    # /api/applications (dossiers, transitions, decisions)
│   │   │   ├── complianceRoutes.ts     # /api/compliance (evidence review, CEI findings)
│   │   │   ├── documentRoutes.ts       # /api/documents (multipart upload, download, hash)
│   │   │   ├── inspectionRoutes.ts     # /api/inspections (EVC scheduling, geotagged reports)
│   │   │   ├── policyRoutes.ts         # /api/policies (regulatory diffs, enactment)
│   │   │   ├── taskRoutes.ts           # /api/tasks (unified workflow task engine)
│   │   │   ├── alertRoutes.ts          # /api/alerts (statutory escalations)
│   │   │   ├── institutionRoutes.ts    # /api/institutions (college directory & pendency)
│   │   │   ├── auditRoutes.ts          # /api/audit (national audit log)
│   │   │   └── authRoutes.ts           # /api/auth (session & persona identity)
│   │   └── index.ts                    # Express API server entry point (port 5000)
│   └── test/                           # 31 Vitest unit & integration tests
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts               # Type-safe API client for all backend endpoints
│   │   ├── context/
│   │   │   ├── AuthContext.tsx         # Canonical 5-role persona switcher & RBAC gates
│   │   │   └── ToastContext.tsx        # Toast notifications
│   │   ├── components/
│   │   │   ├── layout/                 # TopNavBar, SideNavBar, AppShell
│   │   │   ├── ui/                     # Badge, Button, Card, Modal, FileUploadModal
│   │   │   └── inspection/             # LiveEVCInspectionModal (camera, GPS, audio, report)
│   │   ├── pages/
│   │   │   ├── HomePage.tsx            # Public portal entry & statistics
│   │   │   ├── LoginPage.tsx           # Role selection & authentication
│   │   │   ├── ApplicationDetailPage.tsx # Application dossier, embedded CEI, Clause 7.4 audit
│   │   │   ├── ProcessingPage.tsx      # Scrutiny workbench, My Tasks queue, CEI checklist
│   │   │   ├── InstitutionPortalPage.tsx # Institution compliance register & evidence upload
│   │   │   ├── RegulatoryChangesPage.tsx # Restricted RCIE workspace, diff comparison, enactment
│   │   │   ├── InspectionsPage.tsx     # EVC & SAC workspace
│   │   │   ├── RegionalOversightPage.tsx # Regional performance matrix & heatmaps
│   │   │   ├── CentralOversightPage.tsx  # Executive decision command center
│   │   │   ├── CompliancePage.tsx      # Cross-application evidence review queue
│   │   │   ├── DashboardPage.tsx       # Operations overview
│   │   │   ├── AlertsPage.tsx          # Multi-tier escalation queue
│   │   │   ├── AuditTrailPage.tsx      # National audit trail
│   │   │   └── SettingsPage.tsx        # Governance & SLA configuration
│   │   ├── utils/
│   │   │   └── evcReportGenerator.ts   # Client-side PDF inspection report generator (jsPDF)
│   │   └── test/                       # 9 Vitest unit tests
│   └── vite.config.ts
│
├── mock-documents/                     # Statutory mock documents generator & HTML templates
│   ├── generate_pdfs.js                # Puppeteer script generating sample PDF certificates
│   ├── 01_Land_Title_Deed_Lease_Agreement.html
│   ├── 02_Fire_Safety_Certificate_NOC.html
│   ├── 03_Approved_Building_Plan_Occupancy.html
│   ├── 04_AICTE_Faculty_Cadre_Roster_Biometric_Summary.html
│   └── 05_Bank_Guarantee_Endowment_FDR_Receipt.html
│
├── supabase/
│   └── migrations/001_initial_schema.sql # PostgreSQL schema & RLS policies
├── package.json                        # Monorepo workspace configuration
├── PROJECT_GUIDE.md                    # This document
└── README.md                           # Public repository overview
```

### Backend Modules

| Module | Responsibility |
|---|---|
| `backend/src/index.ts` | Express server factory, middleware configuration, CORS, rate limits, error handling. |
| `backend/src/services/workflowEngine.ts` | FSM state transitions, allowed transitions by role, prerequisite verification. |
| `backend/src/services/ceiEngine.ts` | Compliance Evidence Intelligence deterministic rules, cadre ratio math, explainability findings. |
| `backend/src/services/rcieEngine.ts` | Clause extraction, side-by-side diff generation, dependency graph mapping, enactment cascade. |
| `backend/src/services/deadlineEngine.ts` | SLA countdowns, 30/15-day expiry calculation, multi-tier escalation triggers. |
| `backend/src/services/storageService.ts` | Disk storage abstraction, file extension whitelist, SHA-256 hash calculation, download streams. |
| `backend/src/services/auditService.ts` | Immutable append-only audit trail logging with before/after state diffing. |
| `backend/src/data/mockData.ts` | Seeded institutions, dossiers, requirements, policies, tasks across 8 AICTE regions. |

### Main API Groups

- `/api/applications` — Dossier retrieval, state transitions, regulatory banner state, and LoA decisions.
- `/api/compliance` — Evidence verification, deficiency notices, and embedded CEI findings.
- `/api/documents` — Multipart file uploads, SHA-256 hash calculation, and sanitized file downloads.
- `/api/inspections` — EVC expert roster, visit scheduling, live inspection evidence submission, and report access.
- `/api/policies` — Regulatory policy versions, clause diffs, dependency mappings, and gazette enactment.
- `/api/tasks` — Central workflow task queue, task status updates, and auto-dispatching.
- `/api/alerts` — SLA deadline monitoring and multi-tier statutory escalations.
- `/api/institutions` — Multi-regional college directory, institution details, and pendency counts.
- `/api/audit` — Immutable national audit trail query endpoint.
- `/api/auth` — Session identity and canonical role switching.

---

## 4. Prerequisites

- **Node.js**: `v18.0.0+` or `v20.0.0+` (LTS recommended)
- **npm**: `v9.0.0+` or `v10.0.0+`
- **Modern Web Browser**: Chrome, Edge, Firefox, or Safari (with Location and Camera permissions enabled for EVC inspection testing).

---

## 5. Quick Start (Local Demo)

### 1. One-Time Setup

```bash
# Clone the repository
git clone https://github.com/akashgouda-01/arise-aicte-portal.git
cd arise-aicte-portal

# Install all workspace dependencies (root, backend, frontend)
npm install

# Setup local environment configuration
copy .env.example .env
```

### 2. Launch Development Servers

```bash
# Start both backend and frontend concurrently
npm run dev
```

*Terminal 1 (Backend)*: Running on `http://localhost:5000`  
*Terminal 2 (Frontend)*: Running on `http://localhost:3000` (or local network IP)

| URL | What It Is |
|---|---|
| `http://localhost:3000` | ARISE Web Application (UX4G Responsive Interface) |
| `http://localhost:5000/api/health` | Backend API Health Check |
| `http://localhost:5000/api/applications` | Applications REST API Endpoint |

### 3. Demo Personas & Roles

Use the **interactive role switcher** in the top navigation bar or log in using any of the canonical personas:

| Role | Name & Title | Typical Scope & Permitted Actions |
|---|---|---|
| **Institution Representative** | Prof. Anand Verma *(Principal, ABC College)* | Upload evidence, view CEI findings, respond to deficiency notices (`/institution`, `/applications`). |
| **Scrutiny Officer** | Dr. Ramesh Chandra *(Application Processing Officer)* | Scrutiny review, Clause 7.4 cadre ratio audit, verify evidence, issue deficiency notices (`/processing`, `/applications/:id`). |
| **EVC Lead Expert** | Prof. Sunita Kulkarni *(Lead Expert & SAC Chair)* | Mobile on-site inspection, live GPS & camera evidence, generate signed PDF report (`/inspections`). |
| **Regional Officer (RO)** | Shri Vikramaditya Joshi *(Regional Director, WRO)* | Regional pendency monitoring, aging heatmaps, SLA compliance tracking (`/regional-oversight`). |
| **Central Decision Maker** | Prof. T. G. Sitharam *(Chairman / Member Secretary)* | Grant Letter of Approval (LoA), issue Speaking Orders, enact regulatory amendments (`/central-oversight`, `/regulatory-changes`). |
| **System Administrator** | Admin Operations | System SLA governance, full national audit trail access (`/settings`, `/audit-trail`). |

---

## 6. How to Use It — Guided Walkthrough (3-4 Minute Flow)

### Step 1: Institution Submits Application & Documents
1. In the top navigation bar, ensure role is set to **Prof. Anand Verma (Institution Representative)**.
2. Navigate to **Applications** (`/applications`) or **Institution Portal** (`/institution`).
3. Click **New Application** and select **Chennai Institute of Technology & Engineering (CITE Chennai)** (PID: `1-72635412`).
4. Select Application Type: **Extension of Approval (EoA) & Intake Expansion**.
5. Upload statutory documents from the `mock-documents/` folder:
   - *Land Lease Deed*: `mock-documents/01_Land_Title_Deed_Lease_Agreement.html` (or PDF)
   - *Fire Safety NOC*: `mock-documents/02_Fire_Safety_Certificate_NOC.html`
   - *Faculty Cadre Roster*: `mock-documents/04_AICTE_Faculty_Cadre_Roster_Biometric_Summary.html`
6. Click **Submit Application**. The record transitions to `SUBMITTED`, locks from unauthorized edits, and dispatches a task to the Scrutiny Officer.

### Step 2: Scrutiny Officer Conducts Cadre & Document Audit
1. Switch role to **Dr. Ramesh Chandra (Scrutiny Officer)**.
2. Navigate to **Processing Workbench** (`/processing`) and open the **My Tasks & Queue** tab.
3. Click on the task for **CITE Chennai** (`app_101`) or click **Open Case →**.
4. Inside the application dossier (`/applications/app_101`), scroll to the **Compliance Evidence Intelligence (CEI)** panel.
5. Inspect the **Clause 7.4 Cadre Ratio Audit Panel**:
   - Total Approved Intake: **480**
   - Mandated Cadre: **24 faculty** (1:20 ratio)
   - Verified Faculty: **20 faculty**
   - Cadre Deficit: **-4 faculty** (Flagged with warning card: *Action Needed: Issue Cadre Deficit Clarification*).
6. Inspect the *Fire Safety Certificate*: Notice the validity indicator showing *Expires in 18 days*.
7. Click **Verify Document** on valid certificates, or click **Recommend for EVC Inspection** to schedule an on-site physical visit.

### Step 3: On-Site EVC Committee Inspection
1. Switch role to **Prof. Sunita Kulkarni (EVC Expert Member)**.
2. Navigate to **EVC & Inspections** (`/inspections`).
3. Select the scheduled visit for **Chennai Institute of Technology & Engineering**.
4. Click **Start On-Site Verification** to launch the mobile-responsive inspection modal.
5. In the inspection modal:
   - **Acquire GPS**: Click **Acquire Live Geolocation**. The browser requests device location access and displays the real device coordinates, accuracy radius (e.g., ±12m), and Chennai verification badge.
   - **Capture Photo**: Click **Take Live Photo** to trigger the device camera. Capture a live photo of the campus infrastructure.
   - **Record Voice Memo**: Click **Record Audio** to dictate field notes.
   - **Generate Report**: Review the automated checklist and click **Complete & Generate Report**.
6. The modal renders the final signed EVC report. Click **Download PDF Report** to save a timestamped, signed inspection document.

### Step 4: Regional Officer Review & Regional Oversight
1. Switch role to **Shri Vikramaditya Joshi (Regional Officer)**.
2. Navigate to **Regional Oversight** (`/regional-oversight`).
3. Review the **Regional Performance Matrix** comparing WRO, SRO, and other regional zones.
4. Check the **Pendency Heatmap** to identify aging applications exceeding the 15-day scrutiny SLA.
5. Review the EVC report recommendation for CITE Chennai and click **Forward to Central Authority with Recommendation**.

### Step 5: Central Decision Maker LoA Sanction & RCIE Enactment
1. Switch role to **Prof. T. G. Sitharam (Central Decision Maker)**.
2. Navigate to **Central Oversight** (`/central-oversight`).
3. In the **My Decisions** queue, locate **CITE Chennai** (`app_101`).
4. Click **Issue Letter of Approval (LoA)**, enter sanction order reference `AICTE/SRO/2026/EOA-0421`, and confirm. The application moves to `APPROVED`.
5. Now, navigate to **Regulatory Changes** (`/regulatory-changes`) (restricted to Central Authority).
6. Select **APH 2026-27 Amendment Draft Rev 2**.
7. Inspect the **Clause-Level Diff**:
   - *Clause 7.4.1 (Cadre Ratio)*: Green text denotes approved amendments.
   - *Clause 4.2.3 (Fire Safety Grace Period)*: Red/green text indicates modified grace period.
8. Review the **Impacted Applications Graph** showing 3 active engineering colleges affected.
9. Click **Enact & Publish Regulatory Amendment**.
10. Navigate back to application `app_101`: Observe the **Regulatory Transition Notice Banner** attached to the dossier, and check `/processing` to see the newly dispatched **Transition Review Task** in the officer queue.

---

## 7. Configuration

All configuration is managed through environment variables (template in `.env.example`):

| Variable | Default Value | Purpose |
|---|---|---|
| `PORT` | `5000` | Port for Express backend server. |
| `NODE_ENV` | `development` | Runtime environment (`development` or `production`). |
| `VITE_API_URL` | `http://localhost:5000/api` | Base API URL consumed by the Vite frontend. |
| `DATABASE_URL` | *(empty)* | Optional PostgreSQL connection string. When omitted, uses in-memory state repository. |
| `SUPABASE_URL` | *(empty)* | Optional Supabase cloud project endpoint. |
| `SUPABASE_ANON_KEY` | *(empty)* | Optional Supabase anonymous public key. |
| `VITE_MAPBOX_ACCESS_TOKEN` | `pk.eyJ1IjoiYWljdGUtcG9ydGFsIi...` | Optional Mapbox token for EVC inspection map renders. |

---

## 8. Testing & Verification

The repository includes a comprehensive automated test suite consisting of **40 automated tests** (31 backend + 9 frontend):

```bash
# Run entire full-stack test suite
npm test

# Run backend unit & integration tests only (31 tests)
npm --prefix backend test

# Run frontend Vitest suite only (9 tests)
npm --prefix frontend test

# Validate production build (TypeScript + Vite bundle)
npm run build
```

### Test Coverage Highlights

- **Backend Workflow (`workflow.test.ts`)**: Validates FSM transitions, blocks illegal stage jumps, tests role authorization gates.
- **Compliance Evidence Intelligence (`cei.test.ts`)**: Evaluates Clause 7.4 cadre ratio math, missing evidence flags, and expiring document thresholds.
- **Document Storage & File Checks (`documents_and_institutions.test.ts`)**: Validates 15MB file size limits, rejects disallowed extensions (`.exe`, `.sh`), verifies SHA-256 hash generation, and tests multi-regional institution filtering.
- **REST Endpoints & Idempotency (`api.test.ts`)**: Validates route authorization, tests decision mutex locks, and ensures idempotent handling of repeated LoA sanction calls.
- **Frontend Engine Tests (`src/test/`)**: Verifies client-side CEI explainability helpers, role-based navigation guards, and status badge color mapping.

---

## 9. Demonstration Boundaries & Production Integration Requirements

To provide full transparency to SIH evaluators, the following boundaries distinguish the demonstration prototype from a live national deployment:

| Capability | SIH Demonstration Prototype | Live NIC / Production Requirement |
|---|---|---|
| **Digital Signature Certificate (DSC)** | SHA-256 hash verification & simulated cryptographic signing tokens. | Integration with an authorized Certifying Authority (CCA / e-Mudhra) via USB crypto token or Aadhaar eSign XML gateway. |
| **Faculty Biometric & Tax Verification** | Evaluates verified synthetic rosters with calculated cadre deficit. | Direct API connection to Income Tax TRACES 24Q or EPFO unified member portal to verify faculty salaries and TDS remittances. |
| **Cloud Database Storage** | Deterministic in-memory repository with Supabase/PostgreSQL schema ready. | Provisioning on MeitY-empanelled cloud (NIC MeghRaj) with PostgreSQL read-replicas and geo-redundant backups. |
| **Document Object Store** | Private filesystem directory (`backend/uploads/documents`) with UUID keys. | S3-compatible private object store (e.g., SeaweedFS, MinIO, or AWS S3) with time-bounded presigned URLs and antivirus scanning. |
| **SMS & GovMail Dispatch** | Statutory dispatch logged to application alert drawer and console. | Connection to CDAC Mobile Seva (SMS gateway) and NIC GovMail SMTP credentials. |

---

## 10. System Preview Mode

If running in a low-resource environment without the backend Node server, the frontend includes a standalone fallback mechanism using synthetic seed data directly within `frontend/src/data/mockData.ts`. This allows evaluating UI responsiveness, color tokens, and layout without launching port 5000.

---

## 11. Stopping and Data Persistence

- **Stop Development Servers**: Press `Ctrl + C` in the terminal to terminate both Vite and Express processes.
- **State Reset**: In-memory state automatically resets to the clean statutory baseline upon server restart, ensuring repeatable judging demonstrations.
- **Persistent Storage**: To persist data permanently across restarts, configure a PostgreSQL database in `.env` (`DATABASE_URL=postgresql://...`) and run the initial migration:
  ```bash
  psql $DATABASE_URL < supabase/migrations/001_initial_schema.sql
  ```

---

## 12. Troubleshooting

| Symptom | Cause | Solution |
|---|---|---|
| **EVC GPS coordinates fail to acquire** | Browser location permission blocked or non-HTTPS/localhost origin. | Click the browser address bar lock icon → Site settings → Allow Location. Ensure accessing via `http://localhost:3000`. |
| **Microphone shows "Not available"** | Microphone permission denied in browser. | Allow microphone permissions in browser settings. The modal also provides a manual text notes fallback. |
| **Port 5000 or 3000 already in use** | Stray Node.js background process running. | Run `taskkill /F /IM node.exe` in PowerShell, then re-run `npm run dev`. |
| **PDF inspection report download fails** | Pop-up blocker preventing automatic download. | Allow pop-ups for `localhost:3000` or click the manual Download button inside the report preview. |
| **Decision button shows "Already Completed"** | Request idempotency protection triggered. | This is expected behavior: the server prevents duplicate approval orders from being issued for the same case. |

---

## 13. Roadmap & Implementation Milestones

- [x] **Milestone 1 (Core & Workflow)**: Multi-category application lifecycle, FSM transition validator, and 5-role statutory RBAC.
- [x] **Milestone 2 (Compliance Evidence Intelligence)**: Embedded CEI panel, explainability finding cards, Clause 7.4 cadre ratio mathematical audit, and cross-application review queue.
- [x] **Milestone 3 (Regulatory Change Impact Engine)**: Clause-level diffing between APH handbooks, dependency mapping, authorized gazette enactment, and transition notice cascade.
- [x] **Milestone 4 (Mobile EVC Inspection Engine)**: Real device GPS acquisition, live camera evidence capture, audio voice memo recording, and automated signed PDF inspection report generator.
- [x] **Milestone 5 (Executive Command Center & Hardening)**: Central oversight decision workspace, concurrency mutex locks, SLA escalation matrix, and 40-test automated verification suite.
- [ ] **Milestone 6 (Production Cloud Staging)**: Deployment on NIC MeghRaj cloud infrastructure, integration with TRACES 24Q API, and DigiLocker statutory document verification.

---

## 14. References & Documentation Index

- **AICTE Approval Process Handbook (APH 2024–2027)**: Statutory reference for institutional norms, cadre ratios, and approval stages.
- **National Single Window System (NSWS)**: Architecture reference for inter-departmental statutory clearances.
- **NIC eOffice Guidelines**: Best practices for digital government file lifecycles and append-only audit trails.
- **UX4G Design System**: User interface design guidelines for Indian government digital portals.
- **Project Documentation**:
  - [`README.md`](file:///d:/SIH-PROJECT/README.md) — Executive summary, technical stack, and repository overview.
  - [`supabase/migrations/001_initial_schema.sql`](file:///d:/SIH-PROJECT/supabase/migrations/001_initial_schema.sql) — PostgreSQL relational schema and Row-Level Security (RLS) policies.
