import { db } from '../store/db.js';
import { CollegeStatus, ECDecision, WorkflowAction, WorkflowState } from '../domain/enums.js';
import { bankGuaranteeFor } from '../domain/workflowConfig.js';
import { Application, BankGuarantee, User } from '../types/index.js';
import { documentService } from './document.service.js';
import { workflowService } from './workflow.service.js';

export const governmentService = {
  queue(): Application[] {
    return db.applications.find((a) =>
      ([
        WorkflowState.GOVERNMENT_DECISION,
        WorkflowState.LETTER_OF_INTENT,
        WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION,
      ] as WorkflowState[]).includes(a.state),
    );
  },

  detail(applicationId: string) {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    const bg = bankGuaranteeFor({
      workflowType: app.workflowType,
      course: app.course,
      intake: app.approvedIntake ?? app.intakeCap ?? app.intake,
      governmentCollege: app.governmentCollege,
    });
    return {
      application: app,
      ecDecision: app.ecDecision,
      ecRationale: app.ecRationale,
      undertaking: app.undertaking,
      riskScore: app.riskScore ?? 0,
      requiredBankGuarantee: bg,
      documents: documentService.list(applicationId),
    };
  },

  issueLOI(applicationId: string, actor: User) {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    const result = workflowService.transition(
      applicationId,
      WorkflowAction.GOV_ISSUE_LOI,
      WorkflowState.LETTER_OF_INTENT,
      { actorId: actor.id, actorRole: actor.role, reason: 'Letter of Intent issued' },
    );
    documentService.letterOfIntent(db.applications.get(applicationId)!, actor.id);
    return result;
  },

  /**
   * Verify the performance bank guarantee (Reg 10/17/23).
   * Computes the required amount per workflow/intake and validates the
   * submitted guarantee amount + validity date.
   */
  verifyBankGuarantee(
    applicationId: string,
    input: { amountLakh?: number; bank?: string; reference?: string; validUpto?: string } = {},
  ) {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    if (app.state !== WorkflowState.LETTER_OF_INTENT) {
      throw Object.assign(new Error('Bank guarantee can only be verified after LOI'), { status: 422 });
    }
    const required = bankGuaranteeFor({
      workflowType: app.workflowType,
      course: app.course,
      intake: app.approvedIntake ?? app.intakeCap ?? app.intake,
      governmentCollege: app.governmentCollege,
    });

    if (required.applicable) {
      const amount = Number(input.amountLakh ?? 0);
      if (amount < required.amountLakh) {
        throw Object.assign(
          new Error(`Bank guarantee ₹${amount} lakh is below the required ₹${required.amountLakh} lakh`),
          { status: 422 },
        );
      }
      if (input.validUpto && new Date(input.validUpto).getTime() < Date.now()) {
        throw Object.assign(new Error('Bank guarantee has expired'), { status: 422 });
      }
    }

    const guarantee: BankGuarantee = {
      amountLakh: Number(input.amountLakh ?? required.amountLakh),
      requiredLakh: required.amountLakh,
      bank: input.bank ?? (required.applicable ? 'Scheduled Commercial Bank' : 'N/A'),
      reference: input.reference,
      validUpto: input.validUpto,
      verified: true,
      verifiedAt: new Date().toISOString(),
      basis: required.basis,
    };
    return db.applications.update(applicationId, { bankGuaranteeVerified: true, bankGuarantee: guarantee })!;
  },

  issueLOP(applicationId: string, actor: User) {
    const app = db.applications.get(applicationId);
    if (!app?.bankGuaranteeVerified) {
      throw Object.assign(new Error('Valid bank guarantee must be verified before issuing LOP'), {
        status: 422,
      });
    }
    const result = workflowService.transition(
      applicationId,
      WorkflowAction.ISSUE_LOP,
      WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION,
      { actorId: actor.id, actorRole: actor.role, reason: 'LOP / Recognition issued' },
    );
    // Generate the permission/recognition document, promote college, apply capacity.
    documentService.letterOfPermission(db.applications.get(applicationId)!, actor.id);
    this.promoteCollege(applicationId);
    return workflowService.transition(
      applicationId,
      WorkflowAction.MARK_APPROVED,
      WorkflowState.APPROVED,
      { actorId: actor.id, actorRole: actor.role, reason: 'Marked approved after LOP/Recognition' },
    );
  },

  reject(applicationId: string, reason: string, actor: User) {
    return workflowService.transition(
      applicationId,
      WorkflowAction.GOV_ADVERSE,
      WorkflowState.REJECTED,
      { actorId: actor.id, actorRole: actor.role, reason },
    );
  },

  /** Adverse withdraw/stop with hearing hook recorded in audit metadata. */
  withdrawOrStop(applicationId: string, mode: 'WITHDRAW' | 'STOP', reason: string, actor: User) {
    const to = mode === 'WITHDRAW' ? WorkflowState.WITHDRAWN : WorkflowState.STOPPED;
    const result = workflowService.transition(applicationId, WorkflowAction.GOV_ADVERSE, to, {
      actorId: actor.id,
      actorRole: actor.role,
      reason,
      metadata: { hearingHook: true, mode },
    });
    const app = db.applications.get(applicationId);
    if (app) {
      db.colleges.update(app.collegeId, {
        status: mode === 'WITHDRAW' ? CollegeStatus.WITHDRAWN : CollegeStatus.STOPPED,
      });
    }
    return result;
  },

  /** Promote college status and apply the granted/restrained capacity. */
  promoteCollege(applicationId: string): void {
    const app = db.applications.get(applicationId);
    if (!app) return;
    const college = db.colleges.get(app.collegeId);
    if (!college) return;
    const nextStatus =
      college.status === CollegeStatus.NEW ? CollegeStatus.APPROVED : CollegeStatus.RECOGNIZED;

    // Apply the granted intake (restrained capacity if EC partially approved).
    const grantedIntake = app.approvedIntake ?? app.intakeCap ?? app.intake;
    const courses = [...college.courses];
    const idx = courses.findIndex((c) => c.course === app.course);
    if (idx >= 0) courses[idx] = { ...courses[idx], intake: grantedIntake };
    else courses.push({ course: app.course, intake: grantedIntake });

    db.colleges.update(college.id, { status: nextStatus, courses });
  },

  decisionVocabulary(): ECDecision[] {
    return Object.values(ECDecision);
  },
};
