/**
 * DantaDrishti design tokens.
 * Centralised semantic colour maps for roles, workflow states and risk levels.
 * Consumed by StatusPill, RoleBadge, WorkflowStepper, charts and maps.
 */

export const roleColors: Record<string, string> = {
  APPLICANT: '#0d5c5c',
  CONSULTANT: '#0f6e6e',
  SCRUTINY_OFFICER: '#6d28d9',
  CASE_OFFICER: '#1d4ed8',
  ASSESSOR: '#be185d',
  OBSERVER: '#c2410c',
  EC_MEMBER: '#15803d',
  COMPLIANCE_OFFICER: '#b45309',
  GOVERNMENT_AUTHORITY: '#1e3a8a',
  DCI_ADMIN: '#7c2d12',
  SUPER_ADMIN: '#9f1239',
  SYSTEM_ADMINISTRATOR: '#475569',
};

export const roleLabels: Record<string, string> = {
  APPLICANT: 'Applicant / Dean',
  CONSULTANT: 'Consultant',
  SCRUTINY_OFFICER: 'Scrutiny Officer',
  CASE_OFFICER: 'Case Officer',
  ASSESSOR: 'Assessor',
  OBSERVER: 'Observer',
  EC_MEMBER: 'Expert Committee',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  GOVERNMENT_AUTHORITY: 'Government Authority',
  DCI_ADMIN: 'DCI Admin',
  SUPER_ADMIN: 'Super Admin',
  SYSTEM_ADMINISTRATOR: 'System Administrator',
};

/** Ordered pipeline states for the stepper (excludes adverse terminals). */
export const workflowOrder: string[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_SCRUTINY',
  'INSPECTION_SCHEDULED',
  'AI_INSPECTION',
  'AI_OBSERVER_REVIEW',
  'ASSESSOR_REVIEW',
  'EC_REVIEW',
  'DEFICIENCY',
  'GOVERNMENT_DECISION',
  'LETTER_OF_INTENT',
  'LETTER_OF_PERMISSION_OR_RECOGNITION',
  'APPROVED',
];

export const stateColors: Record<string, string> = {
  DRAFT: '#64748b',
  SUBMITTED: '#0ea5e9',
  UNDER_SCRUTINY: '#6d28d9',
  INSPECTION_SCHEDULED: '#1d4ed8',
  AI_INSPECTION: '#0d5c5c',
  AI_OBSERVER_REVIEW: '#c2410c',
  ASSESSOR_REVIEW: '#be185d',
  EC_REVIEW: '#15803d',
  DEFICIENCY: '#b45309',
  GOVERNMENT_DECISION: '#1e3a8a',
  LETTER_OF_INTENT: '#0f766e',
  LETTER_OF_PERMISSION_OR_RECOGNITION: '#16a34a',
  APPROVED: '#15803d',
  REJECTED: '#dc2626',
  WITHDRAWN: '#ea580c',
  STOPPED: '#9f1239',
};

export const stateLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_SCRUTINY: 'Under Scrutiny',
  INSPECTION_SCHEDULED: 'Inspection Scheduled',
  AI_INSPECTION: 'AI Inspection',
  AI_OBSERVER_REVIEW: 'Observer Review',
  ASSESSOR_REVIEW: 'Assessor Review',
  EC_REVIEW: 'EC Review',
  DEFICIENCY: 'Deficiency',
  GOVERNMENT_DECISION: 'Government Decision',
  LETTER_OF_INTENT: 'Letter of Intent',
  LETTER_OF_PERMISSION_OR_RECOGNITION: 'Permission / Recognition',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  STOPPED: 'Stopped',
};

export const riskColors: Record<string, string> = {
  LOW: '#15803d',
  MEDIUM: '#d97706',
  HIGH: '#dc2626',
};

export const severityColors: Record<string, string> = {
  MINOR: '#0ea5e9',
  MAJOR: '#d97706',
  GROSS: '#dc2626',
  INTEGRITY: '#9f1239',
};

export const workflowLabels: Record<string, string> = {
  WORKFLOW_1_NEW_COLLEGE_FIRST_PG: 'New College / First PG',
  WORKFLOW_2_INCREASE_BDS_MDS_SEATS: 'Increase BDS/MDS Seats',
  WORKFLOW_3_RENEWAL_BDS_MDS: 'Renewal BDS/MDS',
  WORKFLOW_4_RECOGNITION_BDS_MDS: 'Recognition BDS/MDS',
  WORKFLOW_5_PRE_PG_INSPECTION: 'Pre-PG Inspection',
  WORKFLOW_6_PERIODIC_INSPECTION: 'Periodic Inspection',
  WORKFLOW_7_COMPLIANCE_VERIFICATION: 'Compliance Verification',
};

export const motion = {
  duration: { fast: 0.18, base: 0.32, slow: 0.6 },
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};
