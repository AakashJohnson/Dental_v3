import { db } from '../store/db.js';
import { ECDecision, WorkflowAction, WorkflowState, WorkflowType } from '../domain/enums.js';
import { Application, User } from '../types/index.js';
import { complianceService } from './compliance.service.js';
import { deficiencyService } from './deficiency.service.js';
import { documentService } from './document.service.js';
import { workflowService } from './workflow.service.js';

/** Maps an EC decision to the resulting workflow transition. */
const DECISION_LEADS_TO_DEFICIENCY: ECDecision[] = [
  ECDecision.ASK_COMPLIANCE,
  ECDecision.NOT_GRANTED_TILL_DEFICIENCIES_RECTIFIED,
];

export const ecService = {
  queue(): Application[] {
    return db.applications.find((a) => a.state === WorkflowState.EC_REVIEW);
  },

  review(applicationId: string) {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    const results = complianceService.resultsFor(applicationId);
    const deficiencies = db.deficiencies.find((d) => d.applicationId === applicationId);
    return {
      applicationId,
      workflowType: app.workflowType,
      riskScore: app.riskScore ?? 0,
      riskLevel: complianceService.riskLevel(app.riskScore ?? 0),
      deficiencyList: deficiencies,
      complianceResults: results,
      assessorSummary:
        db.assessorReports.findOne((r) => r.applicationId === applicationId)?.summary ?? '',
      suggestedDecision: complianceService.suggestDecision(
        app.workflowType,
        app.collegeId,
        deficiencies,
        app.riskScore ?? 0,
      ),
      decisionVocabulary: Object.values(ECDecision),
    };
  },

  /**
   * Record an EC decision. The decision MUST come from the vocabulary;
   * rationale is free text but never a substitute for the decision.
   */
  decide(applicationId: string, decision: ECDecision, rationale: string, undertaking: string | undefined, actor: User) {
    if (!Object.values(ECDecision).includes(decision)) {
      throw Object.assign(new Error('Decision must be selected from EC vocabulary'), { status: 422 });
    }
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });

    // APPROVE_ON_UNDERTAKING requires a recorded undertaking (Principal's commitment).
    if (decision === ECDecision.APPROVE_ON_UNDERTAKING && !undertaking?.trim()) {
      throw Object.assign(
        new Error('APPROVE_ON_UNDERTAKING requires an undertaking from the Principal'),
        { status: 422 },
      );
    }

    const patch: Partial<Application> = { ecDecision: decision, ecRationale: rationale, undertaking };

    // PARTIAL / RESTRAIN: compute and persist the restrained capacity.
    if (decision === ECDecision.PARTIAL_APPROVAL_OR_RESTRAIN_CAPACITY) {
      patch.intakeCap = this.restrainedCapacity(app);
      patch.approvedIntake = patch.intakeCap;
    } else if (
      decision === ECDecision.APPROVE ||
      decision === ECDecision.APPROVE_ON_UNDERTAKING
    ) {
      patch.approvedIntake = app.intake;
    }
    db.applications.update(applicationId, patch);
    const updated = db.applications.get(applicationId)!;

    if (DECISION_LEADS_TO_DEFICIENCY.includes(decision)) {
      const result = workflowService.transition(
        applicationId,
        WorkflowAction.EC_ASK_COMPLIANCE,
        WorkflowState.DEFICIENCY,
        { actorId: actor.id, actorRole: actor.role, reason: `EC: ${decision}`, metadata: { decision } },
      );
      deficiencyService.issue(applicationId, actor);
      documentService.deficiencyLetter(updated, actor.id);
      return { ...result, decision };
    }

    // All other decisions route to Government with an EC Recommendation document.
    documentService.ecRecommendation(updated, decision, rationale, actor.id);
    const result = workflowService.transition(
      applicationId,
      WorkflowAction.EC_RECOMMEND,
      WorkflowState.GOVERNMENT_DECISION,
      { actorId: actor.id, actorRole: actor.role, reason: `EC: ${decision}`, metadata: { decision } },
    );
    return { ...result, decision };
  },

  /** Restrained capacity after a partial-approval decision. */
  restrainedCapacity(app: Application): number {
    const college = db.colleges.get(app.collegeId);
    if (app.workflowType === WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS) {
      // Refuse the increase — restrain to the current sanctioned intake.
      const current = college?.courses.find((c) => c.course === app.course)?.intake;
      return current ?? Math.min(app.intake, 50);
    }
    // New college gross deficiency → restrain to the lower 50-seat tier.
    return Math.min(app.intake, 50);
  },
};
