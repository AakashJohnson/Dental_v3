/**
 * DantaDrishti — canonical ACTION vocabulary + RBAC action gates.
 *
 * Faithful port of the old backend `src/constants/permissions.js`. This is the
 * SINGLE source of truth for *action ownership* (who may DO what) and the
 * per-status gate (in which state an action is legal) — strictly separate from:
 *   - the workflow transition graph (domain/transitions.ts), and
 *   - data visibility / field scopes (domain/permissions.ts).
 *
 * Role keys are the new backend Role enum; the old lowercase role keys map as:
 *   applicant/college → APPLICANT · consultant → CONSULTANT
 *   scrutiny_officer → SCRUTINY_OFFICER · case_officer → CASE_OFFICER
 *   assessor/inspector → ASSESSOR · observer → OBSERVER · committee → EC_MEMBER
 *   compliance_officer → COMPLIANCE_OFFICER · govt → GOVERNMENT_AUTHORITY
 *   dci → DCI_ADMIN · admin → SUPER_ADMIN
 */
import { Role, WorkflowState } from './enums.js';
import { Application } from '../types/index.js';

/** Canonical action vocabulary (old brief §1). */
export const ACTIONS = {
  // Applicant
  APPLICATION_CREATE: 'APPLICATION_CREATE',
  APPLICATION_SUBMIT: 'APPLICATION_SUBMIT',
  CLARIFICATION_REPLY: 'CLARIFICATION_REPLY',
  COMPLIANCE_SUBMIT: 'COMPLIANCE_SUBMIT',
  LOI_ACCEPT: 'LOI_ACCEPT',
  BANK_GUARANTEE_UPLOAD: 'BANK_GUARANTEE_UPLOAD',
  // Scrutiny Officer
  SCRUTINY_REVIEW: 'SCRUTINY_REVIEW',
  SCRUTINY_CLARIFICATION_REQUEST: 'SCRUTINY_CLARIFICATION_REQUEST',
  SCRUTINY_PASS: 'SCRUTINY_PASS',
  SCRUTINY_REJECT: 'SCRUTINY_REJECT',
  // Case Officer
  INSPECTION_ASSIGN_TEAM: 'INSPECTION_ASSIGN_TEAM',
  INSPECTION_SCHEDULE: 'INSPECTION_SCHEDULE',
  INSPECTION_APPROVE_SCHEDULE: 'INSPECTION_APPROVE_SCHEDULE',
  INSPECTION_RESCHEDULE: 'INSPECTION_RESCHEDULE',
  // Assessor
  INSPECTION_START: 'INSPECTION_START',
  ASSESSOR_REPORT_REVIEW: 'ASSESSOR_REPORT_REVIEW',
  ASSESSOR_OVERRIDE: 'ASSESSOR_OVERRIDE',
  ASSESSOR_SIGN_REPORT: 'ASSESSOR_SIGN_REPORT',
  // Observer
  AI_FINDING_VERIFY: 'AI_FINDING_VERIFY',
  AI_FINDING_FLAG: 'AI_FINDING_FLAG',
  OBSERVER_SIGNOFF: 'OBSERVER_SIGNOFF',
  // Expert Committee
  EC_REVIEW_VIEW: 'EC_REVIEW_VIEW',
  EC_DECISION_RECORD: 'EC_DECISION_RECORD',
  EC_DEFICIENCY_ISSUE: 'EC_DEFICIENCY_ISSUE',
  EC_RECOMMENDATION_SIGN: 'EC_RECOMMENDATION_SIGN',
  // Compliance Officer
  COMPLIANCE_VALIDATE: 'COMPLIANCE_VALIDATE',
  COMPLIANCE_TRIGGER_REVERIFICATION: 'COMPLIANCE_TRIGGER_REVERIFICATION',
  // Government Authority
  GOVERNMENT_DECISION_RECORD: 'GOVERNMENT_DECISION_RECORD',
  LOI_ISSUE: 'LOI_ISSUE',
  LOP_ISSUE: 'LOP_ISSUE',
  ADVERSE_ORDER_RECORD: 'ADVERSE_ORDER_RECORD',
  // DCI Admin (oversight only)
  ADMIN_VIEW_ALL: 'ADMIN_VIEW_ALL',
  ADMIN_AUDIT_VIEW: 'ADMIN_AUDIT_VIEW',
  ADMIN_REOPEN_WINDOW: 'ADMIN_REOPEN_WINDOW',
  ADMIN_OVERRIDE_WITH_REASON: 'ADMIN_OVERRIDE_WITH_REASON',
} as const;
export type ActionKey = (typeof ACTIONS)[keyof typeof ACTIONS];

const A = ACTIONS;

const APPLICANT_ACTIONS: ActionKey[] = [
  A.APPLICATION_CREATE,
  A.APPLICATION_SUBMIT,
  A.CLARIFICATION_REPLY,
  A.COMPLIANCE_SUBMIT,
  A.LOI_ACCEPT,
  A.BANK_GUARANTEE_UPLOAD,
];

const DCI_ADMIN_OVERSIGHT: ActionKey[] = [
  A.ADMIN_VIEW_ALL,
  A.ADMIN_AUDIT_VIEW,
  A.ADMIN_REOPEN_WINDOW,
  A.ADMIN_OVERRIDE_WITH_REASON,
];

/**
 * DCI Secretariat / Super Admin are a FULL super-role: they own every action so
 * a single DCI login can drive the entire pipeline. The per-status gate still
 * applies, so each action is only legal in its correct state.
 */
const DCI_SUPER_ACTIONS: ActionKey[] = Object.values(ACTIONS);

export const ROLE_ACTIONS: Record<string, ActionKey[]> = {
  [Role.APPLICANT]: APPLICANT_ACTIONS,
  [Role.CONSULTANT]: APPLICANT_ACTIONS,

  [Role.SCRUTINY_OFFICER]: [
    A.SCRUTINY_REVIEW,
    A.SCRUTINY_CLARIFICATION_REQUEST,
    A.SCRUTINY_PASS,
    A.SCRUTINY_REJECT,
  ],

  [Role.CASE_OFFICER]: [
    A.INSPECTION_ASSIGN_TEAM,
    A.INSPECTION_SCHEDULE,
    A.INSPECTION_APPROVE_SCHEDULE,
    A.INSPECTION_RESCHEDULE,
  ],

  [Role.ASSESSOR]: [
    A.INSPECTION_START,
    A.ASSESSOR_REPORT_REVIEW,
    A.ASSESSOR_OVERRIDE,
    A.ASSESSOR_SIGN_REPORT,
  ],

  [Role.OBSERVER]: [A.AI_FINDING_VERIFY, A.AI_FINDING_FLAG, A.OBSERVER_SIGNOFF],

  [Role.EC_MEMBER]: [
    A.EC_REVIEW_VIEW,
    A.EC_DECISION_RECORD,
    A.EC_DEFICIENCY_ISSUE,
    A.EC_RECOMMENDATION_SIGN,
  ],

  [Role.COMPLIANCE_OFFICER]: [A.COMPLIANCE_VALIDATE, A.COMPLIANCE_TRIGGER_REVERIFICATION],

  [Role.GOVERNMENT_AUTHORITY]: [
    A.GOVERNMENT_DECISION_RECORD,
    A.LOI_ISSUE,
    A.LOP_ISSUE,
    A.ADVERSE_ORDER_RECORD,
  ],

  [Role.DCI_ADMIN]: DCI_SUPER_ACTIONS,
  [Role.SUPER_ADMIN]: DCI_SUPER_ACTIONS,
  [Role.SYSTEM_ADMINISTRATOR]: DCI_ADMIN_OVERSIGHT,
};

/**
 * Workflow-transition gate: which application state(s) an action is legal in.
 * `'*'` = any status · `null` = not application-scoped (a global action).
 */
export const ACTION_STATUS: Record<ActionKey, WorkflowState[] | '*' | null> = {
  [A.APPLICATION_CREATE]: null,
  [A.APPLICATION_SUBMIT]: [WorkflowState.DRAFT],
  [A.CLARIFICATION_REPLY]: [WorkflowState.UNDER_SCRUTINY],
  [A.COMPLIANCE_SUBMIT]: [WorkflowState.DEFICIENCY],
  [A.LOI_ACCEPT]: [WorkflowState.LETTER_OF_INTENT],
  [A.BANK_GUARANTEE_UPLOAD]: [WorkflowState.LETTER_OF_INTENT],

  [A.SCRUTINY_REVIEW]: [WorkflowState.UNDER_SCRUTINY],
  [A.SCRUTINY_CLARIFICATION_REQUEST]: [WorkflowState.UNDER_SCRUTINY],
  [A.SCRUTINY_PASS]: [WorkflowState.UNDER_SCRUTINY],
  [A.SCRUTINY_REJECT]: [WorkflowState.UNDER_SCRUTINY],

  [A.INSPECTION_SCHEDULE]: [WorkflowState.UNDER_SCRUTINY, WorkflowState.INSPECTION_SCHEDULED],
  [A.INSPECTION_ASSIGN_TEAM]: [WorkflowState.INSPECTION_SCHEDULED],
  [A.INSPECTION_APPROVE_SCHEDULE]: [WorkflowState.INSPECTION_SCHEDULED],
  [A.INSPECTION_RESCHEDULE]: [WorkflowState.INSPECTION_SCHEDULED],

  [A.INSPECTION_START]: [WorkflowState.INSPECTION_SCHEDULED],
  [A.ASSESSOR_REPORT_REVIEW]: [WorkflowState.ASSESSOR_REVIEW],
  [A.ASSESSOR_OVERRIDE]: [WorkflowState.ASSESSOR_REVIEW],
  [A.ASSESSOR_SIGN_REPORT]: [WorkflowState.ASSESSOR_REVIEW],

  [A.AI_FINDING_VERIFY]: [WorkflowState.AI_OBSERVER_REVIEW],
  [A.AI_FINDING_FLAG]: [WorkflowState.AI_OBSERVER_REVIEW],
  [A.OBSERVER_SIGNOFF]: [WorkflowState.AI_OBSERVER_REVIEW],

  [A.EC_REVIEW_VIEW]: [WorkflowState.EC_REVIEW],
  [A.EC_DECISION_RECORD]: [WorkflowState.EC_REVIEW],
  [A.EC_DEFICIENCY_ISSUE]: [WorkflowState.EC_REVIEW],
  [A.EC_RECOMMENDATION_SIGN]: [WorkflowState.EC_REVIEW],

  [A.COMPLIANCE_VALIDATE]: [WorkflowState.DEFICIENCY],
  [A.COMPLIANCE_TRIGGER_REVERIFICATION]: [WorkflowState.DEFICIENCY],

  [A.GOVERNMENT_DECISION_RECORD]: [WorkflowState.GOVERNMENT_DECISION],
  [A.LOI_ISSUE]: [WorkflowState.GOVERNMENT_DECISION],
  [A.LOP_ISSUE]: [
    WorkflowState.LETTER_OF_INTENT,
    WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION,
  ],
  [A.ADVERSE_ORDER_RECORD]: [WorkflowState.GOVERNMENT_DECISION],

  [A.ADMIN_VIEW_ALL]: '*',
  [A.ADMIN_AUDIT_VIEW]: '*',
  [A.ADMIN_OVERRIDE_WITH_REASON]: '*',
  [A.ADMIN_REOPEN_WINDOW]: [WorkflowState.DEFICIENCY],
};

/** Role-work actions a DCI admin may perform ONLY via explicit, reasoned override. */
export const ADMIN_OVERRIDABLE: ActionKey[] = Object.values(ACTIONS).filter(
  (a) => !a.startsWith('ADMIN_') && a !== ACTIONS.APPLICATION_CREATE,
);

const DCI_ADMIN_ROLES: string[] = [Role.DCI_ADMIN, Role.SUPER_ADMIN];
export const isDciAdmin = (role?: string): boolean => !!role && DCI_ADMIN_ROLES.includes(role);

export interface ActionContext {
  adminOverride?: boolean;
  overrideReason?: string;
}

/** Data-visibility sections each role may SEE (old VISIBLE_SECTIONS). */
const FULL_OVERSIGHT_SECTIONS = [
  'details',
  'timeline',
  'documents',
  'deficiencySummary',
  'inspectionSchedule',
  'ecRecommendation',
  'auditLog',
];
export const VISIBLE_SECTIONS: Record<string, string[]> = {
  [Role.DCI_ADMIN]: FULL_OVERSIGHT_SECTIONS,
  [Role.SUPER_ADMIN]: FULL_OVERSIGHT_SECTIONS,
  [Role.APPLICANT]: ['details', 'timeline', 'documents', 'deficiencySummary', 'ecRecommendation'],
  [Role.CONSULTANT]: ['details', 'timeline', 'documents', 'deficiencySummary'],
  [Role.SCRUTINY_OFFICER]: ['details', 'timeline', 'documents', 'deficiencySummary'],
  [Role.CASE_OFFICER]: ['details', 'timeline', 'documents', 'inspectionSchedule', 'deficiencySummary'],
  [Role.ASSESSOR]: ['details', 'inspectionSchedule', 'deficiencySummary'],
  [Role.OBSERVER]: ['inspectionSchedule'],
  [Role.EC_MEMBER]: ['details', 'timeline', 'deficiencySummary', 'ecRecommendation', 'inspectionSchedule'],
  [Role.COMPLIANCE_OFFICER]: ['details', 'timeline', 'deficiencySummary'],
  [Role.GOVERNMENT_AUTHORITY]: ['details', 'timeline', 'ecRecommendation', 'deficiencySummary'],
  [Role.SYSTEM_ADMINISTRATOR]: ['details', 'auditLog'],
};

export function visibleSectionsFor(role?: string): string[] {
  return (role && VISIBLE_SECTIONS[role]) || ['details'];
}

/** Contextual blockers layered on top of (role + status). Returns a reason or null. */
export function contextualBlock(action: ActionKey, application?: Application | null): string | null {
  if (!application) return null;
  const decided = !!application.ecDecision;
  if (
    decided &&
    ([A.EC_DECISION_RECORD, A.EC_DEFICIENCY_ISSUE, A.EC_RECOMMENDATION_SIGN] as ActionKey[]).includes(
      action,
    )
  ) {
    return 'An EC decision has already been recorded for this application.';
  }
  return null;
}

function statusOk(action: ActionKey, application?: Application | null): boolean {
  if (!application) return true; // non-app-scoped checks
  const gate = ACTION_STATUS[action];
  if (gate == null) return true; // not application-scoped
  if (gate === '*') return true; // any status
  return gate.includes(application.state);
}

/** An override is "explicit" only with adminOverride + a non-empty reason. */
export function isExplicitAdminOverride(action: ActionKey, ctx: ActionContext = {}): boolean {
  return (
    !!ctx.adminOverride &&
    typeof ctx.overrideReason === 'string' &&
    ctx.overrideReason.trim().length > 0 &&
    ADMIN_OVERRIDABLE.includes(action)
  );
}

export interface ActorLike {
  role: Role | string;
}

/**
 * THE single action gate. A role must OWN the action AND be in a legal state.
 * DCI admins auto-pass only their own ADMIN_* actions, or role-work through a
 * reasoned override.
 */
export function canPerformAction(
  user: ActorLike | null | undefined,
  action: ActionKey,
  application: Application | null = null,
  ctx: ActionContext = {},
): boolean {
  if (!user || !action) return false;
  const role = user.role;
  const owns = (ROLE_ACTIONS[role] || []).includes(action);

  if (!owns) {
    if (isDciAdmin(role) && action.startsWith('ADMIN_') && (ROLE_ACTIONS[role] || []).includes(action)) {
      return statusOk(action, application);
    }
    if (isDciAdmin(role) && isExplicitAdminOverride(action, ctx)) {
      return statusOk(action, application) && !contextualBlock(action, application);
    }
    return false;
  }

  if (!statusOk(action, application)) return false;
  if (contextualBlock(action, application)) return false;
  return true;
}

/** The action list the frontend renders buttons from (application-scoped only). */
export function computeAllowedActions(
  user: ActorLike | null | undefined,
  application: Application | null,
  ctx: ActionContext = {},
): ActionKey[] {
  if (!user) return [];
  const out: ActionKey[] = [];
  for (const action of Object.values(ACTIONS)) {
    if (ACTION_STATUS[action] == null) continue; // skip non-app-scoped actions
    if (canPerformAction(user, action, application, ctx)) out.push(action);
  }
  return out;
}

export function canCreateApplication(user: ActorLike | null | undefined): boolean {
  return canPerformAction(user, ACTIONS.APPLICATION_CREATE, null);
}

export interface ActionEnvelope {
  applicationId?: string;
  currentStatus?: WorkflowState;
  workflowType?: string;
  viewerRole?: string;
  allowedActions: ActionKey[];
  visibleSections: string[];
  nextAction: ActionKey | null;
  blockedReason: string | null;
}

/** The server response envelope (old brief §3). */
export function buildActionEnvelope(
  user: ActorLike | null | undefined,
  application: Application | null,
  ctx: ActionContext = {},
): ActionEnvelope {
  const allowedActions = computeAllowedActions(user, application, ctx);
  return {
    applicationId: application?.id,
    currentStatus: application?.state,
    workflowType: application?.workflowType,
    viewerRole: user?.role,
    allowedActions,
    visibleSections: visibleSectionsFor(user?.role),
    nextAction: allowedActions[0] || null,
    blockedReason: null,
  };
}
