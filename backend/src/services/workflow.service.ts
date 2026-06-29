/**
 * DantaDrishti — centralized Workflow Engine.
 *
 * This is the ONLY module permitted to write `Application.state`.
 * Controllers/services must call `workflowService.transition(...)`.
 * Every transition is validated against the transition matrix, guarded by
 * role, audited, and produces role-specific guidance + notifications.
 */
import { db } from '../store/db.js';
import { Role, TERMINAL_STATES, WorkflowAction, WorkflowState } from '../domain/enums.js';
import {
  TRANSITIONS,
  actorMayTransition,
  findTransition,
  transitionsFrom,
} from '../domain/transitions.js';
import { requiredDocuments } from '../domain/workflowConfig.js';
import { Application, RoleGuidance, TransitionResult } from '../types/index.js';
import { auditService } from './audit.service.js';
import { notificationService } from './notification.service.js';
import { nowIso } from '../utils/id.js';

export class WorkflowError extends Error {
  constructor(
    message: string,
    public status = 422,
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export interface ActorContext {
  actorId: string;
  actorRole: Role | 'SYSTEM';
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/** Maps each state to the role currently responsible for moving it forward. */
const RESPONSIBLE_ROLE: Record<WorkflowState, Role | string> = {
  [WorkflowState.DRAFT]: Role.APPLICANT,
  [WorkflowState.SUBMITTED]: Role.SCRUTINY_OFFICER,
  [WorkflowState.UNDER_SCRUTINY]: Role.SCRUTINY_OFFICER,
  [WorkflowState.INSPECTION_SCHEDULED]: Role.ASSESSOR,
  [WorkflowState.AI_INSPECTION]: Role.ASSESSOR,
  [WorkflowState.AI_OBSERVER_REVIEW]: Role.OBSERVER,
  [WorkflowState.ASSESSOR_REVIEW]: Role.ASSESSOR,
  [WorkflowState.EC_REVIEW]: Role.EC_MEMBER,
  [WorkflowState.DEFICIENCY]: Role.COMPLIANCE_OFFICER,
  [WorkflowState.GOVERNMENT_DECISION]: Role.GOVERNMENT_AUTHORITY,
  [WorkflowState.LETTER_OF_INTENT]: Role.GOVERNMENT_AUTHORITY,
  [WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION]: Role.GOVERNMENT_AUTHORITY,
  [WorkflowState.APPROVED]: 'NONE',
  [WorkflowState.REJECTED]: 'NONE',
  [WorkflowState.WITHDRAWN]: 'NONE',
  [WorkflowState.STOPPED]: 'NONE',
};

const STATE_MESSAGES: Partial<Record<WorkflowState, string>> = {
  [WorkflowState.DRAFT]: 'Complete all required documents and submit the application.',
  [WorkflowState.SUBMITTED]: 'Awaiting scrutiny of completeness and eligibility.',
  [WorkflowState.UNDER_SCRUTINY]: 'Scrutiny in progress; clarifications may be requested.',
  [WorkflowState.INSPECTION_SCHEDULED]: 'Inspection team assigned; AI capture pending.',
  [WorkflowState.AI_INSPECTION]: 'On-site AI inspection capture underway.',
  [WorkflowState.AI_OBSERVER_REVIEW]: 'Observer must verify every AI finding before proceeding.',
  [WorkflowState.ASSESSOR_REVIEW]: 'Assessors finalise and dual-sign the joint report.',
  [WorkflowState.EC_REVIEW]: 'Expert Committee reviews deficiencies, risk and evidence.',
  [WorkflowState.DEFICIENCY]: 'Submit compliance for each deficiency line before re-verification.',
  [WorkflowState.GOVERNMENT_DECISION]: 'Government decides on EC recommendation.',
  [WorkflowState.LETTER_OF_INTENT]: 'Accept conditions and submit a valid bank guarantee.',
  [WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION]: 'Permission/Recognition issued; finalising approval.',
  [WorkflowState.APPROVED]: 'Application approved.',
  [WorkflowState.REJECTED]: 'Application rejected.',
  [WorkflowState.WITHDRAWN]: 'Approval withdrawn.',
  [WorkflowState.STOPPED]: 'Admissions stopped.',
};

export const workflowService = {
  guidanceFor(application: Application): RoleGuidance {
    const next = transitionsFrom(application.state).map((t) => ({
      action: t.action,
      to: t.to,
      description: t.description,
      roles: t.roles,
    }));
    return {
      state: application.state,
      responsibleRole: RESPONSIBLE_ROLE[application.state],
      nextActions: next,
      message: STATE_MESSAGES[application.state] ?? '',
    };
  },

  /**
   * Perform a guarded transition. Throws WorkflowError on any invalid attempt.
   * This is the single entry point for changing application state.
   */
  transition(
    applicationId: string,
    action: WorkflowAction,
    to: WorkflowState,
    ctx: ActorContext,
  ): TransitionResult {
    const application = db.applications.get(applicationId);
    if (!application) throw new WorkflowError('Application not found', 404);

    if (TERMINAL_STATES.includes(application.state)) {
      throw new WorkflowError(
        `Application is in terminal state ${application.state}; no further transitions are allowed.`,
      );
    }

    const def = findTransition(application.state, to, action);
    if (!def) {
      throw new WorkflowError(
        `Invalid transition: ${application.state} --(${action})--> ${to} is not permitted by the state machine.`,
      );
    }

    // Role guard — SYSTEM and admins may always act; otherwise role must be allowed.
    const isAdmin = ctx.actorRole === Role.DCI_ADMIN || ctx.actorRole === Role.SUPER_ADMIN;
    if (
      ctx.actorRole !== 'SYSTEM' &&
      !isAdmin &&
      !def.roles.includes(ctx.actorRole as Role)
    ) {
      throw new WorkflowError(
        `Role ${ctx.actorRole} is not permitted to perform ${action} from ${application.state}.`,
        403,
      );
    }

    const fromState = application.state;
    const updated = db.applications.update(applicationId, {
      state: to,
      updatedAt: nowIso(),
    })!;

    // Append-only audit log for every transition.
    auditService.record({
      applicationId,
      workflowType: application.workflowType,
      fromState,
      toState: to,
      action,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      reason: ctx.reason,
      metadata: ctx.metadata,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    // Role-based notifications (no restricted college data in the body).
    this.notifyTransition(updated, fromState, to);

    return { application: updated, guidance: this.guidanceFor(updated) };
  },

  notifyTransition(application: Application, from: WorkflowState, to: WorkflowState): void {
    const responsible = RESPONSIBLE_ROLE[to];
    const safeTitle = `Application ${application.code}: ${from} → ${to}`;
    const body = STATE_MESSAGES[to] ?? `Status changed to ${to}.`;

    // Always inform the applicant of their own application's movement.
    notificationService.create({
      userId: application.applicantId,
      role: Role.APPLICANT,
      applicationId: application.id,
      type: 'STATUS_CHANGED',
      title: safeTitle,
      body,
    });

    // Inform the newly-responsible role group (excluding NONE/terminal).
    if (responsible !== 'NONE' && typeof responsible === 'string') {
      notificationService.notifyRoles([responsible as Role], {
        applicationId: application.id,
        type: 'ACTION_REQUIRED',
        title: `Action required: ${application.code} (${to})`,
        body,
      });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Canonical engine API — faithful port of the old backend
// application-workflow.service.js. Every status change in the codebase flows
// through workflowService.transition / transitionApplication / the authorized
// reopen below. There is no other writer of Application.state.
// ─────────────────────────────────────────────────────────────────────────────

/** Allowed target states from a state (excludes the idempotent self-edge). */
export function allowedTargets(from: WorkflowState): WorkflowState[] {
  return TRANSITIONS.filter((t) => t.from === from && t.to !== from).map((t) => t.to);
}

/** Validate the canonical edge exists (step 1–3). Throws on an invalid move. */
export function assertTransition(from: WorkflowState, to: WorkflowState): void {
  if (from === to) return; // idempotent no-op
  const allowed = allowedTargets(from);
  if (!allowed.includes(to)) {
    throw new WorkflowError(
      `Invalid application status transition: ${from} -> ${to}. ` +
        `Allowed from ${from}: ${allowed.join(', ') || 'none (terminal)'}`,
    );
  }
}

export { actorMayTransition };

/** Validate the actor's role owns the edge (step 4). Throws 403 otherwise. */
export function assertActorMayTransition(
  actorRole: Role | 'SYSTEM' | string,
  from: WorkflowState,
  to: WorkflowState,
): void {
  if (!actorMayTransition(actorRole, from, to)) {
    throw new WorkflowError(
      `Role "${actorRole || 'unknown'}" may not move an application ${from} -> ${to}`,
      403,
    );
  }
}

function resolveAction(
  from: WorkflowState,
  to: WorkflowState,
  action?: WorkflowAction,
): WorkflowAction | undefined {
  if (action) return action;
  return TRANSITIONS.find((t) => t.from === from && t.to === to)?.action;
}

export interface TransitionApplicationInput {
  applicationId?: string;
  application?: Application;
  actorId: string;
  actorRole: Role | 'SYSTEM';
  action?: WorkflowAction;
  toStatus: WorkflowState;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * THE canonical workflow transition (the documented single front door). Loads
 * the application, validates the current status, the canonical edge, and the
 * actor role, then commits via the single mutator (audit + notify), returning
 * the updated application + guidance.
 */
export function transitionApplication(input: TransitionApplicationInput): TransitionResult {
  const app = input.application ?? (input.applicationId ? db.applications.get(input.applicationId) : undefined);
  if (!app) throw new WorkflowError('Application not found', 404);
  const to = input.toStatus;
  if (!to) throw new WorkflowError('toStatus is required');

  assertTransition(app.state, to);
  assertActorMayTransition(input.actorRole, app.state, to);

  const action = resolveAction(app.state, to, input.action);
  if (!action) throw new WorkflowError(`No canonical action for ${app.state} -> ${to}`);

  return workflowService.transition(app.id, action, to, {
    actorId: input.actorId,
    actorRole: input.actorRole,
    reason: input.reason,
    metadata: input.metadata,
  });
}

/** Back-compat alias for the canonical method. */
export const transition = transitionApplication;

export interface ReopenInput {
  actorId: string;
  actorRole: Role | 'SYSTEM';
  reason: string;
  deadline?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Authorized administrative reopen of a terminal/adverse case. Only a DCI Admin
 * / Super Admin / Government Authority / SYSTEM may move a Rejected / Withdrawn
 * / Stopped (or Deficiency) case back into Deficiency to reopen a compliance
 * window. This is an OFF-GRAPH move, so it skips edge validation — but it still
 * routes through db.applications.update (the single mutator) + audit + notify.
 */
export function applyAuthorizedReopen(applicationId: string, input: ReopenInput): TransitionResult {
  const app = db.applications.get(applicationId);
  if (!app) throw new WorkflowError('Application not found', 404);

  const authorized =
    input.actorRole === 'SYSTEM' ||
    input.actorRole === Role.DCI_ADMIN ||
    input.actorRole === Role.SUPER_ADMIN ||
    input.actorRole === Role.GOVERNMENT_AUTHORITY;
  if (!authorized) {
    throw new WorkflowError(
      'Only an authorized DCI Admin / Government Authority may reopen a closed case',
      403,
    );
  }

  const reopenable: WorkflowState[] = [
    WorkflowState.REJECTED,
    WorkflowState.WITHDRAWN,
    WorkflowState.STOPPED,
    WorkflowState.DEFICIENCY,
  ];
  if (!reopenable.includes(app.state)) {
    throw new WorkflowError(`A ${app.state} case cannot be reopened.`);
  }
  if (app.state === WorkflowState.DEFICIENCY) {
    return { application: app, guidance: workflowService.guidanceFor(app) };
  }

  const fromState = app.state;
  const updated = db.applications.update(applicationId, {
    state: WorkflowState.DEFICIENCY,
    updatedAt: nowIso(),
  })!;

  auditService.record({
    applicationId,
    workflowType: app.workflowType,
    fromState,
    toState: WorkflowState.DEFICIENCY,
    action: 'application.reopen',
    actorId: input.actorId,
    actorRole: input.actorRole,
    reason: `Authorized compliance-window reopen: ${input.reason}`,
    metadata: { ...(input.metadata ?? {}), reopen: true, offGraph: true, deadline: input.deadline },
  });
  workflowService.notifyTransition(updated, fromState, WorkflowState.DEFICIENCY);
  return { application: updated, guidance: workflowService.guidanceFor(updated) };
}

/** Idempotent helper: move an app to nextStatus only from an expected status. */
export function syncApplicationStatus(
  applicationId: string,
  expectedStatuses: WorkflowState[],
  nextStatus: WorkflowState,
  opts: { actorId: string; actorRole: Role | 'SYSTEM'; reason?: string; metadata?: Record<string, unknown> },
): Application {
  const app = db.applications.get(applicationId);
  if (!app) throw new WorkflowError('Application not found', 404);
  if (app.state === nextStatus) return app; // idempotent
  if (!expectedStatuses.includes(app.state)) {
    throw new WorkflowError(
      `Application must be ${expectedStatuses.join(' or ')} before moving to ${nextStatus}`,
    );
  }
  return transitionApplication({
    application: app,
    toStatus: nextStatus,
    actorId: opts.actorId,
    actorRole: opts.actorRole,
    reason: opts.reason,
    metadata: opts.metadata,
  }).application;
}

export interface ReadinessError {
  field: string;
  message: string;
  [k: string]: unknown;
}
export interface Readiness {
  ready: boolean;
  errors: ReadinessError[];
}

/**
 * Submission readiness (old getSubmissionReadiness, adapted to the in-memory
 * model). An application cannot leave DRAFT until every gate passes.
 */
export function getSubmissionReadiness(application: Application): Readiness {
  const errors: ReadinessError[] = [];

  if (!application.workflowType) errors.push({ field: 'workflowType', message: 'workflowType is required before submission' });
  if (!application.course) errors.push({ field: 'course', message: 'course is required before submission' });
  if (application.intake === undefined || application.intake === null || application.intake <= 0) {
    errors.push({ field: 'intake', message: 'A positive intake is required before submission' });
  }

  // Non-new-college workflows must reference a college.
  if (application.workflowType !== 'WORKFLOW_1_NEW_COLLEGE_FIRST_PG' && !application.collegeId) {
    errors.push({ field: 'collegeId', message: 'collegeId is required for this workflow' });
  }

  // Seat increase: proposed must exceed current when both are present.
  if (application.workflowType === 'WORKFLOW_2_INCREASE_BDS_MDS_SEATS') {
    const current = (application as unknown as Record<string, unknown>).currentIntake as number | undefined;
    const proposed = (application as unknown as Record<string, unknown>).proposedIntake as number | undefined;
    if (proposed !== undefined && current !== undefined && Number(proposed) <= Number(current)) {
      errors.push({ field: 'proposedIntake', message: 'proposedIntake must be greater than currentIntake' });
    }
  }

  // Fee must be paid.
  if (application.feePaid !== true) {
    errors.push({ field: 'fee', message: 'Application fee must be recorded as Paid before submission' });
  }

  // Every mandatory (gating) document must be collected & uploaded.
  const missing = requiredDocuments(application.workflowType)
    .filter((spec) => spec.gating)
    .filter((spec) => {
      const doc = (application.documents ?? []).find((d) =>
        d.name.toLowerCase().includes(spec.key.toLowerCase()),
      );
      return !doc || !doc.uploaded;
    });
  if (missing.length) {
    errors.push({
      field: 'documents',
      message: `${missing.length} mandatory document(s) are missing`,
      missingDocuments: missing.map((m) => ({ key: m.key, name: m.label })),
    });
  }

  return { ready: errors.length === 0, errors };
}

/** Scrutiny readiness before scheduling an inspection (old getScrutinyReadiness). */
export function getScrutinyReadiness(application: Application): Readiness {
  const errors: ReadinessError[] = [];
  const openDeficiencies = db.deficiencies
    .find((d) => d.applicationId === application.id)
    .filter((d) => d.status === 'OUTSTANDING' || d.status === 'IN_REVIEW');
  if (openDeficiencies.length) {
    errors.push({
      field: 'deficiencies',
      message: `${openDeficiencies.length} open deficiency(ies) must be resolved`,
    });
  }

  const unverified = requiredDocuments(application.workflowType)
    .filter((spec) => spec.gating)
    .filter((spec) => {
      const doc = (application.documents ?? []).find((d) =>
        d.name.toLowerCase().includes(spec.key.toLowerCase()),
      );
      return !doc || !doc.uploaded;
    });
  if (unverified.length) {
    errors.push({
      field: 'documents',
      message: `${unverified.length} mandatory document(s) must be verified before inspection`,
      unverifiedDocuments: unverified.map((m) => ({ key: m.key, name: m.label })),
    });
  }
  return { ready: errors.length === 0, errors };
}

export function assertScrutinyReady(application: Application): void {
  const readiness = getScrutinyReadiness(application);
  if (!readiness.ready) {
    throw new WorkflowError('Application scrutiny is incomplete: ' + readiness.errors.map((e) => e.message).join('; '));
  }
}
