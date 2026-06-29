/**
 * DantaDrishti — Canonical domain enums.
 * Single source of truth for workflow states, roles, workflow types,
 * EC decision vocabulary, severities and AI finding statuses.
 *
 * Derived from:
 *  - 03_Workflow_and_State_Machine.md   (states / transitions)
 *  - 04_Roles_RACI_Permissions.md       (roles)
 *  - 06_Compliance_Engine_and_DantaDrishti_AI.md (findings / severity / risk)
 */

/** Canonical application workflow states. */
export const WorkflowState = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_SCRUTINY: 'UNDER_SCRUTINY',
  INSPECTION_SCHEDULED: 'INSPECTION_SCHEDULED',
  AI_INSPECTION: 'AI_INSPECTION',
  AI_OBSERVER_REVIEW: 'AI_OBSERVER_REVIEW',
  ASSESSOR_REVIEW: 'ASSESSOR_REVIEW',
  EC_REVIEW: 'EC_REVIEW',
  DEFICIENCY: 'DEFICIENCY',
  GOVERNMENT_DECISION: 'GOVERNMENT_DECISION',
  LETTER_OF_INTENT: 'LETTER_OF_INTENT',
  LETTER_OF_PERMISSION_OR_RECOGNITION: 'LETTER_OF_PERMISSION_OR_RECOGNITION',
  APPROVED: 'APPROVED',
  // Terminal adverse states
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  STOPPED: 'STOPPED',
} as const;
export type WorkflowState = (typeof WorkflowState)[keyof typeof WorkflowState];

export const TERMINAL_STATES: WorkflowState[] = [
  WorkflowState.APPROVED,
  WorkflowState.REJECTED,
  WorkflowState.WITHDRAWN,
  WorkflowState.STOPPED,
];

/** Roles — single source of truth for RBAC (04_Roles_RACI_Permissions.md). */
export const Role = {
  APPLICANT: 'APPLICANT',
  CONSULTANT: 'CONSULTANT',
  CASE_OFFICER: 'CASE_OFFICER',
  SCRUTINY_OFFICER: 'SCRUTINY_OFFICER',
  ASSESSOR: 'ASSESSOR',
  OBSERVER: 'OBSERVER',
  EC_MEMBER: 'EC_MEMBER',
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
  GOVERNMENT_AUTHORITY: 'GOVERNMENT_AUTHORITY',
  DCI_ADMIN: 'DCI_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  SYSTEM_ADMINISTRATOR: 'SYSTEM_ADMINISTRATOR',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** The seven canonical workflow types. */
export const WorkflowType = {
  WORKFLOW_1_NEW_COLLEGE_FIRST_PG: 'WORKFLOW_1_NEW_COLLEGE_FIRST_PG',
  WORKFLOW_2_INCREASE_BDS_MDS_SEATS: 'WORKFLOW_2_INCREASE_BDS_MDS_SEATS',
  WORKFLOW_3_RENEWAL_BDS_MDS: 'WORKFLOW_3_RENEWAL_BDS_MDS',
  WORKFLOW_4_RECOGNITION_BDS_MDS: 'WORKFLOW_4_RECOGNITION_BDS_MDS',
  WORKFLOW_5_PRE_PG_INSPECTION: 'WORKFLOW_5_PRE_PG_INSPECTION',
  WORKFLOW_6_PERIODIC_INSPECTION: 'WORKFLOW_6_PERIODIC_INSPECTION',
  WORKFLOW_7_COMPLIANCE_VERIFICATION: 'WORKFLOW_7_COMPLIANCE_VERIFICATION',
} as const;
export type WorkflowType = (typeof WorkflowType)[keyof typeof WorkflowType];

/** College registration status — used for workflow eligibility guards. */
export const CollegeStatus = {
  NEW: 'NEW',
  REGISTERED: 'REGISTERED',
  APPROVED: 'APPROVED',
  RECOGNIZED: 'RECOGNIZED',
  WITHDRAWN: 'WITHDRAWN',
  STOPPED: 'STOPPED',
} as const;
export type CollegeStatus = (typeof CollegeStatus)[keyof typeof CollegeStatus];

/** EC decision vocabulary — free text is NEVER a decision. */
export const ECDecision = {
  APPROVE: 'APPROVE',
  APPROVE_ON_UNDERTAKING: 'APPROVE_ON_UNDERTAKING',
  ASK_COMPLIANCE: 'ASK_COMPLIANCE',
  NOT_GRANTED_TILL_DEFICIENCIES_RECTIFIED: 'NOT_GRANTED_TILL_DEFICIENCIES_RECTIFIED',
  PARTIAL_APPROVAL_OR_RESTRAIN_CAPACITY: 'PARTIAL_APPROVAL_OR_RESTRAIN_CAPACITY',
  REFUSE: 'REFUSE',
  WITHDRAW_OR_STOP_ADMISSION: 'WITHDRAW_OR_STOP_ADMISSION',
} as const;
export type ECDecision = (typeof ECDecision)[keyof typeof ECDecision];

/** Workflow transition actions (canonical verbs used in audit log). */
export const WorkflowAction = {
  SUBMIT: 'SUBMIT',
  RETURN_INCOMPLETE: 'RETURN_INCOMPLETE',
  START_SCRUTINY: 'START_SCRUTINY',
  REQUEST_CLARIFICATION: 'REQUEST_CLARIFICATION',
  SCHEDULE_INSPECTION: 'SCHEDULE_INSPECTION',
  REJECT_INELIGIBLE: 'REJECT_INELIGIBLE',
  START_AI_INSPECTION: 'START_AI_INSPECTION',
  SEND_TO_OBSERVER: 'SEND_TO_OBSERVER',
  OBSERVER_SIGNOFF: 'OBSERVER_SIGNOFF',
  SUBMIT_ASSESSOR_REPORT: 'SUBMIT_ASSESSOR_REPORT',
  EC_ASK_COMPLIANCE: 'EC_ASK_COMPLIANCE',
  EC_RECOMMEND: 'EC_RECOMMEND',
  COMPLIANCE_REVERIFY: 'COMPLIANCE_REVERIFY',
  GOV_ISSUE_LOI: 'GOV_ISSUE_LOI',
  GOV_ADVERSE: 'GOV_ADVERSE',
  ISSUE_LOP: 'ISSUE_LOP',
  MARK_APPROVED: 'MARK_APPROVED',
} as const;
export type WorkflowAction = (typeof WorkflowAction)[keyof typeof WorkflowAction];

/** Deficiency / finding severity. */
export const Severity = {
  MINOR: 'MINOR',
  MAJOR: 'MAJOR',
  GROSS: 'GROSS',
  INTEGRITY: 'INTEGRITY',
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const RiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

/** AI finding lifecycle status. */
export const FindingStatus = {
  PENDING_OBSERVER_REVIEW: 'PENDING_OBSERVER_REVIEW',
  ACCEPTED: 'ACCEPTED',
  FLAGGED: 'FLAGGED',
  NEEDS_HUMAN_REVIEW: 'NEEDS_HUMAN_REVIEW',
  QUARANTINED: 'QUARANTINED',
  OVERRIDDEN: 'OVERRIDDEN',
  FINALIZED: 'FINALIZED',
} as const;
export type FindingStatus = (typeof FindingStatus)[keyof typeof FindingStatus];

/** Compliance verdicts. */
export const ComplianceVerdict = {
  COMPLIANT: 'COMPLIANT',
  DEFICIENT: 'DEFICIENT',
  NEEDS_HUMAN_REVIEW: 'NEEDS_HUMAN_REVIEW',
} as const;
export type ComplianceVerdict = (typeof ComplianceVerdict)[keyof typeof ComplianceVerdict];

export const RULE_TYPES = [
  'numeric',
  'count',
  'boolean',
  'validity_date',
  'ratio',
  'presence',
  'cross_entity',
] as const;
export type RuleType = (typeof RULE_TYPES)[number];

/** AI detection categories supported by the inspection service. */
export const DetectionCategory = {
  DENTAL_CHAIRS: 'dental_chairs_count',
  HOSPITAL_BEDS: 'hospital_beds_count',
  WARD_OCCUPANCY: 'ward_occupancy',
  OPD_CENSUS: 'opd_patient_census',
  DEPARTMENT_EQUIPMENT: 'department_equipment_presence',
  LIBRARY: 'library_books_journals_seating',
  ROOM_AREA: 'room_lecture_hall_area',
  LAB_EQUIPMENT: 'lab_equipment',
  CONSTRUCTION: 'building_floor_under_construction',
  CCTV: 'cctv_presence',
  BIOMETRIC: 'biometric_device_presence',
  FACULTY_ATTENDANCE: 'faculty_attendance',
  GEO_DISTANCE: 'geo_distance_validation',
  FIRE_AERB_STP: 'fire_aerb_stp_biowaste_evidence',
  CENSUS_MISMATCH: 'census_mismatch',
  GHOST_FACULTY: 'ghost_faculty_duplicate_check',
} as const;
export type DetectionCategory = (typeof DetectionCategory)[keyof typeof DetectionCategory];
