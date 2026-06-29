import { describe, it, expect, beforeEach } from 'vitest';
import { seed } from '../src/store/seed.js';
import { db } from '../src/store/db.js';
import { workflowService, WorkflowError } from '../src/services/workflow.service.js';
import { WorkflowAction, WorkflowState, Role } from '../src/domain/enums.js';

beforeEach(() => seed());

function appInState(state: WorkflowState) {
  return db.applications.find((a) => a.state === state)[0];
}

describe('Workflow engine — valid & invalid transitions', () => {
  it('allows DRAFT → SUBMITTED by applicant', () => {
    const draft = appInState(WorkflowState.DRAFT);
    const res = workflowService.transition(draft.id, WorkflowAction.SUBMIT, WorkflowState.SUBMITTED, {
      actorId: draft.applicantId,
      actorRole: Role.APPLICANT,
    });
    expect(res.application.state).toBe(WorkflowState.SUBMITTED);
  });

  it('blocks the invalid DRAFT → INSPECTION_SCHEDULED shortcut', () => {
    const draft = appInState(WorkflowState.DRAFT);
    expect(() =>
      workflowService.transition(draft.id, WorkflowAction.SCHEDULE_INSPECTION, WorkflowState.INSPECTION_SCHEDULED, {
        actorId: draft.applicantId,
        actorRole: Role.APPLICANT,
      }),
    ).toThrow(WorkflowError);
  });

  it('blocks EC_REVIEW → APPROVED shortcut', () => {
    const ec = appInState(WorkflowState.EC_REVIEW) ?? appInState(WorkflowState.ASSESSOR_REVIEW);
    expect(() =>
      workflowService.transition(ec.id, WorkflowAction.MARK_APPROVED, WorkflowState.APPROVED, {
        actorId: 'x',
        actorRole: Role.DCI_ADMIN,
      }),
    ).toThrow(WorkflowError);
  });

  it('blocks a role not permitted for the transition', () => {
    const draft = appInState(WorkflowState.DRAFT);
    expect(() =>
      workflowService.transition(draft.id, WorkflowAction.SUBMIT, WorkflowState.SUBMITTED, {
        actorId: 'obs',
        actorRole: Role.OBSERVER,
      }),
    ).toThrow(/not permitted/);
  });

  it('records an audit event for every transition', () => {
    const draft = appInState(WorkflowState.DRAFT);
    const before = db.audit.find((e) => e.applicationId === draft.id).length;
    workflowService.transition(draft.id, WorkflowAction.SUBMIT, WorkflowState.SUBMITTED, {
      actorId: draft.applicantId,
      actorRole: Role.APPLICANT,
    });
    const after = db.audit.find((e) => e.applicationId === draft.id).length;
    expect(after).toBe(before + 1);
  });
});
