import { db } from '../store/db.js';
import { WorkflowAction, WorkflowState } from '../domain/enums.js';
import { DeficiencyItem, User } from '../types/index.js';
import { nowIso } from '../utils/id.js';
import { applicationService } from './application.service.js';
import { notificationService } from './notification.service.js';
import { Role } from '../domain/enums.js';
import { workflowService } from './workflow.service.js';

export const deficiencyService = {
  /** Issue / publish the deficiency letter (notifies applicant). */
  issue(applicationId: string, actor: User) {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    notificationService.create({
      userId: app.applicantId,
      role: Role.APPLICANT,
      applicationId,
      type: 'DEFICIENCY_LETTER_ISSUED',
      title: `Deficiency letter issued for ${app.code}`,
      body: 'Please respond to each deficiency line with evidence within the compliance window.',
    });
    return db.deficiencies.find((d) => d.applicationId === applicationId);
  },

  list(applicationId: string): DeficiencyItem[] {
    return db.deficiencies.find((d) => d.applicationId === applicationId);
  },

  reopenWindow(applicationId: string, actor: User) {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    notificationService.create({
      userId: app.applicantId,
      role: Role.APPLICANT,
      applicationId,
      type: 'COMPLIANCE_WINDOW_REOPENED',
      title: `Compliance window reopened for ${app.code}`,
      body: 'You may submit replies and evidence for outstanding deficiencies.',
    });
    return { reopened: true };
  },

  /** Applicant submits reply + evidence per deficiency line. */
  submitCompliance(
    applicationId: string,
    replies: { deficiencyId: string; reply: string; evidence: string[] }[],
  ) {
    for (const r of replies) {
      const def = db.deficiencies.get(r.deficiencyId);
      if (!def || def.applicationId !== applicationId) continue;
      db.deficiencies.update(r.deficiencyId, {
        applicantReply: r.reply,
        evidenceUploads: [...def.evidenceUploads, ...r.evidence],
        status: 'IN_REVIEW',
      });
    }
    return this.list(applicationId);
  },

  /** Compliance officer validates each line; resolved vs outstanding delta. */
  validate(applicationId: string, decisions: { deficiencyId: string; resolved: boolean; observation?: string }[]) {
    for (const d of decisions) {
      const def = db.deficiencies.get(d.deficiencyId);
      if (!def || def.applicationId !== applicationId) continue;
      db.deficiencies.update(d.deficiencyId, {
        status: d.resolved ? 'RESOLVED' : 'OUTSTANDING',
        resolvedAt: d.resolved ? nowIso() : undefined,
        outstandingDelta: !d.resolved,
        observerOrInspectorObservation: d.observation ?? def.observerOrInspectorObservation,
      });
    }
    return this.delta(applicationId);
  },

  delta(applicationId: string) {
    const items = this.list(applicationId);
    return {
      total: items.length,
      resolved: items.filter((d) => d.status === 'RESOLVED').length,
      outstanding: items.filter((d) => d.status === 'OUTSTANDING').length,
      items,
    };
  },

  /**
   * Trigger re-verification: generates a Workflow-7 compliance verification
   * child application and moves the parent DEFICIENCY → INSPECTION_SCHEDULED.
   */
  triggerReverification(applicationId: string, actor: User) {
    const child = applicationService.createComplianceVerification(applicationId, actor);
    const result = workflowService.transition(
      applicationId,
      WorkflowAction.COMPLIANCE_REVERIFY,
      WorkflowState.INSPECTION_SCHEDULED,
      {
        actorId: actor.id,
        actorRole: actor.role,
        reason: 'Compliance validated; re-verification scheduled',
        metadata: { complianceVerificationId: child.id },
      },
    );
    return { ...result, complianceVerificationApplication: child };
  },
};
