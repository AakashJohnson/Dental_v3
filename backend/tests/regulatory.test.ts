import { describe, it, expect, beforeEach } from 'vitest';
import { seed } from '../src/store/seed.js';
import { db } from '../src/store/db.js';
import { applicationService } from '../src/services/application.service.js';
import { scrutinyService } from '../src/services/scrutiny.service.js';
import { complianceService } from '../src/services/compliance.service.js';
import { aiInspectionService } from '../src/services/aiInspection.service.js';
import { documentService } from '../src/services/document.service.js';
import { bankGuaranteeFor } from '../src/domain/workflowConfig.js';
import {
  ECDecision,
  RiskLevel,
  Severity,
  WorkflowState,
  WorkflowType,
} from '../src/domain/enums.js';
import { User } from '../src/types/index.js';

beforeEach(() => seed());

const applicant = () => db.users.findOne((u) => u.username === 'applicant_new_college')!;
const newCollegeId = () => db.colleges.findOne((c) => c.status === 'NEW')!.id;

const COMPLETE_DOCS = [
  { name: 'Essentiality Certificate', type: 'STATUTORY', uploaded: true, validUpto: '2030-12-31' },
  { name: 'Affiliation Letter', type: 'STATUTORY', uploaded: true, validUpto: '2030-12-31' },
  { name: 'Land Documents', type: 'STATUTORY', uploaded: true },
  { name: 'Site & Hospital Distance Map Proof', type: 'DISTANCE_MAP', uploaded: true },
  { name: 'Inspection Proforma (Self-Assessment)', type: 'PROFORMA', uploaded: true },
];

function newWf1App(documents = COMPLETE_DOCS): string {
  return applicationService.create(
    {
      collegeId: newCollegeId(),
      workflowType: WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG,
      applicationType: 'NEW_COLLEGE',
      course: 'BDS',
      intake: 50,
      documents,
    },
    applicant() as User,
  ).id;
}

describe('Submission stamps fee + statutory deadlines', () => {
  it('sets the workflow fee and computes statutory deadlines on submit', () => {
    const appId = newWf1App();
    const draft = db.applications.get(appId)!;
    expect(draft.feeLakh).toBe(6); // WF1 application fee (Reg 7)
    expect(draft.feePaid).toBe(true);

    applicationService.submit(appId, applicant() as User);
    const submitted = db.applications.get(appId)!;
    // Submit drives Draft → Submitted → Under Scrutiny in one flow (old behaviour).
    expect(submitted.state).toBe(WorkflowState.UNDER_SCRUTINY);
    expect(submitted.statutoryDeadlines?.[WorkflowState.SUBMITTED]).toBeDefined();
    expect(submitted.statutoryDeadlines?.[WorkflowState.GOVERNMENT_DECISION]).toBeDefined();
  });
});

describe('Scrutiny gates (Reg 6)', () => {
  it('passes when all mandatory gating documents are present', () => {
    const appId = newWf1App();
    applicationService.submit(appId, applicant() as User);
    const gates = scrutinyService.evaluateGates(appId);
    expect(gates.passed).toBe(true);
    expect(gates.gates.find((g) => g.key === 'doc:essentiality')?.status).toBe('PASS');
    expect(gates.gates.find((g) => g.key === 'doc:land')?.status).toBe('PASS');
    expect(gates.gates.find((g) => g.key === 'fee')?.status).toBe('PASS');
  });

  it('blocks submission until all mandatory documents are collected', () => {
    const appId = newWf1App([
      { name: 'Essentiality Certificate', type: 'STATUTORY', uploaded: true, validUpto: '2030-12-31' },
      { name: 'Affiliation Letter', type: 'STATUTORY', uploaded: true, validUpto: '2030-12-31' },
      // Land, Distance Map and Inspection Proforma intentionally omitted.
    ]);
    expect(() => applicationService.submit(appId, applicant() as User)).toThrow(/mandatory documents/i);
    expect(db.applications.get(appId)!.state).toBe(WorkflowState.DRAFT);

    const gates = scrutinyService.evaluateGates(appId);
    expect(gates.passed).toBe(false);
    expect(gates.gates.find((g) => g.key === 'doc:land')?.status).toBe('FAIL');
  });

  it('allows submission once the missing documents are uploaded', () => {
    const appId = newWf1App([
      { name: 'Essentiality Certificate', type: 'STATUTORY', uploaded: true, validUpto: '2030-12-31' },
      { name: 'Affiliation Letter', type: 'STATUTORY', uploaded: true, validUpto: '2030-12-31' },
    ]);
    expect(() => applicationService.submit(appId, applicant() as User)).toThrow();
    // Collect the remaining documents on the draft, then submit succeeds.
    applicationService.updateDocuments(appId, COMPLETE_DOCS, applicant() as User);
    const res = applicationService.submit(appId, applicant() as User);
    expect(res.application.state).toBe(WorkflowState.UNDER_SCRUTINY);
  });
});

describe('Compliance engine — norm-driven evaluation', () => {
  it('clean capture yields low risk and an APPROVE-class suggestion', () => {
    const appId = newWf1App();
    const session = aiInspectionService.openSession(appId, applicant() as User);
    aiInspectionService.runFullCapture(appId, session.id, 'clean');

    const result = complianceService.evaluateApplication(appId);
    expect(result.deficiencies.some((d) => d.severity === Severity.INTEGRITY)).toBe(false);
    expect(result.deficiencies.some((d) => d.severity === Severity.GROSS)).toBe(false);
    expect([RiskLevel.LOW, RiskLevel.MEDIUM]).toContain(result.riskLevel);
    expect([ECDecision.APPROVE, ECDecision.APPROVE_ON_UNDERTAKING]).toContain(
      result.suggestedDecision,
    );
  });

  it('mixed capture surfaces an integrity deficiency and restrains capacity for WF1', () => {
    const appId = newWf1App();
    const session = aiInspectionService.openSession(appId, applicant() as User);
    aiInspectionService.runFullCapture(appId, session.id, 'mixed');

    const result = complianceService.evaluateApplication(appId);
    expect(result.deficiencies.some((d) => d.severity === Severity.INTEGRITY)).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(10);
    expect(result.riskLevel).toBe(RiskLevel.HIGH);
    expect(result.suggestedDecision).toBe(ECDecision.PARTIAL_APPROVAL_OR_RESTRAIN_CAPACITY);
  });
});

describe('Bank guarantee scales by workflow / intake / course (Reg 10/17/23)', () => {
  it('computes the correct guarantee for each scenario', () => {
    expect(bankGuaranteeFor({ workflowType: WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG, course: 'BDS', intake: 50 })).toMatchObject({ applicable: true, amountLakh: 100 });
    expect(bankGuaranteeFor({ workflowType: WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG, course: 'BDS', intake: 100 })).toMatchObject({ applicable: true, amountLakh: 200 });
    expect(bankGuaranteeFor({ workflowType: WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG, course: 'MDS', intake: 6 })).toMatchObject({ applicable: true, amountLakh: 60 });
    expect(bankGuaranteeFor({ workflowType: WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS, course: 'BDS', intake: 50 })).toMatchObject({ applicable: true, amountLakh: 50 });
    expect(bankGuaranteeFor({ workflowType: WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS, course: 'BDS', intake: 100 })).toMatchObject({ applicable: true, amountLakh: 100 });
    expect(bankGuaranteeFor({ workflowType: WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG, course: 'BDS', intake: 50, governmentCollege: true })).toMatchObject({ applicable: false });
  });
});

describe('Statutory document generation', () => {
  it('emits verifiable, referenced artifacts that list() returns', () => {
    const appId = newWf1App();
    const app = db.applications.get(appId)!;
    const jar = documentService.jointAssessmentReport(app, 'Inspection complete', ['assessor-1', 'assessor-2']);
    const letter = documentService.deficiencyLetter(app, 'ec-1');

    expect(jar.verificationId).toMatch(/^VID-/);
    expect(jar.reference).toMatch(/^JAR\//);
    expect(letter.type).toBe('DEFICIENCY_LETTER');

    const docs = documentService.list(appId);
    expect(docs.map((d) => d.id)).toEqual(expect.arrayContaining([jar.id, letter.id]));
  });
});
