import { describe, it, expect, beforeEach } from 'vitest';
import { seed } from '../src/store/seed.js';
import { db } from '../src/store/db.js';
import { observerService } from '../src/services/observer.service.js';
import { assessorService } from '../src/services/assessor.service.js';
import { ecService } from '../src/services/ec.service.js';
import { aiInspectionService } from '../src/services/aiInspection.service.js';
import { FindingStatus, Role, WorkflowState, ECDecision } from '../src/domain/enums.js';
import { User } from '../src/types/index.js';

beforeEach(() => seed());

const observer = () => db.users.findOne((u) => u.role === Role.OBSERVER)!;
const assessors = () => db.users.find((u) => u.role === Role.ASSESSOR) as User[];

function w1() {
  return db.applications.find((a) => a.state === WorkflowState.AI_OBSERVER_REVIEW)[0];
}

describe('AI findings & observer verification', () => {
  it('low-confidence findings are NEEDS_HUMAN_REVIEW and integrity findings QUARANTINED', () => {
    const findings = aiInspectionService.findingsFor(w1().id);
    expect(findings.some((f) => f.status === FindingStatus.NEEDS_HUMAN_REVIEW)).toBe(true);
    expect(findings.some((f) => f.status === FindingStatus.QUARANTINED)).toBe(true);
  });

  it('observer sign-off is blocked until every finding is dispositioned', () => {
    expect(() => observerService.signoff(w1().id, observer())).toThrow(/disposition/);
  });

  it('observer can disposition all findings then sign off', () => {
    const app = w1();
    for (const f of aiInspectionService.findingsFor(app.id)) {
      observerService.verifyFinding(f.id, 'ACCEPT', 'ok', undefined, observer());
    }
    const res = observerService.signoff(app.id, observer());
    expect(res.application.state).toBe(WorkflowState.ASSESSOR_REVIEW);
  });
});

describe('Assessor dual-sign + EC vocabulary', () => {
  it('requires two distinct assessor signatures before submission', () => {
    const app = w1();
    for (const f of aiInspectionService.findingsFor(app.id)) {
      observerService.verifyFinding(f.id, 'ACCEPT', 'ok', undefined, observer());
    }
    observerService.signoff(app.id, observer());
    const [a1, a2] = assessors();
    assessorService.sign(app.id, 'Joint report', a1);
    expect(() => assessorService.submit(app.id, a1)).toThrow(/dual assessor/);
    assessorService.sign(app.id, 'Joint report', a2);
    const res = assessorService.submit(app.id, a1);
    expect(res.application.state).toBe(WorkflowState.EC_REVIEW);
  });

  it('EC decision must come from the vocabulary and ASK_COMPLIANCE routes to DEFICIENCY', () => {
    const app = w1();
    for (const f of aiInspectionService.findingsFor(app.id)) {
      observerService.verifyFinding(f.id, 'ACCEPT', 'ok', undefined, observer());
    }
    observerService.signoff(app.id, observer());
    const [a1, a2] = assessors();
    assessorService.sign(app.id, 'Joint report', a1);
    assessorService.sign(app.id, 'Joint report', a2);
    assessorService.submit(app.id, a1);

    const ec = db.users.findOne((u) => u.role === Role.EC_MEMBER)!;
    const res = ecService.decide(app.id, ECDecision.ASK_COMPLIANCE, 'Curable major deficiencies', undefined, ec);
    expect(db.applications.get(app.id)!.state).toBe(WorkflowState.DEFICIENCY);
    expect(res.decision).toBe(ECDecision.ASK_COMPLIANCE);
  });
});
