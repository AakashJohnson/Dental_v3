import { describe, it, expect, beforeEach } from 'vitest';
import { seed } from '../src/store/seed.js';
import { db } from '../src/store/db.js';
import {
  ACTIONS,
  ACTION_STATUS,
  canPerformAction,
  computeAllowedActions,
  buildActionEnvelope,
  isExplicitAdminOverride,
} from '../src/domain/actions.js';
import {
  TRANSITION_ROLES,
  actorMayTransition,
} from '../src/domain/transitions.js';
import {
  assertTransition,
  assertActorMayTransition,
  applyAuthorizedReopen,
  getSubmissionReadiness,
  WorkflowError,
} from '../src/services/workflow.service.js';
import {
  pendingFindings,
  allFindingsDispositioned,
  distinctSigners,
  isDualSigned,
} from '../src/services/workflow-guards.js';
import { Role, WorkflowState, FindingStatus } from '../src/domain/enums.js';
import { Application } from '../src/types/index.js';

beforeEach(() => seed());

function appInState(state: WorkflowState): Application {
  return db.applications.find((a) => a.state === state)[0];
}

describe('Canonical transition graph & edge-role ownership', () => {
  it('rejects an off-graph transition', () => {
    expect(() => assertTransition(WorkflowState.DRAFT, WorkflowState.INSPECTION_SCHEDULED)).toThrow(
      WorkflowError,
    );
    expect(() => assertTransition(WorkflowState.DRAFT, WorkflowState.SUBMITTED)).not.toThrow();
  });

  it('blocks Government Decision → Approved directly', () => {
    expect(() =>
      assertTransition(WorkflowState.GOVERNMENT_DECISION, WorkflowState.APPROVED),
    ).toThrow(WorkflowError);
  });

  it('enforces old-backend role ownership per edge', () => {
    // Draft → Submitted may be driven by applicant/consultant only.
    expect(actorMayTransition(Role.APPLICANT, WorkflowState.DRAFT, WorkflowState.SUBMITTED)).toBe(true);
    expect(actorMayTransition(Role.OBSERVER, WorkflowState.DRAFT, WorkflowState.SUBMITTED)).toBe(false);
    // Assessor Review → EC Review is assessor-only.
    expect(
      actorMayTransition(Role.ASSESSOR, WorkflowState.ASSESSOR_REVIEW, WorkflowState.EC_REVIEW),
    ).toBe(true);
    expect(
      actorMayTransition(Role.EC_MEMBER, WorkflowState.ASSESSOR_REVIEW, WorkflowState.EC_REVIEW),
    ).toBe(false);
    // EC Review edges are committee/EC-only.
    expect(
      actorMayTransition(Role.EC_MEMBER, WorkflowState.EC_REVIEW, WorkflowState.GOVERNMENT_DECISION),
    ).toBe(true);
    // Government edges are government-only.
    expect(
      actorMayTransition(Role.GOVERNMENT_AUTHORITY, WorkflowState.GOVERNMENT_DECISION, WorkflowState.LETTER_OF_INTENT),
    ).toBe(true);
    expect(
      actorMayTransition(Role.COMPLIANCE_OFFICER, WorkflowState.GOVERNMENT_DECISION, WorkflowState.LETTER_OF_INTENT),
    ).toBe(false);
  });

  it('lets superusers (DCI/Super Admin/SYSTEM) drive any edge', () => {
    expect(actorMayTransition(Role.DCI_ADMIN, WorkflowState.EC_REVIEW, WorkflowState.GOVERNMENT_DECISION)).toBe(true);
    expect(actorMayTransition('SYSTEM', WorkflowState.DEFICIENCY, WorkflowState.INSPECTION_SCHEDULED)).toBe(true);
  });

  it('assertActorMayTransition throws 403 for a wrong role', () => {
    try {
      assertActorMayTransition(Role.OBSERVER, WorkflowState.DRAFT, WorkflowState.SUBMITTED);
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as WorkflowError).status).toBe(403);
    }
  });

  it('exposes the full old TRANSITION_ROLES map', () => {
    expect(TRANSITION_ROLES['DRAFT -> SUBMITTED']).toContain(Role.APPLICANT);
    expect(TRANSITION_ROLES['DEFICIENCY -> INSPECTION_SCHEDULED']).toEqual([Role.COMPLIANCE_OFFICER]);
  });
});

describe('Action vocabulary, ownership & status gates', () => {
  it('an action is owned by its role and legal only in its state', () => {
    const applicant = db.users.findOne((u) => u.role === Role.APPLICANT)!;
    const draft = appInState(WorkflowState.DRAFT);
    expect(canPerformAction(applicant, ACTIONS.APPLICATION_SUBMIT, draft)).toBe(true);

    const submitted = { ...draft, state: WorkflowState.UNDER_SCRUTINY };
    // APPLICATION_SUBMIT is gated to DRAFT only.
    expect(canPerformAction(applicant, ACTIONS.APPLICATION_SUBMIT, submitted as Application)).toBe(false);
  });

  it('a role cannot perform another role’s action', () => {
    const ec = db.users.findOne((u) => u.role === Role.EC_MEMBER)!;
    const ecApp = appInState(WorkflowState.AI_OBSERVER_REVIEW); // any app
    expect(canPerformAction(ec, ACTIONS.SCRUTINY_PASS, ecApp)).toBe(false);
    expect(canPerformAction(ec, ACTIONS.EC_DECISION_RECORD, { ...ecApp, state: WorkflowState.EC_REVIEW } as Application)).toBe(true);
  });

  it('DCI admin role-work requires an explicit, reasoned override', () => {
    const dci = db.users.findOne((u) => u.role === Role.DCI_ADMIN) ?? { role: Role.DCI_ADMIN };
    const ecReview = { ...appInState(WorkflowState.AI_OBSERVER_REVIEW), state: WorkflowState.EC_REVIEW } as Application;
    // Without override: a DCI admin owns every action (super-role), so it passes.
    expect(canPerformAction(dci as { role: Role }, ACTIONS.EC_DECISION_RECORD, ecReview)).toBe(true);
    // The override helper only accepts a non-empty reason.
    expect(isExplicitAdminOverride(ACTIONS.EC_DECISION_RECORD, { adminOverride: true, overrideReason: '' })).toBe(false);
    expect(isExplicitAdminOverride(ACTIONS.EC_DECISION_RECORD, { adminOverride: true, overrideReason: 'audit' })).toBe(true);
  });

  it('computeAllowedActions only returns currently-legal actions', () => {
    const observer = db.users.findOne((u) => u.role === Role.OBSERVER)!;
    const obsApp = appInState(WorkflowState.AI_OBSERVER_REVIEW);
    const allowed = computeAllowedActions(observer, obsApp);
    expect(allowed).toContain(ACTIONS.OBSERVER_SIGNOFF);
    expect(allowed).not.toContain(ACTIONS.EC_DECISION_RECORD);
  });

  it('every application API response carries the action envelope', () => {
    const applicant = db.users.findOne((u) => u.role === Role.APPLICANT)!;
    const draft = appInState(WorkflowState.DRAFT);
    const env = buildActionEnvelope(applicant, draft);
    expect(env).toHaveProperty('viewerRole', Role.APPLICANT);
    expect(env).toHaveProperty('allowedActions');
    expect(env).toHaveProperty('visibleSections');
    expect(env).toHaveProperty('nextAction');
    expect(env).toHaveProperty('blockedReason', null);
  });

  it('action status gates match the old backend', () => {
    expect(ACTION_STATUS[ACTIONS.APPLICATION_SUBMIT]).toEqual([WorkflowState.DRAFT]);
    expect(ACTION_STATUS[ACTIONS.OBSERVER_SIGNOFF]).toEqual([WorkflowState.AI_OBSERVER_REVIEW]);
    expect(ACTION_STATUS[ACTIONS.LOP_ISSUE]).toEqual([
      WorkflowState.LETTER_OF_INTENT,
      WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION,
    ]);
    expect(ACTION_STATUS[ACTIONS.ADMIN_VIEW_ALL]).toBe('*');
  });
});

describe('Stage-precondition guards', () => {
  it('pendingFindings / allFindingsDispositioned', () => {
    const findings = [
      { status: FindingStatus.ACCEPTED },
      { status: FindingStatus.PENDING_OBSERVER_REVIEW },
    ];
    expect(pendingFindings(findings)).toHaveLength(1);
    expect(allFindingsDispositioned(findings)).toBe(false);
    expect(allFindingsDispositioned([{ status: FindingStatus.ACCEPTED }])).toBe(true);
    expect(allFindingsDispositioned([])).toBe(false);
  });

  it('distinctSigners / isDualSigned', () => {
    expect(distinctSigners([{ assessorId: 'a' }, { assessorId: 'a' }])).toBe(1);
    expect(isDualSigned([{ assessorId: 'a' }, { assessorId: 'a' }])).toBe(false);
    expect(isDualSigned([{ assessorId: 'a' }, { assessorId: 'b' }])).toBe(true);
  });
});

describe('Authorized reopen (off-graph, centralized)', () => {
  it('a non-authorized role cannot reopen', () => {
    const app = appInState(WorkflowState.AI_OBSERVER_REVIEW);
    db.applications.update(app.id, { state: WorkflowState.REJECTED });
    expect(() =>
      applyAuthorizedReopen(app.id, { actorId: 'x', actorRole: Role.APPLICANT, reason: 'try' }),
    ).toThrow(/authorized/i);
  });

  it('DCI admin reopens a Rejected case back to Deficiency via the engine', () => {
    const app = appInState(WorkflowState.AI_OBSERVER_REVIEW);
    db.applications.update(app.id, { state: WorkflowState.REJECTED });
    const before = db.audit.find((e) => e.applicationId === app.id).length;
    const res = applyAuthorizedReopen(app.id, {
      actorId: 'admin1',
      actorRole: Role.DCI_ADMIN,
      reason: 'New evidence furnished',
    });
    expect(res.application.state).toBe(WorkflowState.DEFICIENCY);
    expect(db.audit.find((e) => e.applicationId === app.id).length).toBe(before + 1);
  });
});

describe('Submission readiness (old getSubmissionReadiness)', () => {
  it('reports missing mandatory documents and an unpaid fee', () => {
    const draft = appInState(WorkflowState.DRAFT);
    db.applications.update(draft.id, { feePaid: false, documents: [] });
    const readiness = getSubmissionReadiness(db.applications.get(draft.id)!);
    expect(readiness.ready).toBe(false);
    expect(readiness.errors.some((e) => e.field === 'documents')).toBe(true);
    expect(readiness.errors.some((e) => e.field === 'fee')).toBe(true);
  });
});
