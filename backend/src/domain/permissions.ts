/**
 * DantaDrishti — RBAC permission map, workflow eligibility guards,
 * and role-scoped field visibility.
 *
 * Source of truth: 04_Roles_RACI_Permissions.md
 *
 * Three layers are enforced from this file:
 *  1. PERMISSIONS  — capability gating (what API actions a role may call)
 *  2. WORKFLOW_ELIGIBILITY — which workflow types a college may start
 *  3. APPLICATION_FIELD_SCOPES — which application fields a role may read
 */
import { CollegeStatus, Role, WorkflowType } from './enums.js';

/** Capability keys checked by RBAC middleware. */
export type Permission =
  | 'application:create'
  | 'application:read:own'
  | 'application:read:scoped'
  | 'application:read:full'
  | 'application:submit'
  | 'application:transition'
  | 'scrutiny:work'
  | 'inspection:schedule'
  | 'inspection:capture'
  | 'observer:verify'
  | 'assessor:review'
  | 'ec:decide'
  | 'compliance:work'
  | 'government:decide'
  | 'admin:manage'
  | 'reports:view'
  | 'audit:view';

const ALL: Permission[] = [
  'application:create',
  'application:read:full',
  'application:read:scoped',
  'application:read:own',
  'application:submit',
  'application:transition',
  'scrutiny:work',
  'inspection:schedule',
  'inspection:capture',
  'observer:verify',
  'assessor:review',
  'ec:decide',
  'compliance:work',
  'government:decide',
  'admin:manage',
  'reports:view',
  'audit:view',
];

export const PERMISSIONS: Record<Role, Permission[]> = {
  [Role.APPLICANT]: [
    'application:create',
    'application:read:own',
    'application:submit',
    'application:transition',
  ],
  [Role.CONSULTANT]: [
    'application:create',
    'application:read:own',
    'application:submit',
    'application:transition',
  ],
  [Role.SCRUTINY_OFFICER]: ['application:read:scoped', 'scrutiny:work', 'application:transition'],
  [Role.CASE_OFFICER]: [
    'application:read:scoped',
    'inspection:schedule',
    'application:transition',
    'reports:view',
  ],
  [Role.ASSESSOR]: [
    'application:read:scoped',
    'inspection:capture',
    'assessor:review',
    'application:transition',
  ],
  [Role.OBSERVER]: ['application:read:scoped', 'observer:verify', 'application:transition'],
  [Role.EC_MEMBER]: ['application:read:scoped', 'ec:decide', 'application:transition'],
  [Role.COMPLIANCE_OFFICER]: [
    'application:read:scoped',
    'compliance:work',
    'application:transition',
  ],
  [Role.GOVERNMENT_AUTHORITY]: [
    'application:read:full',
    'government:decide',
    'application:transition',
    'reports:view',
  ],
  [Role.DCI_ADMIN]: ALL,
  [Role.SUPER_ADMIN]: ALL,
  [Role.SYSTEM_ADMINISTRATOR]: ['admin:manage', 'reports:view', 'audit:view'],
};

export function hasPermission(role: Role, perm: Permission): boolean {
  return (PERMISSIONS[role] ?? []).includes(perm);
}

/**
 * Workflow eligibility guards.
 * New/unregistered institutions can only access Workflow 1.
 * Existing colleges (REGISTERED/APPROVED/RECOGNIZED) access Workflow 2–6.
 * Workflow 7 is SYSTEM-CREATED ONLY and never user-selectable.
 */
export const SYSTEM_ONLY_WORKFLOWS: WorkflowType[] = [
  WorkflowType.WORKFLOW_7_COMPLIANCE_VERIFICATION,
];

const EXISTING_STATUSES: CollegeStatus[] = [
  CollegeStatus.REGISTERED,
  CollegeStatus.APPROVED,
  CollegeStatus.RECOGNIZED,
];

export interface EligibilityResult {
  allowed: boolean;
  reason?: string;
}

export function checkWorkflowEligibility(
  workflow: WorkflowType,
  collegeStatus: CollegeStatus,
  systemInitiated = false,
): EligibilityResult {
  if (SYSTEM_ONLY_WORKFLOWS.includes(workflow) && !systemInitiated) {
    return {
      allowed: false,
      reason: 'Workflow 7 (Compliance Verification) is system-generated only and cannot be selected manually.',
    };
  }

  // System-initiated Workflow 7 is always allowed regardless of college status
  // (it re-checks an existing application's outstanding deficiencies).
  if (SYSTEM_ONLY_WORKFLOWS.includes(workflow) && systemInitiated) {
    return { allowed: true };
  }

  if (workflow === WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG) {
    if (collegeStatus !== CollegeStatus.NEW) {
      return {
        allowed: false,
        reason: 'Workflow 1 is only for new/unregistered institutions.',
      };
    }
    return { allowed: true };
  }

  // Workflows 2–6 require an existing/registered/approved/recognized college.
  if (!EXISTING_STATUSES.includes(collegeStatus)) {
    return {
      allowed: false,
      reason: 'Only existing registered/approved/recognized colleges can access Workflows 2–6.',
    };
  }
  return { allowed: true };
}

export function selectableWorkflows(collegeStatus: CollegeStatus): WorkflowType[] {
  return Object.values(WorkflowType).filter((wf) => {
    if (SYSTEM_ONLY_WORKFLOWS.includes(wf)) return false;
    return checkWorkflowEligibility(wf, collegeStatus, false).allowed;
  });
}

/**
 * Role-scoped application field visibility.
 * Backend serializers project ONLY these fields for a given role.
 * `'*'` means full object. Roles not listed fall back to a minimal scope.
 */
export const APPLICATION_FIELD_SCOPES: Record<Role, string[] | '*'> = {
  // Owner applicant / linked consultant / platform admins see the full record.
  [Role.APPLICANT]: '*',
  [Role.CONSULTANT]: '*',
  [Role.DCI_ADMIN]: '*',
  [Role.SUPER_ADMIN]: '*',
  // Government Authority is NOT full: only the statutory-decision surface.
  [Role.GOVERNMENT_AUTHORITY]: [
    'id',
    'code',
    'workflowType',
    'applicationType',
    'state',
    'course',
    'specialty',
    'intake',
    'ecDecision',
    'ecRationale',
    'suggestedDecision',
    'riskScore',
    'riskLevel',
    'deficiencyList',
    'assessorSummary',
    'bankGuaranteeVerified',
    'bankGuarantee',
    'undertaking',
    'intakeCap',
    'approvedIntake',
    'createdAt',
    'updatedAt',
  ],
  [Role.SCRUTINY_OFFICER]: [
    'id',
    'code',
    'workflowType',
    'applicationType',
    'state',
    'checklist',
    'eligibility',
    'statutoryDocuments',
    'completeness',
    'documents',
    'feePaid',
    'feeLakh',
    'scrutinyGates',
    'statutoryDeadlines',
    'createdAt',
    'updatedAt',
  ],
  [Role.CASE_OFFICER]: [
    'id',
    'code',
    'workflowType',
    'applicationType',
    'state',
    'location',
    'specialty',
    'intake',
    'course',
    'scheduling',
    'statutoryDeadlines',
    'createdAt',
    'updatedAt',
  ],
  [Role.ASSESSOR]: [
    'id',
    'code',
    'workflowType',
    'applicationType',
    'state',
    'course',
    'specialty',
    'intake',
    'location',
    'checklist',
    'evidenceSections',
    'evidenceLinks',
    'aiFindingsSummary',
    'assessorSummary',
    'createdAt',
    'updatedAt',
  ],
  [Role.OBSERVER]: [
    'id',
    'code',
    'workflowType',
    'state',
    'location',
    'evidenceSections',
    'evidenceLinks',
    'aiFindingsSummary',
    'createdAt',
    'updatedAt',
  ],
  [Role.EC_MEMBER]: [
    'id',
    'code',
    'workflowType',
    'state',
    'course',
    'intake',
    'deficiencyList',
    'riskScore',
    'riskLevel',
    'suggestedDecision',
    'ecDecision',
    'evidenceLinks',
    'assessorSummary',
    'complianceDelta',
    'createdAt',
    'updatedAt',
  ],
  [Role.COMPLIANCE_OFFICER]: [
    'id',
    'code',
    'workflowType',
    'state',
    'sourceApplicationId',
    'deficiencyList',
    'applicantReplies',
    'complianceEvidence',
    'complianceDelta',
    'createdAt',
    'updatedAt',
  ],
  [Role.SYSTEM_ADMINISTRATOR]: ['id', 'code', 'workflowType', 'state', 'createdAt'],
};
