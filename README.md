# DantaDrishti — Dental College Approval & Inspection Automation Platform

A scalable, role-based workflow platform that automates the end-to-end approval,
inspection, and recognition lifecycle for dental colleges. It combines a
**centralized workflow state machine**, **role-based access control (RBAC)** with
field-level scoping, an **AI inspection finding model** (mock detection adapters),
and a **compliance/risk rule engine** — exposed through a typed REST API and a
cinematic React frontend.

> **Design contract (single sources of truth):**
> - The **workflow transition matrix** ([backend/src/domain/transitions.ts](backend/src/domain/transitions.ts)) is the only authority on allowed state changes.
> - The **RBAC map** ([backend/src/domain/permissions.ts](backend/src/domain/permissions.ts)) is the only authority on who may do what and which fields they can see.
> - The **compliance rule engine** ([backend/src/services/compliance.service.ts](backend/src/services/compliance.service.ts)) is the only authority on risk verdicts.
> - **Only** the centralized workflow service mutates application state, and **every** transition appends an audit event.
> - AI **never** approves or rejects — it only produces findings for human disposition.

---

## Architecture

```
┌──────────────────────────── Frontend (Vite + React + TS) ────────────────────────────┐
│  Landing · Login · Role Dashboards · Application Workspace · Queues · Reports          │
│  Tailwind · Framer Motion · TanStack Query · Zustand · React Router                    │
└───────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │  /api  (Vite proxy → :4000)
┌───────────────────────────────────────┴───────────────────────────────────────────────┐
│ Backend (Node + Express + TS, ESM)                                                      │
│  Routes ─► Middleware (authenticate / requireRole / requirePermission)                  │
│         ─► Serializers (role-scoped field projection)                                   │
│  Services:                                                                              │
│    workflow.service  ← the ONLY state writer; consults transition matrix; writes audit  │
│    application · scrutiny · inspection · aiInspection · observer · assessor              │
│    compliance (rule engine + risk) · ec · deficiency · government · dashboard · report   │
│  Domain: enums · transitions (state machine) · permissions (RBAC)                       │
│  Store: in-memory Map collections (swappable for Mongo/Postgres) + seed                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Tech stack**

| Layer    | Technologies |
|----------|--------------|
| Backend  | Node.js, Express 4, TypeScript (ESM, ES2022), JWT (jsonwebtoken), bcryptjs, zod, nanoid, vitest, tsx |
| Frontend | Vite 5, React 18, TypeScript, Tailwind CSS 3, Framer Motion, TanStack Query 5, Zustand, React Router 6, lucide-react |
| Store    | In-memory `Collection<T>` (Map-backed), swappable behind the service layer |

---

## Quick start

### Backend (port 4000)

```powershell
cd backend
npm install
npm run dev        # starts API on http://localhost:4000 (auto-seeds demo data)
```

Other backend scripts:

```powershell
npm run seed       # (re)seed demo data standalone
npm test           # run vitest suite (17 tests)
npm run build      # type-check + emit to dist/
npm start          # run compiled dist build
```

### Frontend (port 5173)

```powershell
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxies /api → :4000)
npm run build      # production build
```

Run the **backend first**, then the frontend.

---

## Seed users

**Default password for every demo user: `Passw0rd!`**

| Username | Name | Role |
|----------|------|------|
| `applicant_new_college` | Dr. Asha Rao (Dean, Sunrise) | APPLICANT (NEW college → Workflow 1) |
| `applicant_existing_college` | Dr. Vikram Shah (Principal, Heritage) | APPLICANT (existing college → Workflows 2–6) |
| `consultant` | Nimble Education Consultants | CONSULTANT (delegated for multiple colleges) |
| `scrutiny_officer` | S. Iyer | SCRUTINY_OFFICER |
| `case_officer` | R. Menon | CASE_OFFICER |
| `assessor_1` | Dr. Kabir Sen | ASSESSOR |
| `assessor_2` | Dr. Leela Nair | ASSESSOR |
| `observer` | Dr. Imran Qureshi | OBSERVER |
| `ec_member` | — | EC_MEMBER |
| `compliance_officer` | — | COMPLIANCE_OFFICER |
| `government_authority` | — | GOVERNMENT_AUTHORITY |
| `dci_admin` | — | DCI_ADMIN (full access) |
| `super_admin` | — | SUPER_ADMIN (full access) |
| `system_admin` | — | SYSTEM_ADMINISTRATOR (admin/reports/audit only) |

Seed colleges: **Sunrise Dental College** (NEW), **Heritage Institute** (APPROVED),
**Metro Dental College** (RECOGNIZED). Applications are seeded across all 7 workflows
plus a representative set of AI findings.

---

## The seven workflows

| # | Workflow | Who can start |
|---|----------|---------------|
| 1 | New College / New Course Approval | NEW / unregistered institutions only |
| 2 | Increase in Intake | Existing (REGISTERED/APPROVED/RECOGNIZED) |
| 3 | Renewal of Permission | Existing |
| 4 | Recognition of Qualification | Existing |
| 5 | Continuation / Annual Renewal | Existing |
| 6 | New PG / Higher Course | Existing |
| 7 | **Compliance Verification** | **SYSTEM-GENERATED ONLY** (spawned by the deficiency loop; never user-selectable) |

Eligibility is enforced in `checkWorkflowEligibility()` — a NEW college is restricted to
Workflow 1; existing colleges access Workflows 2–6; Workflow 7 can only be created
internally by the deficiency→compliance re-verification process.

---

## Workflow state machine (transition matrix)

States: `DRAFT, SUBMITTED, UNDER_SCRUTINY, INSPECTION_SCHEDULED, AI_INSPECTION,
AI_OBSERVER_REVIEW, ASSESSOR_REVIEW, EC_REVIEW, DEFICIENCY, GOVERNMENT_DECISION,
LETTER_OF_INTENT, LETTER_OF_PERMISSION_OR_RECOGNITION, APPROVED` plus terminals
`REJECTED, WITHDRAWN, STOPPED`.

| From | → To | Action | Allowed roles |
|------|------|--------|---------------|
| DRAFT | SUBMITTED | SUBMIT | APPLICANT, CONSULTANT |
| SUBMITTED | DRAFT | RETURN_INCOMPLETE | SCRUTINY_OFFICER, CASE_OFFICER, DCI_ADMIN |
| SUBMITTED | UNDER_SCRUTINY | START_SCRUTINY | SCRUTINY_OFFICER, CASE_OFFICER, DCI_ADMIN |
| UNDER_SCRUTINY | UNDER_SCRUTINY | REQUEST_CLARIFICATION | SCRUTINY_OFFICER, DCI_ADMIN |
| UNDER_SCRUTINY | INSPECTION_SCHEDULED | SCHEDULE_INSPECTION | CASE_OFFICER, DCI_ADMIN |
| UNDER_SCRUTINY | REJECTED | REJECT_INELIGIBLE | SCRUTINY_OFFICER, DCI_ADMIN |
| INSPECTION_SCHEDULED | AI_INSPECTION | START_AI_INSPECTION | ASSESSOR, CASE_OFFICER, DCI_ADMIN |
| AI_INSPECTION | AI_OBSERVER_REVIEW | SEND_TO_OBSERVER | ASSESSOR, DCI_ADMIN |
| AI_OBSERVER_REVIEW | ASSESSOR_REVIEW | OBSERVER_SIGNOFF | OBSERVER, DCI_ADMIN |
| ASSESSOR_REVIEW | EC_REVIEW | SUBMIT_ASSESSOR_REPORT | ASSESSOR, DCI_ADMIN |
| EC_REVIEW | DEFICIENCY | EC_ASK_COMPLIANCE | EC_MEMBER, DCI_ADMIN |
| EC_REVIEW | GOVERNMENT_DECISION | EC_RECOMMEND | EC_MEMBER, DCI_ADMIN |
| DEFICIENCY | INSPECTION_SCHEDULED | COMPLIANCE_REVERIFY | COMPLIANCE_OFFICER, CASE_OFFICER, DCI_ADMIN |
| GOVERNMENT_DECISION | LETTER_OF_INTENT | GOV_ISSUE_LOI | GOVERNMENT_AUTHORITY, DCI_ADMIN |
| GOVERNMENT_DECISION | REJECTED | GOV_ADVERSE | GOVERNMENT_AUTHORITY, DCI_ADMIN |
| GOVERNMENT_DECISION | WITHDRAWN | GOV_ADVERSE | GOVERNMENT_AUTHORITY, DCI_ADMIN |
| GOVERNMENT_DECISION | STOPPED | GOV_ADVERSE | GOVERNMENT_AUTHORITY, DCI_ADMIN |
| LETTER_OF_INTENT | LETTER_OF_PERMISSION_OR_RECOGNITION | ISSUE_LOP | GOVERNMENT_AUTHORITY, DCI_ADMIN |
| LETTER_OF_PERMISSION_OR_RECOGNITION | APPROVED | MARK_APPROVED | GOVERNMENT_AUTHORITY, DCI_ADMIN |

The **deficiency loop**: `EC_REVIEW → DEFICIENCY` issues a deficiency letter and
(system-side) spawns a **Workflow 7** compliance verification; once compliance is
submitted and validated, `DEFICIENCY → INSPECTION_SCHEDULED` re-enters the inspection
path. EC decisions are restricted to a fixed vocabulary (`ECDecision`).

---

## RBAC — role → permission matrix

Permissions are capability keys checked by middleware (`requirePermission`). `read:scoped`
means the role also receives a **field-projected** application (e.g. scrutiny officers do
**not** see `riskScore`).

| Role | Permissions |
|------|-------------|
| APPLICANT | application:create, read:own, submit, transition |
| CONSULTANT | application:create, read:own, submit, transition |
| SCRUTINY_OFFICER | read:scoped, scrutiny:work, transition |
| CASE_OFFICER | read:scoped, inspection:schedule, transition, reports:view |
| ASSESSOR | read:scoped, inspection:capture, assessor:review, transition |
| OBSERVER | read:scoped, observer:verify, transition |
| EC_MEMBER | read:scoped, ec:decide, transition |
| COMPLIANCE_OFFICER | read:scoped, compliance:work, transition |
| GOVERNMENT_AUTHORITY | read:full, government:decide, transition, reports:view |
| DCI_ADMIN | **all** |
| SUPER_ADMIN | **all** |
| SYSTEM_ADMINISTRATOR | admin:manage, reports:view, audit:view |

Field-scoped reads are defined in `APPLICATION_FIELD_SCOPES` and applied by
[backend/src/serializers/application.serializer.ts](backend/src/serializers/application.serializer.ts).

---

## AI inspection & compliance engine

- **AI findings** ([AIFinding] model) are structured: detection category (16 categories),
  severity, confidence, evidence references, and a `FindingStatus` for human disposition.
  Detection is produced by **mock adapters** ([backend/src/services/ai/detectionAdapters.ts](backend/src/services/ai/detectionAdapters.ts))
  with scenarios: `compliant`, `deficient`, `low_confidence`, `integrity`.
- **Observer** must disposition **every** finding before sign-off.
- **Assessors** submit a **dual-signed** joint report (enforced) before it reaches EC.
- **Compliance service** runs norm rules, computes a **risk score / risk level**, returns a
  `ComplianceVerdict`, and can `suggestDecision()` — but the **AI/engine never auto-approves**.
- **Confidence threshold:** `0.7` (low-confidence findings are flagged for mandatory human review).

---

## REST API surface

Base URL: `http://localhost:4000/api`. All routes except `/health`, `/meta`, and
`/auth/login` require `Authorization: Bearer <token>`.

| Group | Endpoints (representative) |
|-------|----------------------------|
| Meta | `GET /health`, `GET /meta` (states/workflows/decisions/roles/transitions), `GET /colleges` |
| Auth | `POST /auth/login`, `GET /auth/me` |
| Applications | `GET /applications`, `POST /applications`, `GET /applications/:id`, `POST /applications/:id/submit`, `POST /applications/:id/transition` |
| Dashboard | `GET /dashboard`, `GET /notifications` |
| Scrutiny | `GET /scrutiny/queue`, scrutiny actions |
| Inspection | `GET /inspections`, scheduling |
| AI Inspection | `POST /ai-inspection/...` (capture + generate findings) |
| Observer | `GET /observer/...`, finding verification + sign-off |
| Assessor | `GET /assessor/assigned`, dual-signed report submission |
| EC | `GET /ec/queue`, `POST /ec/decision` (fixed vocabulary) |
| Deficiency | `GET /deficiency/...`, deficiency letter + loop |
| Compliance | `GET /compliance/...`, re-verification (Workflow 7) |
| Government | `GET /government/queue`, LOI / bank-guarantee / LOP / adverse |
| Reports | `GET /reports/...` |

Endpoints mounted in [backend/src/app.ts](backend/src/app.ts).

---

## Frontend routes to verify the UI

| Route | Purpose | Roles |
|-------|---------|-------|
| `/` | Cinematic landing page | public |
| `/login` | Demo user quick-select (password `Passw0rd!`) | public |
| `/app` | Role-aware dashboard (widgets + tasks + guidance) | any authenticated |
| `/app/application/:id` | Application workspace: stepper, AI findings, deficiencies, role actions | any authenticated |
| `/app/applications` | My applications | APPLICANT, CONSULTANT |
| `/app/scrutiny` | Scrutiny queue | SCRUTINY_OFFICER, admins |
| `/app/scheduling` | Inspection scheduling | CASE_OFFICER, admins |
| `/app/inspection` | Assigned inspections | ASSESSOR, admins |
| `/app/observer` | Observer review | OBSERVER, admins |
| `/app/ec` | EC agenda | EC_MEMBER, admins |
| `/app/compliance` | Compliance backlog | COMPLIANCE_OFFICER, admins |
| `/app/government` | Government decisions | GOVERNMENT_AUTHORITY, admins |
| `/app/reports` | Reports | CASE_OFFICER, GOVERNMENT_AUTHORITY, admins |

---

## Suggested demo walkthrough

1. Open `/login`, sign in as `applicant_new_college` → create/submit a Workflow 1 application.
2. Sign in as `scrutiny_officer` → open `/app/scrutiny`, start scrutiny, schedule (or hand to `case_officer`).
3. As `case_officer` → schedule inspection (assign assessors + observer).
4. As `assessor_1` → start AI inspection, generate findings, send to observer.
5. As `observer` → disposition every finding, sign off.
6. As `assessor_1` & `assessor_2` → submit the dual-signed report to EC.
7. As `ec_member` → either recommend to Government, **or** ask for compliance (issues a deficiency + spawns Workflow 7).
8. As `compliance_officer` → submit compliance; re-verification re-enters the inspection path.
9. As `government_authority` → issue LOI → verify bank guarantee → issue LOP → mark Approved.

At every step, check the **audit trail** and **notifications**; confirm scoped roles cannot
see restricted fields or access other roles' queues (e.g. observer is `403` on `/api/ec/queue`).

---

## Testing & QA

```powershell
cd backend
npm test
```

Current suite: **17 tests, all passing** across:

- `workflow.test.ts` — valid/invalid transitions, audit emission, engine guards.
- `rbac.test.ts` — permission gating, workflow eligibility, scoped serialization.
- `inspection.test.ts` — observer must disposition all findings, assessor dual-sign enforcement, EC decision vocabulary.
- `government.test.ts` — full LOI/LOP/approval path and the deficiency → compliance → Workflow 7 re-verification loop.

Both backend (`npm run build`) and frontend (`npm run build`) type-check and build cleanly.

---

## Known limitations

- **In-memory store** — data resets on restart. The `Collection<T>` abstraction sits behind
  the service layer, so swapping in MongoDB/Postgres requires no controller changes.
- **AI detection is mocked** — `detectionAdapters.ts` produces deterministic demo findings;
  there is no real ML model wired in.
- **MFA** is a placeholder flag, not an enforced second factor.
- **Document generation** (deficiency letters, LOI/LOP, reports) returns structured data,
  not rendered PDFs.
- **Maps/geo** are simplified coordinate checks, not a full geospatial integration.
- A few queue pages (`/app/scheduling`, `/app/observer`, `/app/compliance`) reuse the generic
  `/applications` endpoint for listing rather than a dedicated filtered endpoint — functional
  but a candidate for refinement.

---

## Project layout

```
dental-new/
├─ backend/
│  ├─ src/
│  │  ├─ domain/        enums · transitions (state machine) · permissions (RBAC)
│  │  ├─ types/         model interfaces
│  │  ├─ store/         db (Map collections) · seed
│  │  ├─ services/      workflow engine + all domain services + ai/ adapters
│  │  ├─ middleware/    auth · error
│  │  ├─ serializers/   role-scoped application projection
│  │  ├─ routes/        one router per domain
│  │  ├─ config/ utils/ env · ids
│  │  ├─ app.ts         wires routers
│  │  └─ index.ts       seeds + boots server
│  └─ tests/            vitest suites
└─ frontend/
   └─ src/
      ├─ design-system/ tokens · motion · components · AuroraBackground
      ├─ components/     Workflow stepper · AIFindingCard
      ├─ layouts/        DashboardShell
      ├─ pages/          Landing · Login · Dashboard · ApplicationDetail · Queue · Reports
      ├─ lib/ store/     api client · auth store
      └─ App.tsx         router + guards
```
