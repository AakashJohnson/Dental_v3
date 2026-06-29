import { db } from '../store/db.js';
import { WorkflowAction, WorkflowState } from '../domain/enums.js';
import { checkWorkflowEligibility } from '../domain/permissions.js';
import { requiredGatingDocs } from '../domain/workflowConfig.js';
import { Application, ScrutinyGateResult, User } from '../types/index.js';
import { nowIso } from '../utils/id.js';
import { workflowService } from './workflow.service.js';

export const scrutinyService = {
  queue(): Application[] {
    return db.applications.find(
      (a) => a.state === WorkflowState.SUBMITTED || a.state === WorkflowState.UNDER_SCRUTINY,
    );
  },

  /**
   * Deterministic technical-scrutiny gates (Reg 6; 8/15/21).
   * Gating gates that FAIL block the pass to inspection. Expired validity
   * dates are surfaced as WARN (non-blocking), missing mandatory docs FAIL.
   */
  evaluateGates(applicationId: string): ScrutinyGateResult {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    const college = db.colleges.get(app.collegeId);
    const gates: ScrutinyGateResult['gates'] = [];

    // 1) Eligibility category (college status vs workflow).
    const elig = college
      ? checkWorkflowEligibility(app.workflowType, college.status, app.workflowType.includes('WORKFLOW_7'))
      : { allowed: false, reason: 'College not found' };
    gates.push({
      key: 'eligibility',
      label: 'Applicant eligibility & workflow category',
      status: elig.allowed ? 'PASS' : 'FAIL',
      detail: elig.allowed ? `Eligible (${college?.status})` : elig.reason ?? 'Ineligible',
      gating: true,
    });

    // 2) Mandatory gating documents present + valid.
    for (const spec of requiredGatingDocs(app.workflowType)) {
      const doc = (app.documents ?? []).find((d) => d.name.toLowerCase().includes(spec.key));
      if (!doc || !doc.uploaded) {
        gates.push({ key: `doc:${spec.key}`, label: spec.label, status: 'FAIL', detail: 'Not uploaded', gating: true });
      } else if (doc.validUpto && new Date(doc.validUpto).getTime() < Date.now()) {
        gates.push({ key: `doc:${spec.key}`, label: spec.label, status: 'WARN', detail: `Expired ${doc.validUpto}`, gating: true });
      } else {
        gates.push({ key: `doc:${spec.key}`, label: spec.label, status: 'PASS', detail: doc.validUpto ? `Valid upto ${doc.validUpto}` : 'Uploaded', gating: true });
      }
    }

    // 3) Fee paid (or government exemption).
    const feeOk = app.governmentCollege || app.feePaid !== false;
    gates.push({
      key: 'fee',
      label: 'Application fee paid / exemption',
      status: feeOk ? 'PASS' : 'FAIL',
      detail: app.governmentCollege ? 'Government college — exempt' : feeOk ? `Fee ₹${app.feeLakh ?? '?'} lakh paid` : 'Fee not paid',
      gating: true,
    });

    const passed = !gates.some((g) => g.gating && g.status === 'FAIL');
    const result: ScrutinyGateResult = { passed, evaluatedAt: nowIso(), gates };
    db.applications.update(applicationId, { scrutinyGates: result });
    return result;
  },

  /** Auto-check completeness from documents + record checklist + gates. */
  runChecklist(applicationId: string, checklist: Record<string, boolean>): Application {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    const docTotal = app.documents.length || 1;
    const uploaded = app.documents.filter((d) => d.uploaded).length;
    const checks = Object.values(checklist);
    const passed = checks.filter(Boolean).length;
    const completeness = Math.round(((uploaded / docTotal) * 0.5 + (passed / (checks.length || 1)) * 0.5) * 100);
    this.evaluateGates(applicationId);
    return db.applications.update(applicationId, {
      checklist,
      eligibility: checklist,
      completeness,
    })!;
  },

  requestClarification(applicationId: string, reason: string, actor: User) {
    // Ensure scrutiny has started.
    const app = db.applications.get(applicationId);
    if (app?.state === WorkflowState.SUBMITTED) {
      workflowService.transition(applicationId, WorkflowAction.START_SCRUTINY, WorkflowState.UNDER_SCRUTINY, {
        actorId: actor.id,
        actorRole: actor.role,
        reason: 'Scrutiny started',
      });
    }
    return workflowService.transition(
      applicationId,
      WorkflowAction.REQUEST_CLARIFICATION,
      WorkflowState.UNDER_SCRUTINY,
      { actorId: actor.id, actorRole: actor.role, reason },
    );
  },

  startScrutiny(applicationId: string, actor: User) {
    const app = db.applications.get(applicationId);
    // Idempotent: submit already advances Draft → Submitted → Under Scrutiny, so
    // if the case is no longer Submitted just return its current guidance.
    if (app && app.state !== WorkflowState.SUBMITTED) {
      return { application: app, guidance: workflowService.guidanceFor(app) };
    }
    return workflowService.transition(
      applicationId,
      WorkflowAction.START_SCRUTINY,
      WorkflowState.UNDER_SCRUTINY,
      { actorId: actor.id, actorRole: actor.role, reason: 'Scrutiny started' },
    );
  },

  pass(applicationId: string, actor: User) {
    const app = db.applications.get(applicationId);
    // Deterministic gates must pass before scrutiny can clear the case.
    const gates = this.evaluateGates(applicationId);
    if (!gates.passed) {
      const failing = gates.gates.filter((g) => g.gating && g.status === 'FAIL').map((g) => g.label);
      throw Object.assign(
        new Error(`Scrutiny gates failed: ${failing.join('; ')}`),
        { status: 422, gates },
      );
    }
    if (app?.state === WorkflowState.SUBMITTED) {
      this.startScrutiny(applicationId, actor);
    }
    return workflowService.transition(
      applicationId,
      WorkflowAction.SCHEDULE_INSPECTION,
      WorkflowState.INSPECTION_SCHEDULED,
      { actorId: actor.id, actorRole: actor.role, reason: 'Scrutiny passed; inspection to be scheduled' },
    );
  },

  reject(applicationId: string, reason: string, actor: User) {
    const app = db.applications.get(applicationId);
    if (app?.state === WorkflowState.SUBMITTED) {
      this.startScrutiny(applicationId, actor);
    }
    return workflowService.transition(
      applicationId,
      WorkflowAction.REJECT_INELIGIBLE,
      WorkflowState.REJECTED,
      { actorId: actor.id, actorRole: actor.role, reason },
    );
  },
};
