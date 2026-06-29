import { describe, it, expect, beforeEach } from 'vitest';
import { seed } from '../src/store/seed.js';
import { db } from '../src/store/db.js';
import { observerService } from '../src/services/observer.service.js';
import { assessorService } from '../src/services/assessor.service.js';
import { ecService } from '../src/services/ec.service.js';
import { governmentService } from '../src/services/government.service.js';
import { deficiencyService } from '../src/services/deficiency.service.js';
import { aiInspectionService } from '../src/services/aiInspection.service.js';
import { Role, WorkflowState, WorkflowType, ECDecision } from '../src/domain/enums.js';

beforeEach(() => seed());

const observer = () => db.users.findOne((u) => u.role === Role.OBSERVER)!;
const assessors = () => db.users.find((u) => u.role === Role.ASSESSOR);
const ec = () => db.users.findOne((u) => u.role === Role.EC_MEMBER)!;
const gov = () => db.users.findOne((u) => u.role === Role.GOVERNMENT_AUTHORITY)!;
const compliance = () => db.users.findOne((u) => u.role === Role.COMPLIANCE_OFFICER)!;

function driveToEC(appId: string) {
  for (const f of aiInspectionService.findingsFor(appId)) {
    observerService.verifyFinding(f.id, 'ACCEPT', 'ok', undefined, observer());
  }
  observerService.signoff(appId, observer());
  const [a1, a2] = assessors();
  assessorService.sign(appId, 'report', a1);
  assessorService.sign(appId, 'report', a2);
  assessorService.submit(appId, a1);
}

describe('Government LOI → LOP → APPROVED path', () => {
  it('blocks LOP until bank guarantee is verified, then approves', () => {
    const app = db.applications.find((a) => a.state === WorkflowState.AI_OBSERVER_REVIEW)[0];
    driveToEC(app.id);
    ecService.decide(app.id, ECDecision.APPROVE, 'Compliant', undefined, ec());
    expect(db.applications.get(app.id)!.state).toBe(WorkflowState.GOVERNMENT_DECISION);

    governmentService.issueLOI(app.id, gov());
    expect(db.applications.get(app.id)!.state).toBe(WorkflowState.LETTER_OF_INTENT);

    expect(() => governmentService.issueLOP(app.id, gov())).toThrow(/bank guarantee/);

    const required = governmentService.detail(app.id).requiredBankGuarantee;
    // Submitting an insufficient guarantee is rejected.
    if (required.applicable) {
      expect(() =>
        governmentService.verifyBankGuarantee(app.id, { amountLakh: required.amountLakh - 1 }),
      ).toThrow(/below the required/);
    }
    governmentService.verifyBankGuarantee(app.id, {
      amountLakh: required.amountLakh,
      bank: 'State Bank',
      reference: 'BG-001',
      validUpto: '2030-12-31',
    });
    governmentService.issueLOP(app.id, gov());
    expect(db.applications.get(app.id)!.state).toBe(WorkflowState.APPROVED);
  });
});

describe('Deficiency → compliance → Workflow 7 re-verification loop', () => {
  it('ASK_COMPLIANCE creates deficiency lines and re-verification spawns a Workflow 7 child', () => {
    const app = db.applications.find((a) => a.state === WorkflowState.AI_OBSERVER_REVIEW)[0];
    driveToEC(app.id);
    ecService.decide(app.id, ECDecision.ASK_COMPLIANCE, 'Curable', undefined, ec());
    expect(db.applications.get(app.id)!.state).toBe(WorkflowState.DEFICIENCY);
    expect(deficiencyService.list(app.id).length).toBeGreaterThan(0);

    const res = deficiencyService.triggerReverification(app.id, compliance());
    expect(db.applications.get(app.id)!.state).toBe(WorkflowState.INSPECTION_SCHEDULED);
    expect(res.complianceVerificationApplication.workflowType).toBe(
      WorkflowType.WORKFLOW_7_COMPLIANCE_VERIFICATION,
    );
    expect(res.complianceVerificationApplication.sourceApplicationId).toBe(app.id);
  });
});
