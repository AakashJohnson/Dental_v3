/**
 * DantaDrishti — Per-workflow regulatory configuration.
 *
 * Encodes the workflow-specific rules that the docs say must differ between
 * the 7 workflows: performance bank-guarantee amounts, mandatory gating
 * documents, statutory time-schedule (BDS vs MDS), proforma intake tier,
 * and whether a workflow supports partial/restrained approval.
 *
 * Sources:
 *  - Regulation.md (Reg 10/17/23 bank guarantees; 8th-Amendment time schedule;
 *    Forms 1-5 mandatory annexures; fee schedule)
 *  - 01_BRD / 03_Workflow_and_State_Machine.md (per-workflow variations)
 *  - DENTAL_PORTAL_BLUEPRINT.md (fee + guarantee tables)
 */
import { WorkflowState, WorkflowType } from './enums.js';

export type ProformaTier = '50' | '100' | 'PG';

/** Map an application's course + intake to the proforma threshold tier. */
export function proformaTier(course: string, intake: number): ProformaTier {
  if (course.toUpperCase() === 'MDS') return 'PG';
  return intake > 50 ? '100' : '50';
}

const LAKH = 1; // amounts expressed in ₹ lakh (1 crore = 100 lakh)

export interface BankGuaranteeResult {
  applicable: boolean;
  amountLakh: number;
  basis: string;
}

/**
 * Performance bank guarantee per Reg 10/17/23.
 * Government colleges are exempt (plan-budget undertaking instead).
 */
export function bankGuaranteeFor(input: {
  workflowType: WorkflowType;
  course: string;
  intake: number;
  governmentCollege?: boolean;
}): BankGuaranteeResult {
  if (input.governmentCollege) {
    return { applicable: false, amountLakh: 0, basis: 'Government college — plan-budget undertaking in lieu of guarantee' };
  }
  const isPG = input.course.toUpperCase() === 'MDS';

  switch (input.workflowType) {
    case WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG:
      if (isPG) return { applicable: true, amountLakh: 60 * LAKH, basis: 'PG degree start (Reg 17): ₹60 lakh' };
      return input.intake > 50
        ? { applicable: true, amountLakh: 200 * LAKH, basis: 'New college 100 seats (Reg 10): ₹200 lakh' }
        : { applicable: true, amountLakh: 100 * LAKH, basis: 'New college 50 seats (Reg 10): ₹100 lakh' };

    case WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS:
      if (isPG) return { applicable: true, amountLakh: 5 * input.intake, basis: 'PG degree seat increase (Reg 23): ₹5 lakh/seat' };
      return input.intake > 50
        ? { applicable: true, amountLakh: 100 * LAKH, basis: 'BDS increase 50→100 (Reg 23): ₹1 crore' }
        : { applicable: true, amountLakh: 50 * LAKH, basis: 'BDS increase up to 50 (Reg 23): ₹50 lakh' };

    case WorkflowType.WORKFLOW_5_PRE_PG_INSPECTION:
      return { applicable: true, amountLakh: 60 * LAKH, basis: 'PG degree start (Reg 17): ₹60 lakh' };

    // Renewal / recognition / periodic / compliance — revalidate existing guarantee, no new one.
    default:
      return { applicable: false, amountLakh: 0, basis: 'No fresh performance guarantee required for this workflow' };
  }
}

/** Application fee per workflow (Reg 7/14/20 + fee letters), ₹ lakh. */
export function applicationFeeLakh(workflowType: WorkflowType, governmentCollege?: boolean): number {
  if (governmentCollege) return 0;
  switch (workflowType) {
    case WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG:
      return 6;
    case WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS:
      return 3;
    case WorkflowType.WORKFLOW_4_RECOGNITION_BDS_MDS:
      return 2;
    case WorkflowType.WORKFLOW_5_PRE_PG_INSPECTION:
      return 3;
    case WorkflowType.WORKFLOW_3_RENEWAL_BDS_MDS:
    case WorkflowType.WORKFLOW_6_PERIODIC_INSPECTION:
      return 1;
    default:
      return 0;
  }
}

/** Mandatory gating documents (name keyword + label) per workflow. */
export interface GatingDocSpec {
  key: string;
  label: string;
}

export function requiredGatingDocs(workflowType: WorkflowType): GatingDocSpec[] {
  // Single source of truth: the gating subset of the workflow's documents.
  return requiredDocuments(workflowType)
    .filter((d) => d.gating)
    .map((d) => ({ key: d.key, label: d.label }));
}

/** Workflows that can be partially approved / restrained to a lower capacity. */
export function supportsPartialApproval(workflowType: WorkflowType): boolean {
  return (
    workflowType === WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG ||
    workflowType === WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS
  );
}

/**
 * Full annexure / document checklist required to file each workflow.
 * `gating` documents block scrutiny if missing; `needsValidity` documents
 * require a validity date (Essentiality, Affiliation, etc.).
 */
export interface DocumentSpec {
  key: string;
  label: string;
  type: string;
  gating: boolean;
  needsValidity: boolean;
  /** How the requirement is collected in the UI. Defaults to 'file'. */
  kind?: 'file' | 'geo' | 'proforma';
}

export function requiredDocuments(workflowType: WorkflowType): DocumentSpec[] {
  switch (workflowType) {
    case WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG:
      // Faithful to FORM-1 "List of Enclosures" (Reg 4–6, DCI Regs 2006).
      return [
        { key: 'form1', label: 'Form 1 — Scheme / Application for Permission (Reg 4)', type: 'FORM', gating: false, needsValidity: false },
        { key: 'trust', label: 'Trust Deed / MoA & Bye-laws (Reg 6(1))', type: 'CONSTITUTION', gating: false, needsValidity: false },
        { key: 'registration', label: 'Society / Trust Registration / Incorporation Certificate', type: 'REGISTRATION', gating: false, needsValidity: false },
        { key: 'essentiality', label: 'Essentiality Certificate (Form 4)', type: 'ESSENTIALITY', gating: true, needsValidity: true },
        { key: 'affiliation', label: 'University Affiliation Letter (Form 5)', type: 'AFFILIATION', gating: true, needsValidity: true },
        { key: 'land', label: 'Land Title Deeds (≥5 acres, owned / 30-yr lease)', type: 'LAND', gating: true, needsValidity: false },
        { key: 'zoning', label: 'Zoning / Land-use Plan of the site', type: 'ZONING', gating: false, needsValidity: false },
        { key: 'distance', label: 'Site ↔ Attached Hospital Distance Proof (≤10 km)', type: 'DISTANCE_MAP', gating: true, needsValidity: false, kind: 'geo' },
        { key: 'hospital', label: 'Attached 100-bed Hospital / Medical College Proof (Annexure I)', type: 'HOSPITAL', gating: false, needsValidity: false },
        { key: 'proforma', label: 'Inspection Proforma (Self-Assessment)', type: 'PROFORMA', gating: true, needsValidity: false, kind: 'proforma' },
        { key: 'financial', label: 'Annual Reports & Audited Balance Sheets (last 3 years)', type: 'FINANCIAL', gating: false, needsValidity: false },
        { key: 'bankers', label: "Bankers' Authorisation Letter (financial enquiry)", type: 'BANKERS', gating: false, needsValidity: false },
      ];
    case WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS:
      // Faithful to FORM-3 "Increase of Admission Capacity" (Reg 18–20).
      return [
        { key: 'form3', label: 'Form 3 — Application for Increase of Seats (Reg 18)', type: 'FORM', gating: false, needsValidity: false },
        { key: 'recognition', label: 'Existing Recognition / Permission Letter (Reg 19(a))', type: 'RECOGNITION', gating: true, needsValidity: false },
        { key: 'affiliation', label: 'University Permission for increased capacity (Reg 19(d))', type: 'AFFILIATION', gating: true, needsValidity: true },
        { key: 'feasibility', label: 'State Feasibility & Desirability Certificate (BDS/UG only — Reg 19(c))', type: 'FEASIBILITY', gating: true, needsValidity: false },
        { key: 'financial_allocation', label: 'Financial Allocation Plan — additional equipment & staff (Reg 19(e))', type: 'FINANCE', gating: false, needsValidity: false },
        { key: 'hospital', label: 'Attached 100-bed Hospital / Medical College Proof', type: 'HOSPITAL', gating: false, needsValidity: false },
        { key: 'proforma', label: 'Inspection Proforma (Self-Assessment)', type: 'PROFORMA', gating: false, needsValidity: false, kind: 'proforma' },
        { key: 'financial', label: 'Annual Reports & Audited Balance Sheets (last 3 years)', type: 'FINANCIAL', gating: false, needsValidity: false },
        { key: 'bankers', label: "Bankers' Authorisation Letter (financial enquiry)", type: 'BANKERS', gating: false, needsValidity: false },
      ];
    case WorkflowType.WORKFLOW_3_RENEWAL_BDS_MDS:
      // Faithful to Renewal of Permission (Reg 11 / Reg 24).
      return [
        { key: 'form_renewal', label: 'Application for Renewal of Permission (Reg 11/24)', type: 'FORM', gating: false, needsValidity: false },
        { key: 'previous', label: 'Previous Year Letter of Permission', type: 'PERMISSION', gating: false, needsValidity: false },
        { key: 'affiliation', label: 'University Affiliation (current)', type: 'AFFILIATION', gating: true, needsValidity: true },
        { key: 'targets', label: 'Annual Target Achievement / Compliance Report (Reg 10(3)/23(3))', type: 'COMPLIANCE', gating: false, needsValidity: false },
        { key: 'bank_guarantee', label: 'Performance Bank Guarantee — revalidation proof', type: 'BANK_GUARANTEE', gating: false, needsValidity: true },
        { key: 'proforma', label: 'Inspection Proforma (Self-Assessment)', type: 'PROFORMA', gating: false, needsValidity: false, kind: 'proforma' },
      ];
    case WorkflowType.WORKFLOW_4_RECOGNITION_BDS_MDS:
      // Recognition once the first batch appears in the final examination (Reg 9/16).
      return [
        { key: 'form_recognition', label: 'Application for Recognition (first batch in final exam)', type: 'FORM', gating: false, needsValidity: false },
        { key: 'affiliation', label: 'University Affiliation (current)', type: 'AFFILIATION', gating: true, needsValidity: true },
        { key: 'results', label: 'First-Batch Examination Results / Output Data', type: 'RESULTS', gating: true, needsValidity: false },
        { key: 'previous', label: 'Final-Year Letter of Permission', type: 'PERMISSION', gating: false, needsValidity: false },
        { key: 'compliance', label: 'Compliance with DCI norms — staff / infrastructure', type: 'COMPLIANCE', gating: false, needsValidity: false },
        { key: 'proforma', label: 'Inspection Proforma (Self-Assessment)', type: 'PROFORMA', gating: false, needsValidity: false, kind: 'proforma' },
      ];
    case WorkflowType.WORKFLOW_5_PRE_PG_INSPECTION:
      // Faithful to FORM-2 "Starting Higher / PG Course" (Reg 12–14).
      return [
        { key: 'form2', label: 'Form 2 — Application for Starting Higher (PG) Course (Reg 12)', type: 'FORM', gating: false, needsValidity: false },
        { key: 'bds_recognition', label: 'BDS Recognition Proof (Reg 13(a))', type: 'RECOGNITION', gating: true, needsValidity: false },
        { key: 'affiliation', label: 'University Permission for the PG course (Reg 13(c))', type: 'AFFILIATION', gating: true, needsValidity: true },
        { key: 'department', label: 'Department Readiness — Faculty & Equipment (MDS norms, Reg 13(d))', type: 'DEPARTMENT', gating: true, needsValidity: false },
        { key: 'distance', label: 'Site ↔ Attached Medical College Distance Proof (≤10 km, Reg 6(h))', type: 'DISTANCE_MAP', gating: false, needsValidity: false, kind: 'geo' },
        { key: 'hospital', label: 'Attached 100-bed Hospital / Medical College Proof', type: 'HOSPITAL', gating: false, needsValidity: false },
        { key: 'proforma', label: 'Inspection Proforma (Self-Assessment)', type: 'PROFORMA', gating: false, needsValidity: false, kind: 'proforma' },
        { key: 'bankers', label: "Bankers' Authorisation Letter (financial enquiry)", type: 'BANKERS', gating: false, needsValidity: false },
      ];
    case WorkflowType.WORKFLOW_6_PERIODIC_INSPECTION:
      // Periodic inspection of recognised institutions (Reg 11A).
      return [
        { key: 'form_periodic', label: 'Periodic Compliance Declaration (Reg 11A)', type: 'FORM', gating: false, needsValidity: false },
        { key: 'affiliation', label: 'University Affiliation (current)', type: 'AFFILIATION', gating: true, needsValidity: true },
        { key: 'compliance', label: 'Continued-Compliance Report — staff / building / equipment', type: 'COMPLIANCE', gating: false, needsValidity: false },
        { key: 'results', label: 'Latest Examination Results / Student Output', type: 'RESULTS', gating: false, needsValidity: false },
        { key: 'proforma', label: 'Inspection Proforma (Self-Assessment)', type: 'PROFORMA', gating: false, needsValidity: false, kind: 'proforma' },
      ];
    default:
      return [
        { key: 'form', label: 'Application Form', type: 'FORM', gating: false, needsValidity: false },
      ];
  }
}

/**
 * Inspection-proforma self-assessment parameters the applicant declares while
 * filing (mirrors the DCI BDS/PG proforma + Annexure I/II/III norms). The
 * compliance engine later evaluates these Required-vs-Available values.
 */
export interface ProformaField {
  key: string;
  label: string;
  section: string;
  unit: string;
  requiredValue: number;
  /** 'gte' → available must be ≥ required; 'lte' → ≤ required. */
  comparator: 'gte' | 'lte';
}

export function proformaFields(course: string, intake: number): ProformaField[] {
  const tier = proformaTier(course, intake);
  if (tier === 'PG') {
    return [
      { key: 'pg_dental_chairs', label: 'Clinical dental chairs in the department', section: 'Reg 6(i) / Annexure II', unit: 'chairs', requiredValue: 10, comparator: 'gte' },
      { key: 'pg_professors', label: 'Professors in the specialty', section: 'Annexure III (PG)', unit: 'professors', requiredValue: 1, comparator: 'gte' },
      { key: 'pg_readers', label: 'Readers in the specialty', section: 'Annexure III (PG)', unit: 'readers', requiredValue: 1, comparator: 'gte' },
      { key: 'pg_lecturers', label: 'Lecturers in the specialty', section: 'Annexure III (PG)', unit: 'lecturers', requiredValue: 2, comparator: 'gte' },
      { key: 'pg_beds', label: 'Beds available for the specialty', section: 'Annexure I', unit: 'beds', requiredValue: 30, comparator: 'gte' },
      { key: 'pg_library_area', label: 'Departmental library / seminar area', section: 'Infrastructure', unit: 'sq.ft.', requiredValue: 1200, comparator: 'gte' },
    ];
  }
  const is100 = tier === '100';
  return [
    // Land & building (Reg 6(c), Annexure II site norms)
    { key: 'land_area', label: 'Total land area earmarked', section: 'Reg 6(c) — Land', unit: 'acres', requiredValue: 5, comparator: 'gte' },
    { key: 'built_up_area_y1', label: 'Constructed area available — 1st year', section: 'Reg 6(c) — Building', unit: 'sq.ft.', requiredValue: is100 ? 60000 : 30000, comparator: 'gte' },
    { key: 'built_up_area_y3', label: 'Constructed area planned — 3rd year', section: 'Reg 6(c) — Building', unit: 'sq.ft.', requiredValue: is100 ? 100000 : 50000, comparator: 'gte' },
    // Dental equipment (Reg 6(k), Annexure II)
    { key: 'dental_chairs', label: 'Electrical dental chairs installed (by 3rd year)', section: 'Reg 6(k) / Annexure II — Chairs', unit: 'chairs', requiredValue: is100 ? 200 : 100, comparator: 'gte' },
    // Dental teaching staff (Annexure III totals from 3rd year onwards)
    { key: 'dental_professors', label: 'Dental Professors appointed', section: 'Annexure III — Dental Staff', unit: 'professors', requiredValue: 6, comparator: 'gte' },
    { key: 'dental_readers', label: 'Dental Readers appointed', section: 'Annexure III — Dental Staff', unit: 'readers', requiredValue: is100 ? 13 : 11, comparator: 'gte' },
    { key: 'dental_lecturers', label: 'Dental Lecturers appointed', section: 'Annexure III — Dental Staff', unit: 'lecturers', requiredValue: is100 ? 40 : 30, comparator: 'gte' },
    // Medical teaching staff (Annexure IV)
    { key: 'medical_faculty', label: 'Medical teaching faculty appointed', section: 'Annexure IV — Medical Staff', unit: 'faculty', requiredValue: is100 ? 31 : 26, comparator: 'gte' },
    // Attached hospital (Annexure I)
    { key: 'hospital_beds', label: 'Attached general hospital beds', section: 'Annexure I — Hospital', unit: 'beds', requiredValue: 100, comparator: 'gte' },
    { key: 'opd_census', label: 'New OPD patients per day', section: 'III. Clinical Material', unit: 'patients/day', requiredValue: is100 ? 100 : 75, comparator: 'gte' },
    // Infrastructure (proforma sections V & VII)
    { key: 'lecture_hall_area', label: 'Lecture halls total area', section: 'V. Infrastructure', unit: 'sq.ft.', requiredValue: is100 ? 6400 : 3200, comparator: 'gte' },
    { key: 'library_area', label: 'Central library area', section: 'VII. Central Library', unit: 'sq.ft.', requiredValue: is100 ? 8000 : 4500, comparator: 'gte' },
  ];
}

/** Great-circle distance (km) between two lat/lng points (Haversine). */
export function geoDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 100) / 100;
}

/** Maximum allowed site ↔ attached medical college distance (Reg 6(h)). */
export const MAX_HOSPITAL_DISTANCE_KM = 10;

/** Aggregated filing requirements for a workflow + course + intake. */
export function workflowRequirements(input: {
  workflowType: WorkflowType;
  course: string;
  intake: number;
  governmentCollege?: boolean;
}) {
  return {
    workflowType: input.workflowType,
    documents: requiredDocuments(input.workflowType),
    feeLakh: applicationFeeLakh(input.workflowType, input.governmentCollege),
    bankGuarantee: bankGuaranteeFor(input),
    statutorySchedule: statutorySchedule(input.course),
    proformaTier: proformaTier(input.course, input.intake),
    supportsPartialApproval: supportsPartialApproval(input.workflowType),
  };
}

/**
 * Statutory time-schedule (8th Amendment, 11.3.2016).
 * BDS and MDS have different milestone dates.
 */
export interface StatutorySchedule {
  course: 'BDS' | 'MDS';
  windowOpen: string;
  windowClose: string;
  recommendationBy: string;
  permissionBy: string;
}

export function statutorySchedule(course: string): StatutorySchedule {
  if (course.toUpperCase() === 'MDS') {
    return { course: 'MDS', windowOpen: '15 Mar', windowClose: '07 Apr', recommendationBy: '31 Jan', permissionBy: '28 Feb' };
  }
  return { course: 'BDS', windowOpen: '15 Jun', windowClose: '07 Jul', recommendationBy: '30 Apr', permissionBy: '31 May' };
}

/**
 * SLA offsets (calendar days from submission) for each working state.
 * Used to compute per-application statutory deadlines and breach alerts.
 */
export const SLA_OFFSET_DAYS: Partial<Record<WorkflowState, number>> = {
  [WorkflowState.SUBMITTED]: 30,
  [WorkflowState.UNDER_SCRUTINY]: 60,
  [WorkflowState.INSPECTION_SCHEDULED]: 90,
  [WorkflowState.AI_INSPECTION]: 95,
  [WorkflowState.AI_OBSERVER_REVIEW]: 100,
  [WorkflowState.ASSESSOR_REVIEW]: 110,
  [WorkflowState.EC_REVIEW]: 150,
  [WorkflowState.DEFICIENCY]: 210,
  [WorkflowState.GOVERNMENT_DECISION]: 240,
  [WorkflowState.LETTER_OF_INTENT]: 270,
  [WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION]: 300,
};

/** Compute ISO deadline strings for each working state from a submission date. */
export function computeStatutoryDeadlines(submittedAtIso: string): Record<string, string> {
  const base = new Date(submittedAtIso).getTime();
  const out: Record<string, string> = {};
  for (const [state, days] of Object.entries(SLA_OFFSET_DAYS)) {
    out[state] = new Date(base + (days as number) * 86_400_000).toISOString();
  }
  return out;
}
