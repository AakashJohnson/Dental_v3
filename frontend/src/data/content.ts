/**
 * Static reference content sourced from the DCI Regulations 2006, the BDS
 * inspection proformas, the Types-of-Inspections deck and the NDC/DARB EC
 * minutes. Powers the public pages and seeds dashboard guidance.
 */

export interface WorkflowInfo {
  id: string;
  no: number;
  title: string;
  anchor: string;
  eligibility: string;
  forms: string[];
  documents: string[];
  inspectionFocus: string;
  roles: string[];
  outcome: string;
  bankGuarantee?: string;
}

export const WORKFLOWS: WorkflowInfo[] = [
  {
    id: 'WORKFLOW_1_NEW_COLLEGE_FIRST_PG',
    no: 1,
    title: 'Establishment of New College / First PG',
    anchor: 'Reg. 5–10; Act §10A',
    eligibility: 'State/UT, University, autonomous body, registered society or charitable trust with dental education as an objective; 5-acre land; hospital/medical-college attachment.',
    forms: ['Form 1', 'Form 4 (Essentiality)', 'Form 5 (Affiliation)'],
    documents: ['Techno-Economic Feasibility Report', 'Land & ownership deeds', '100-bed hospital / MOU', 'Financials (3 yrs)'],
    inspectionFocus: 'Full proforma — building completion (≥60% before start), dental chairs, labs, hospital beds, faculty, library.',
    roles: ['Applicant', 'Scrutiny Officer', 'Case Officer', 'Assessor', 'Observer', 'Expert Committee', 'Government Authority'],
    outcome: 'LOI → bank guarantee → LOP (1-year, renewable).',
    bankGuarantee: '50 seats → ₹100L · 100 seats → ₹200L',
  },
  {
    id: 'WORKFLOW_2_INCREASE_BDS_MDS_SEATS',
    no: 2,
    title: 'Increase of BDS / MDS Seats',
    anchor: 'Reg. 6, 8; 18–24',
    eligibility: 'Recognised college meeting infrastructure for existing AND proposed capacity; university permission for increased intake.',
    forms: ['Form 3'],
    documents: ['Proof of facilities for both capacities', 'Feasibility certificate', 'Affiliation for increased capacity'],
    inspectionFocus: 'Proforma at higher intake thresholds; special-cases-treated list for last 3 years.',
    roles: ['Applicant', 'Scrutiny Officer', 'Case Officer', 'Assessor', 'Observer', 'Expert Committee', 'Government Authority'],
    outcome: 'Full / partial-restrained / refused. LOI → guarantee → LOP.',
    bankGuarantee: '≤50 → ₹50L · 50–100 → ₹1Cr · PG degree ₹5L/seat · diploma ₹3L/seat',
  },
  {
    id: 'WORKFLOW_3_RENEWAL_BDS_MDS',
    no: 3,
    title: 'Renewal of BDS / MDS Courses',
    anchor: 'Reg. 11',
    eligibility: 'College applies 6 months before session; continued compliance with annual targets.',
    forms: ['Renewal application'],
    documents: ['Carried-forward profile', 'Updated faculty / clinical material', 'Revalidated bank guarantee'],
    inspectionFocus: 'Renewal-purpose proforma (2nd–5th renewal); verification assessment.',
    roles: ['Applicant', 'Scrutiny Officer', 'Case Officer', 'Assessor', 'Observer', 'Expert Committee', 'Government Authority'],
    outcome: 'Renew (often on undertaking from Principal). Recommendation by 15 Jun, LOP by 15 Jul (BDS).',
  },
  {
    id: 'WORKFLOW_4_RECOGNITION_BDS_MDS',
    no: 4,
    title: 'Recognition of BDS / MDS Course',
    anchor: 'Reg. 9; Act §16A',
    eligibility: 'Course reached recognition stage (first batch / clinical readiness); prior permissions intact.',
    forms: ['Recognition request'],
    documents: ['First-batch evidence', 'Clinical-work records', 'Teaching records'],
    inspectionFocus: 'Recognition-purpose proforma — clinical work, teaching, first batch.',
    roles: ['Applicant', 'Scrutiny Officer', 'Assessor', 'Observer', 'Expert Committee', 'Government Authority'],
    outcome: 'Recognition Letter (or defer pending deficiencies). Withdrawal possible under §16A.',
  },
  {
    id: 'WORKFLOW_5_PRE_PG_INSPECTION',
    no: 5,
    title: 'Pre-PG Inspection',
    anchor: 'Reg. 6(2)(hh); MDS Regs',
    eligibility: 'College starting a PG (MDS) course for the first time; OMFS requires medical-college attachment.',
    forms: ['Form 2 (per specialty)'],
    documents: ['PG facility & staff evidence', 'University permission for the course'],
    inspectionFocus: 'Proforma + MDS additional functional requirements per department; specialty equipment lists.',
    roles: ['Applicant', 'Scrutiny Officer', 'Case Officer', 'Assessor', 'Observer', 'Expert Committee', 'Government Authority'],
    outcome: 'Grant on rectification / not-grant pending. LOI → guarantee → LOP.',
    bankGuarantee: 'PG degree ₹60L · diploma ₹40L',
  },
  {
    id: 'WORKFLOW_6_PERIODIC_INSPECTION',
    no: 6,
    title: 'Periodic Inspection',
    anchor: 'Reg. 11A; Act §16A',
    eligibility: 'Recognised college due for 5-yearly periodic review (system-initiated on due date).',
    forms: ['Periodic (system-generated)'],
    documents: ['Current institutional profile', 'UG + PG records'],
    inspectionFocus: 'Periodic-purpose proforma covering UG and PG together.',
    roles: ['Case Officer', 'Assessor', 'Observer', 'Expert Committee', 'Government Authority'],
    outcome: 'Continue recognition / stoppage / withdrawal (§16A) with hearing.',
  },
  {
    id: 'WORKFLOW_7_COMPLIANCE_VERIFICATION',
    no: 7,
    title: 'Compliance Verification Inspection',
    anchor: 'Reg. 8(2) — system-generated only',
    eligibility: 'Auto-spawned when deficiencies are raised in any of Workflows 1–6. Never user-selectable.',
    forms: ['Compliance submission'],
    documents: ['Replies + evidence per deficiency line'],
    inspectionFocus: 'Re-verification of outstanding + previously deficient items only; resolved-vs-outstanding delta.',
    roles: ['Compliance Officer', 'Assessor', 'Observer', 'Expert Committee'],
    outcome: 'Cleared / accepted-on-undertaking / escalate to adverse.',
  },
];

export interface ProcessStage {
  state: string;
  label: string;
  actor: string;
  applicant: string;
  regulator: string;
}

export const PROCESS_STAGES: ProcessStage[] = [
  { state: 'DRAFT', label: 'Draft', actor: 'Applicant / Consultant', applicant: 'Build Form 1/2/3 + annexures', regulator: 'Window & completeness gates' },
  { state: 'SUBMITTED', label: 'Submitted', actor: 'Applicant → Govt Intake', applicant: 'Pay fee & submit', regulator: 'Case ID + snapshot lock' },
  { state: 'UNDER_SCRUTINY', label: 'Under Scrutiny', actor: 'Scrutiny Officer', applicant: 'Respond to clarifications', regulator: 'Eligibility, gating docs, fee, window' },
  { state: 'INSPECTION_SCHEDULED', label: 'Inspection Scheduled', actor: 'Case Officer', applicant: 'Prepare for visit', regulator: 'Assign ≥2 assessors + observer (COI clear)' },
  { state: 'AI_INSPECTION', label: 'AI Inspection', actor: 'Assessor + DantaDrishti', applicant: 'Facilitate on-site capture', regulator: 'Geo-tagged evidence + AI findings' },
  { state: 'AI_OBSERVER_REVIEW', label: 'Observer Review', actor: 'Observer', applicant: '—', regulator: 'Verify every AI finding; disposition exceptions' },
  { state: 'ASSESSOR_REVIEW', label: 'Assessor Review', actor: 'Assessors (×2)', applicant: '—', regulator: 'Dual-signed Joint Assessment Report (24h rule)' },
  { state: 'EC_REVIEW', label: 'EC Review', actor: 'Expert Committee', applicant: '—', regulator: 'Deficiency list + risk score → decision vocabulary' },
  { state: 'DEFICIENCY', label: 'Deficiency (loop)', actor: 'Compliance Officer', applicant: 'Submit compliance per deficiency', regulator: 'Spawns Workflow 7 re-verification' },
  { state: 'GOVERNMENT_DECISION', label: 'Government Decision', actor: 'Government Authority', applicant: '—', regulator: 'Act on EC recommendation' },
  { state: 'LETTER_OF_INTENT', label: 'Letter of Intent', actor: 'Government Authority', applicant: 'Accept conditions + furnish bank guarantee', regulator: 'Verify guarantee amount & validity' },
  { state: 'LETTER_OF_PERMISSION_OR_RECOGNITION', label: 'Permission / Recognition', actor: 'Government Authority', applicant: 'Receive LOP', regulator: 'Issue LOP / Recognition Letter' },
  { state: 'APPROVED', label: 'Approved', actor: 'System', applicant: 'Download approval', regulator: 'Update registry; schedule next obligation' },
];

export interface DocCategory {
  group: string;
  items: { name: string; validity?: boolean; note?: string }[];
}

export const DOCUMENT_CHECKLIST: Record<string, DocCategory[]> = {
  WORKFLOW_1_NEW_COLLEGE_FIRST_PG: [
    { group: 'Constitution', items: [{ name: 'Society/Trust/University registration' }, { name: 'Objectives & managerial capability' }] },
    { group: 'Statutory gating', items: [{ name: 'Essentiality Certificate (Form 4)', validity: true }, { name: 'University Affiliation (Form 5)', validity: true }] },
    { group: 'Land & building', items: [{ name: 'Sale/Lease deed (≥5 acres, ≥30-yr lease)' }, { name: 'Approved building layout (indexed)' }, { name: 'Completion certificate', validity: true }] },
    { group: 'Hospital attachment', items: [{ name: '100-bed hospital permission / MOU', validity: true, note: '≤10 km (≤30 km if own 100-bed)' }] },
    { group: 'Compliance certs', items: [{ name: 'Fire & Safety', validity: true }, { name: 'PCB / STP / Bio-waste', validity: true }, { name: 'AERB (radiology)', validity: true }] },
    { group: 'Financial', items: [{ name: 'Bank Guarantee', validity: true, note: '50→₹100L / 100→₹200L' }, { name: 'Balance sheets (3 yrs)' }] },
  ],
  WORKFLOW_2_INCREASE_BDS_MDS_SEATS: [
    { group: 'Eligibility', items: [{ name: 'Existing recognition proof' }, { name: 'Feasibility & desirability certificate' }] },
    { group: 'Capacity', items: [{ name: 'Facilities for existing + proposed intake' }, { name: 'Affiliation for increased capacity', validity: true }] },
    { group: 'Financial', items: [{ name: 'Bank Guarantee', validity: true, note: '≤50→₹50L / 50–100→₹1Cr' }] },
  ],
  WORKFLOW_3_RENEWAL_BDS_MDS: [
    { group: 'Continuation', items: [{ name: 'Renewal application (6 months prior)' }, { name: 'Updated faculty roster' }, { name: 'Revalidated bank guarantee', validity: true }] },
  ],
  WORKFLOW_4_RECOGNITION_BDS_MDS: [
    { group: 'Recognition', items: [{ name: 'First-batch records' }, { name: 'Clinical-work evidence' }, { name: 'University results' }] },
  ],
  WORKFLOW_5_PRE_PG_INSPECTION: [
    { group: 'PG readiness', items: [{ name: 'Form 2 (per specialty)' }, { name: 'PG faculty evidence' }, { name: 'University permission', validity: true }] },
  ],
  WORKFLOW_6_PERIODIC_INSPECTION: [
    { group: 'Periodic', items: [{ name: 'Current profile (UG+PG)' }, { name: 'Recognition status proof' }] },
  ],
  WORKFLOW_7_COMPLIANCE_VERIFICATION: [
    { group: 'Compliance', items: [{ name: 'Reply per deficiency line' }, { name: 'Evidence per deficiency' }] },
  ],
};

export interface AIDetection {
  category: string;
  label: string;
  metric: string;
  ruleType: string;
}

export const AI_DETECTIONS: AIDetection[] = [
  { category: 'DENTAL_CHAIR_COUNT', label: 'Dental chair counting', metric: 'Functional chairs vs required (100/200)', ruleType: 'count' },
  { category: 'HOSPITAL_BED_COUNT', label: 'Hospital bed counting', metric: 'Beds by ward vs required (100-bed norm)', ruleType: 'count' },
  { category: 'EQUIPMENT_PRESENCE', label: 'Equipment presence', metric: 'Department equipment list detection', ruleType: 'presence' },
  { category: 'LECTURE_HALL_AREA', label: 'Room / area estimation', metric: 'Lecture halls 3200/6400 sq ft', ruleType: 'numeric' },
  { category: 'FACULTY_ATTENDANCE', label: 'Faculty attendance', metric: 'Face/biometric match across both days', ruleType: 'cross_entity' },
  { category: 'OPD_CENSUS', label: 'OPD / patient census', metric: 'New patients/day vs norm (100/150)', ruleType: 'count' },
  { category: 'GEO_DISTANCE', label: 'Geo-distance validation', metric: 'Dental↔medical college ≤10/30 km', ruleType: 'numeric' },
  { category: 'CCTV_STATUS', label: 'CCTV verification', metric: 'CCTV operational presence', ruleType: 'boolean' },
  { category: 'BIOMETRIC_DEVICE', label: 'Biometric device', metric: 'Attendance device present & online', ruleType: 'boolean' },
  { category: 'UNDER_CONSTRUCTION', label: 'Construction completion', metric: 'Floors under construction detection', ruleType: 'boolean' },
  { category: 'LIBRARY_HOLDINGS', label: 'Library holdings', metric: 'Titles, volumes, journals vs norm', ruleType: 'count' },
  { category: 'SHARED_FACILITY', label: 'Shared-facility flag', metric: 'Hostel/lab shared with other colleges', ruleType: 'cross_entity' },
];

export const REGULATIONS = [
  { code: 'Reg. 6', title: 'Eligibility & qualifying criteria', body: 'Eligible bodies, 5-acre land, hospital attachment, 10 dental chairs, phased construction.' },
  { code: 'Reg. 7 / 14 / 20', title: 'Application & fees', body: 'Forms 1/2/3 submission windows; incomplete applications returned; fee covers three inspections.' },
  { code: 'Reg. 8 / 15 / 21', title: 'Evaluation & inspection', body: 'Council evaluates scheme; may seek clarification; conducts physical inspection.' },
  { code: 'Reg. 9 / 16 / 22', title: 'Report of the Council', body: 'Recommendation + authenticated inspection report forwarded to Central Government.' },
  { code: 'Reg. 10 / 17 / 23', title: 'Grant of permission', body: 'LOI with conditions → acceptance + performance bank guarantee → formal permission.' },
  { code: 'Reg. 11', title: 'Renewal of permission', body: 'Apply 6 months prior; recommendation by 15 Jun, orders by 15 Jul.' },
  { code: 'Reg. 11A', title: 'Stop of admissions (§16A)', body: 'Withdrawal of recognition / stoppage of admissions after hearing.' },
  { code: 'Form 4', title: 'Essentiality Certificate', body: 'State Government No-Objection + adequate clinical material confirmation.' },
  { code: 'Form 5', title: 'University Affiliation', body: 'Affiliation valid for the entire course duration.' },
];

/** Per-role responsibility, allowed and restricted summaries (UI fallback). */
export const ROLE_GUIDE: Record<string, { responsibility: string; can: string[]; cannot: string[] }> = {
  APPLICANT: {
    responsibility: 'Submit accurate Form 1/2/3, upload annexures, respond to deficiencies, accept LOI, furnish bank guarantee.',
    can: ['Create & edit own drafts', 'Submit application & pay fee', 'Submit compliance', 'Accept LOI & upload guarantee'],
    cannot: ['View other institutions', 'Alter submitted snapshot', 'See assessor identities pre-visit', 'See internal risk scores'],
  },
  CONSULTANT: {
    responsibility: 'Prepare & submit applications for delegating institutions under explicit mandate.',
    can: ['Prepare drafts for delegated colleges', 'Upload documents', 'Submit on behalf'],
    cannot: ['Sign statutory undertakings unless authorised', 'Access non-delegated colleges'],
  },
  SCRUTINY_OFFICER: {
    responsibility: 'Verify eligibility, documents, application window, fee and statutory completeness.',
    can: ['Run scrutiny checklist', 'Raise clarifications', 'Pass / return / reject (ineligible)'],
    cannot: ['Make inspection or EC decisions', 'Edit applicant documents', 'See full risk score'],
  },
  CASE_OFFICER: {
    responsibility: 'Manage case lifecycle, schedule inspections, assign teams, monitor SLA.',
    can: ['Assign ≥2 assessors + observer', 'Schedule & reschedule', 'Return-incomplete'],
    cannot: ['Make compliance verdicts', 'Edit captured evidence', 'Issue EC/government decisions'],
  },
  ASSESSOR: {
    responsibility: 'Conduct on-site assessment, validate evidence, prepare and sign joint report.',
    can: ['Capture evidence', 'Override AI findings (with reason)', 'Co-sign Joint Assessment Report'],
    cannot: ['Assess where COI', 'Self-assign', 'Edit after dual-sign lock', 'Make EC decisions'],
  },
  OBSERVER: {
    responsibility: 'Independently verify AI findings, flag exceptions, certify the evidence set.',
    can: ['Accept / flag / quarantine each finding', 'Record observations', 'Sign verification'],
    cannot: ['Author the assessment report', 'Capture in place of assessors', 'Access non-assigned cases'],
  },
  EC_MEMBER: {
    responsibility: 'Review deficiency list and risk score, record decision using approved vocabulary.',
    can: ['Add / strike deficiencies', 'Require undertaking', 'Ask compliance / recommend'],
    cannot: ['Alter raw evidence', 'Issue LOI / LOP', 'See unnecessary college details'],
  },
  COMPLIANCE_OFFICER: {
    responsibility: 'Validate compliance response, track deficiency closure, trigger verification.',
    can: ['Validate compliance submissions', 'Trigger re-verification (WF7)', 'Run compliance reports'],
    cannot: ['Make EC/government decisions', 'Edit evidence'],
  },
  GOVERNMENT_AUTHORITY: {
    responsibility: 'Record final government decision and issue statutory approval documents.',
    can: ['Issue LOI', 'Verify bank guarantee', 'Issue LOP / Recognition', 'Order refuse / withdraw / stop'],
    cannot: ['Alter assessment evidence', 'Bypass statutory dates'],
  },
  DCI_ADMIN: {
    responsibility: 'Manage platform operations, monitor workflow, configure rules and reports.',
    can: ['Full administrative oversight', 'User / role management', 'View audit & reports'],
    cannot: ['Bypass the workflow state machine'],
  },
  SUPER_ADMIN: {
    responsibility: 'Govern the platform — roles, norms, decision rules, SLA dates, templates.',
    can: ['Configure master data & rules', 'Manage users/roles', 'Full audit access'],
    cannot: ['Act inside case decisions (segregation of duties)'],
  },
  SYSTEM_ADMINISTRATOR: {
    responsibility: 'Maintain environment, integrations, security, monitoring.',
    can: ['Manage infrastructure & integrations', 'View system logs', 'Monitor services'],
    cannot: ['Access case decisions or evidence content', 'Make any application decision'],
  },
};
