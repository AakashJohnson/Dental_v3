/**
 * DantaDrishti — Workflow transition matrix.
 * The ONLY source of allowed state transitions. The workflow engine
 * consults this table; no controller may bypass it.
 *
 * Source of truth: 03_Workflow_and_State_Machine.md
 */
import { Role, WorkflowAction, WorkflowState } from './enums.js';

export interface TransitionDef {
  from: WorkflowState;
  to: WorkflowState;
  action: WorkflowAction;
  /** Roles permitted to perform this transition. */
  roles: Role[];
  /** Human description shown in role guidance / audit. */
  description: string;
}

export const TRANSITIONS: TransitionDef[] = [
  {
    from: WorkflowState.DRAFT,
    to: WorkflowState.SUBMITTED,
    action: WorkflowAction.SUBMIT,
    roles: [Role.APPLICANT, Role.CONSULTANT],
    description: 'Applicant submits the completed application.',
  },
  {
    from: WorkflowState.SUBMITTED,
    to: WorkflowState.DRAFT,
    action: WorkflowAction.RETURN_INCOMPLETE,
    roles: [Role.CASE_OFFICER, Role.GOVERNMENT_AUTHORITY],
    description: 'Application returned to applicant as incomplete.',
  },
  {
    from: WorkflowState.SUBMITTED,
    to: WorkflowState.UNDER_SCRUTINY,
    action: WorkflowAction.START_SCRUTINY,
    roles: [Role.APPLICANT, Role.CONSULTANT, Role.CASE_OFFICER, Role.GOVERNMENT_AUTHORITY],
    description: 'Submitted package forwarded into technical scrutiny.',
  },
  {
    from: WorkflowState.SUBMITTED,
    to: WorkflowState.REJECTED,
    action: WorkflowAction.REJECT_INELIGIBLE,
    roles: [Role.CASE_OFFICER, Role.GOVERNMENT_AUTHORITY, Role.SCRUTINY_OFFICER],
    description: 'Application rejected at intake as ineligible.',
  },
  {
    from: WorkflowState.UNDER_SCRUTINY,
    to: WorkflowState.UNDER_SCRUTINY,
    action: WorkflowAction.REQUEST_CLARIFICATION,
    roles: [Role.SCRUTINY_OFFICER],
    description: 'Clarification requested from applicant (scrutiny loop).',
  },
  {
    from: WorkflowState.UNDER_SCRUTINY,
    to: WorkflowState.INSPECTION_SCHEDULED,
    action: WorkflowAction.SCHEDULE_INSPECTION,
    roles: [Role.SCRUTINY_OFFICER, Role.CASE_OFFICER, Role.ASSESSOR],
    description: 'Scrutiny passed; inspection scheduled with team & observer.',
  },
  {
    from: WorkflowState.UNDER_SCRUTINY,
    to: WorkflowState.REJECTED,
    action: WorkflowAction.REJECT_INELIGIBLE,
    roles: [Role.SCRUTINY_OFFICER, Role.CASE_OFFICER],
    description: 'Application rejected as ineligible at scrutiny.',
  },
  {
    from: WorkflowState.INSPECTION_SCHEDULED,
    to: WorkflowState.AI_INSPECTION,
    action: WorkflowAction.START_AI_INSPECTION,
    roles: [Role.ASSESSOR],
    description: 'On-site AI inspection capture begins.',
  },
  {
    from: WorkflowState.AI_INSPECTION,
    to: WorkflowState.AI_OBSERVER_REVIEW,
    action: WorkflowAction.SEND_TO_OBSERVER,
    roles: [Role.ASSESSOR, Role.OBSERVER],
    description: 'AI findings generated; routed to observer verification.',
  },
  {
    from: WorkflowState.AI_OBSERVER_REVIEW,
    to: WorkflowState.ASSESSOR_REVIEW,
    action: WorkflowAction.OBSERVER_SIGNOFF,
    roles: [Role.OBSERVER],
    description: 'Observer dispositioned every finding & signed off.',
  },
  {
    from: WorkflowState.ASSESSOR_REVIEW,
    to: WorkflowState.EC_REVIEW,
    action: WorkflowAction.SUBMIT_ASSESSOR_REPORT,
    roles: [Role.ASSESSOR],
    description: 'Dual-signed joint assessment report submitted to EC.',
  },
  {
    from: WorkflowState.EC_REVIEW,
    to: WorkflowState.DEFICIENCY,
    action: WorkflowAction.EC_ASK_COMPLIANCE,
    roles: [Role.EC_MEMBER],
    description: 'EC asks for compliance; deficiency letter issued.',
  },
  {
    from: WorkflowState.EC_REVIEW,
    to: WorkflowState.GOVERNMENT_DECISION,
    action: WorkflowAction.EC_RECOMMEND,
    roles: [Role.EC_MEMBER],
    description: 'EC records recommendation; routed to Government.',
  },
  {
    from: WorkflowState.DEFICIENCY,
    to: WorkflowState.INSPECTION_SCHEDULED,
    action: WorkflowAction.COMPLIANCE_REVERIFY,
    roles: [Role.COMPLIANCE_OFFICER],
    description: 'Compliance submitted & validated; re-verification scheduled.',
  },
  {
    from: WorkflowState.GOVERNMENT_DECISION,
    to: WorkflowState.LETTER_OF_INTENT,
    action: WorkflowAction.GOV_ISSUE_LOI,
    roles: [Role.GOVERNMENT_AUTHORITY],
    description: 'Government issues Letter of Intent.',
  },
  {
    from: WorkflowState.GOVERNMENT_DECISION,
    to: WorkflowState.REJECTED,
    action: WorkflowAction.GOV_ADVERSE,
    roles: [Role.GOVERNMENT_AUTHORITY],
    description: 'Government refuses the application.',
  },
  {
    from: WorkflowState.GOVERNMENT_DECISION,
    to: WorkflowState.WITHDRAWN,
    action: WorkflowAction.GOV_ADVERSE,
    roles: [Role.GOVERNMENT_AUTHORITY],
    description: 'Government withdraws approval (adverse, with hearing hook).',
  },
  {
    from: WorkflowState.GOVERNMENT_DECISION,
    to: WorkflowState.STOPPED,
    action: WorkflowAction.GOV_ADVERSE,
    roles: [Role.GOVERNMENT_AUTHORITY],
    description: 'Government stops admissions (adverse, with hearing hook).',
  },
  {
    from: WorkflowState.LETTER_OF_INTENT,
    to: WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION,
    action: WorkflowAction.ISSUE_LOP,
    roles: [Role.GOVERNMENT_AUTHORITY],
    description: 'Conditions accepted & bank guarantee verified; LOP/Recognition issued.',
  },
  {
    from: WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION,
    to: WorkflowState.APPROVED,
    action: WorkflowAction.MARK_APPROVED,
    roles: [Role.GOVERNMENT_AUTHORITY],
    description: 'Application marked Approved.',
  },
];

/**
 * SUPERUSER roles may drive any edge (oversight). The synthetic 'SYSTEM' actor
 * (used by automated reopen / spawn flows) is also a superuser.
 */
export const SUPERUSER_ROLES: (Role | 'SYSTEM')[] = [
  Role.DCI_ADMIN,
  Role.SUPER_ADMIN,
  'SYSTEM',
];

/**
 * Edge → roles map (old backend TRANSITION_ROLES). Derived from TRANSITIONS so
 * the role-ownership table and the state machine can never drift apart.
 */
export const TRANSITION_ROLES: Record<string, Role[]> = TRANSITIONS.reduce(
  (acc, t) => {
    const key = `${t.from} -> ${t.to}`;
    acc[key] = Array.from(new Set([...(acc[key] ?? []), ...t.roles]));
    return acc;
  },
  {} as Record<string, Role[]>,
);

/** Pure role guard for an edge: may `actorRole` drive `from -> to`? */
export function actorMayTransition(
  actorRole: Role | 'SYSTEM' | string,
  from: WorkflowState,
  to: WorkflowState,
): boolean {
  if (from === to) return true; // idempotent no-op
  if (SUPERUSER_ROLES.includes(actorRole as Role)) return true;
  const allowed = TRANSITION_ROLES[`${from} -> ${to}`] ?? [];
  return allowed.includes(actorRole as Role);
}

/** Index transitions by `from` state for fast lookup. */
export function transitionsFrom(state: WorkflowState): TransitionDef[] {
  return TRANSITIONS.filter((t) => t.from === state);
}

export function findTransition(
  from: WorkflowState,
  to: WorkflowState,
  action: WorkflowAction,
): TransitionDef | undefined {
  return TRANSITIONS.find((t) => t.from === from && t.to === to && t.action === action);
}

/** All states the machine knows about (for validation/UX). */
export const ALL_STATES: WorkflowState[] = Object.values(WorkflowState);
