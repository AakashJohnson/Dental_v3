import { db } from '../store/db.js';
import { FindingStatus, Role, WorkflowAction, WorkflowState } from '../domain/enums.js';
import { AssessorReport, User } from '../types/index.js';
import { id, nowIso } from '../utils/id.js';
import { complianceService } from './compliance.service.js';
import { documentService } from './document.service.js';
import { workflowService } from './workflow.service.js';

export const assessorService = {
  assignedTo(actor: User) {
    return db.applications.find(
      (a) =>
        a.scheduling?.assessorIds?.includes(actor.id) &&
        ([
          WorkflowState.INSPECTION_SCHEDULED,
          WorkflowState.AI_INSPECTION,
          WorkflowState.AI_OBSERVER_REVIEW,
          WorkflowState.ASSESSOR_REVIEW,
        ] as WorkflowState[]).includes(a.state),
    );
  },

  getOrCreateReport(applicationId: string): AssessorReport {
    let report = db.assessorReports.findOne((r) => r.applicationId === applicationId);
    if (!report) {
      report = db.assessorReports.insert({
        id: id('rpt'),
        applicationId,
        assessorSignatures: [],
        summary: '',
        overrides: [],
        midnightWarning: this.pastMidnightWarning(),
      });
    }
    return report;
  },

  /** Assessor may override a finding, but reason is mandatory. */
  override(applicationId: string, findingId: string, reason: string, actor: User): AssessorReport {
    if (!reason?.trim()) {
      throw Object.assign(new Error('Override reason is mandatory'), { status: 422 });
    }
    const finding = db.findings.get(findingId);
    if (!finding || finding.applicationId !== applicationId) {
      throw Object.assign(new Error('Finding not found for application'), { status: 404 });
    }
    db.findings.update(findingId, {
      assessorOverride: true,
      overrideReason: reason,
      status: FindingStatus.OVERRIDDEN,
      finalVerdict: finding.aiVerdict,
    });
    const report = this.getOrCreateReport(applicationId);
    report.overrides.push({ findingId, reason, by: actor.id });
    return db.assessorReports.update(report.id, { overrides: report.overrides })!;
  },

  /** Dual signature: two distinct assessors must sign. */
  sign(applicationId: string, summary: string, actor: User): AssessorReport {
    if (actor.role !== Role.ASSESSOR && actor.role !== Role.DCI_ADMIN) {
      throw Object.assign(new Error('Only assessors may sign the report'), { status: 403 });
    }
    const report = this.getOrCreateReport(applicationId);
    if (!report.assessorSignatures.find((s) => s.assessorId === actor.id)) {
      report.assessorSignatures.push({ assessorId: actor.id, signedAt: nowIso() });
    }
    return db.assessorReports.update(report.id, {
      assessorSignatures: report.assessorSignatures,
      summary: summary || report.summary,
      midnightWarning: this.pastMidnightWarning(),
    })!;
  },

  /** Submit to EC — requires two distinct signatures. Runs compliance engine. */
  submit(applicationId: string, actor: User) {
    const report = this.getOrCreateReport(applicationId);
    const distinct = new Set(report.assessorSignatures.map((s) => s.assessorId));
    if (distinct.size < 2) {
      throw Object.assign(new Error('Report requires dual assessor signatures before submission'), {
        status: 422,
      });
    }
    db.assessorReports.update(report.id, { finalizedAt: nowIso() });

    // Evaluate compliance from norm rules + findings → ComplianceResults + risk score.
    complianceService.evaluateApplication(applicationId);

    // Generate the signed Joint Assessment Report document.
    const app = db.applications.get(applicationId)!;
    documentService.jointAssessmentReport(
      app,
      report.summary,
      report.assessorSignatures.map((s) => s.assessorId),
    );

    return workflowService.transition(
      applicationId,
      WorkflowAction.SUBMIT_ASSESSOR_REPORT,
      WorkflowState.EC_REVIEW,
      { actorId: actor.id, actorRole: actor.role, reason: 'Joint assessment report submitted' },
    );
  },

  /** Warn assessors approaching midnight / 24h finalisation deadline. */
  pastMidnightWarning(): boolean {
    const hour = new Date().getHours();
    return hour >= 22; // within 2h of midnight
  },
};
