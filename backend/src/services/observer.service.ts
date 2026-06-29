import { db } from '../store/db.js';
import { FindingStatus, WorkflowAction, WorkflowState } from '../domain/enums.js';
import { AIFinding, User } from '../types/index.js';
import { nowIso } from '../utils/id.js';
import { workflowService } from './workflow.service.js';

export const observerService = {
  findingsFor(applicationId: string): AIFinding[] {
    return db.findings.find((f) => f.applicationId === applicationId);
  },

  /**
   * Observer dispositions a single finding. Every finding must be reviewed
   * before sign-off is allowed.
   */
  verifyFinding(
    findingId: string,
    verdict: 'ACCEPT' | 'FLAG' | 'OVERRIDE',
    notes: string | undefined,
    exceptionReason: string | undefined,
    actor: User,
  ): AIFinding {
    const finding = db.findings.get(findingId);
    if (!finding) throw Object.assign(new Error('Finding not found'), { status: 404 });

    const statusMap: Record<typeof verdict, FindingStatus> = {
      ACCEPT: FindingStatus.ACCEPTED,
      FLAG: FindingStatus.FLAGGED,
      OVERRIDE: FindingStatus.OVERRIDDEN,
    };
    if (verdict !== 'ACCEPT' && !exceptionReason) {
      throw Object.assign(new Error('Exception reason is required for FLAG/OVERRIDE'), {
        status: 422,
      });
    }

    return db.findings.update(findingId, {
      status: statusMap[verdict],
      observerVerdict: verdict,
      observerNotes: notes,
      exceptionReason,
      verifiedBy: actor.id,
      verifiedAt: nowIso(),
      finalVerdict: verdict === 'OVERRIDE' ? finding.aiVerdict : finding.finalVerdict ?? finding.aiVerdict,
    })!;
  },

  /** Block sign-off until every finding has been dispositioned. */
  signoff(applicationId: string, actor: User) {
    const findings = this.findingsFor(applicationId);
    const pending = findings.filter(
      (f) =>
        f.status === FindingStatus.PENDING_OBSERVER_REVIEW ||
        f.status === FindingStatus.NEEDS_HUMAN_REVIEW,
    );
    if (pending.length > 0) {
      throw Object.assign(
        new Error(`${pending.length} finding(s) still require observer disposition before sign-off.`),
        { status: 422 },
      );
    }
    return workflowService.transition(
      applicationId,
      WorkflowAction.OBSERVER_SIGNOFF,
      WorkflowState.ASSESSOR_REVIEW,
      { actorId: actor.id, actorRole: actor.role, reason: 'Observer signed off all findings' },
    );
  },
};
