import { describe, it, expect, beforeEach } from 'vitest';
import { seed } from '../src/store/seed.js';
import { db } from '../src/store/db.js';
import { applicationService } from '../src/services/application.service.js';
import { scrutinyService } from '../src/services/scrutiny.service.js';
import { inspectionService } from '../src/services/inspection.service.js';
import { aiInspectionService } from '../src/services/aiInspection.service.js';
import { observerService } from '../src/services/observer.service.js';
import { assessorService } from '../src/services/assessor.service.js';
import { ecService } from '../src/services/ec.service.js';
import { governmentService } from '../src/services/government.service.js';
import { transitionApplication } from '../src/services/workflow.service.js';
import { Role, WorkflowState, WorkflowAction, ECDecision } from '../src/domain/enums.js';

beforeEach(() => seed());

const u = (role: Role) => db.users.findOne((x) => x.role === role)!;
const usersOf = (role: Role) => db.users.find((x) => x.role === role);

/**
 * End-to-end proof that a brand-new application walks the FULL canonical state
 * machine DRAFT → … → APPROVED, with each edge driven by the correct role
 * through the centralized engine — never by direct status mutation.
 */
describe('Full lifecycle: DRAFT → APPROVED (every edge, correct role)', () => {
  it('walks all eleven forward edges and lands APPROVED', () => {
    // Re-use the seeded DRAFT application (mandatory documents already uploaded).
    const draft = db.applications.find((a) => a.state === WorkflowState.DRAFT)[0];
    const applicant = db.users.get(draft.applicantId)!;
    const id = draft.id;

    // 1+2. DRAFT → SUBMITTED → UNDER_SCRUTINY  (applicant submits)
    applicationService.submit(id, applicant);
    expect(db.applications.get(id)!.state).toBe(WorkflowState.UNDER_SCRUTINY);

    // 3. UNDER_SCRUTINY → INSPECTION_SCHEDULED  (scrutiny officer passes)
    scrutinyService.pass(id, u(Role.SCRUTINY_OFFICER));
    expect(db.applications.get(id)!.state).toBe(WorkflowState.INSPECTION_SCHEDULED);

    // Case officer assigns a 2-assessor + observer team and approves the schedule.
    const [a1, a2] = usersOf(Role.ASSESSOR);
    const obs = u(Role.OBSERVER);
    inspectionService.assignTeam(id, [a1.id, a2.id], obs.id, ['2026-08-01']);
    inspectionService.approveSchedule(id);

    // 4. INSPECTION_SCHEDULED → AI_INSPECTION  (assessor starts capture)
    inspectionService.start(id, a1);
    expect(db.applications.get(id)!.state).toBe(WorkflowState.AI_INSPECTION);

    const session = aiInspectionService.openSession(id, a1);
    aiInspectionService.runFullCapture(id, session.id, 'clean');

    // 5. AI_INSPECTION → AI_OBSERVER_REVIEW  (assessor sends to observer)
    transitionApplication({
      applicationId: id,
      toStatus: WorkflowState.AI_OBSERVER_REVIEW,
      action: WorkflowAction.SEND_TO_OBSERVER,
      actorId: a1.id,
      actorRole: Role.ASSESSOR,
    });
    expect(db.applications.get(id)!.state).toBe(WorkflowState.AI_OBSERVER_REVIEW);

    // 6. AI_OBSERVER_REVIEW → ASSESSOR_REVIEW  (observer dispositions + signs off)
    for (const f of aiInspectionService.findingsFor(id)) {
      observerService.verifyFinding(f.id, 'ACCEPT', 'ok', undefined, obs);
    }
    observerService.signoff(id, obs);
    expect(db.applications.get(id)!.state).toBe(WorkflowState.ASSESSOR_REVIEW);

    // 7. ASSESSOR_REVIEW → EC_REVIEW  (dual-signed assessor report)
    assessorService.sign(id, 'Joint report', a1);
    assessorService.sign(id, 'Joint report', a2);
    assessorService.submit(id, a1);
    expect(db.applications.get(id)!.state).toBe(WorkflowState.EC_REVIEW);

    // 8. EC_REVIEW → GOVERNMENT_DECISION  (EC recommends approval)
    ecService.decide(id, ECDecision.APPROVE, 'Compliant', undefined, u(Role.EC_MEMBER));
    expect(db.applications.get(id)!.state).toBe(WorkflowState.GOVERNMENT_DECISION);

    // 9. GOVERNMENT_DECISION → LETTER_OF_INTENT  (government issues LOI)
    const gov = u(Role.GOVERNMENT_AUTHORITY);
    governmentService.issueLOI(id, gov);
    expect(db.applications.get(id)!.state).toBe(WorkflowState.LETTER_OF_INTENT);

    // Bank guarantee gate before LOP (always verified; the engine records a
    // "N/A" guarantee when none is statutorily required for this workflow).
    const required = governmentService.detail(id).requiredBankGuarantee;
    governmentService.verifyBankGuarantee(id, {
      amountLakh: required.applicable ? required.amountLakh : 0,
      bank: 'State Bank',
      reference: 'BG-E2E',
      validUpto: '2030-12-31',
    });

    // 10+11. LOI → LOP → APPROVED  (government issues LOP)
    governmentService.issueLOP(id, gov);
    expect(db.applications.get(id)!.state).toBe(WorkflowState.APPROVED);

    // The whole journey is auditable and append-only.
    const trail = db.audit.find((e) => e.applicationId === id).map((e) => e.toState);
    expect(trail).toEqual(
      expect.arrayContaining([
        WorkflowState.SUBMITTED,
        WorkflowState.UNDER_SCRUTINY,
        WorkflowState.INSPECTION_SCHEDULED,
        WorkflowState.AI_INSPECTION,
        WorkflowState.AI_OBSERVER_REVIEW,
        WorkflowState.ASSESSOR_REVIEW,
        WorkflowState.EC_REVIEW,
        WorkflowState.GOVERNMENT_DECISION,
        WorkflowState.LETTER_OF_INTENT,
        WorkflowState.APPROVED,
      ]),
    );
  });

  it('refuses to skip a stage even for a DCI admin (no direct status mutation)', () => {
    const draft = db.applications.find((a) => a.state === WorkflowState.DRAFT)[0];
    expect(() =>
      transitionApplication({
        applicationId: draft.id,
        toStatus: WorkflowState.APPROVED,
        actorId: u(Role.DCI_ADMIN).id,
        actorRole: Role.DCI_ADMIN,
      }),
    ).toThrow(/Invalid application status transition/);
  });
});
