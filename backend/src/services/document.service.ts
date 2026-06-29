/**
 * Statutory document generation.
 *
 * Produces structured, auditable document records for each statutory output
 * the regulator issues: Joint Assessment Report, Deficiency Letter, EC
 * Recommendation, Letter of Intent, and Letter of Permission / Recognition.
 * Each document carries a verification ID and is stored immutably.
 *
 * Source of truth: 02_FRS (Module K) + 03_Workflow_and_State_Machine.md
 */
import { db } from '../store/db.js';
import { ECDecision, Role } from '../domain/enums.js';
import { bankGuaranteeFor } from '../domain/workflowConfig.js';
import { Application, GeneratedDocument } from '../types/index.js';
import { id, nowIso } from '../utils/id.js';

function ref(prefix: string): string {
  return `${prefix}/${new Date().getFullYear()}/${Math.floor(Math.random() * 90000 + 10000)}`;
}

function store(doc: Omit<GeneratedDocument, 'id' | 'verificationId' | 'createdAt'>): GeneratedDocument {
  return db.documents.insert({
    ...doc,
    id: id('gdoc'),
    verificationId: `VID-${id('v').slice(-8).toUpperCase()}`,
    createdAt: nowIso(),
  });
}

export const documentService = {
  list(applicationId: string): GeneratedDocument[] {
    return db.documents.find((d) => d.applicationId === applicationId);
  },

  get(documentId: string): GeneratedDocument | undefined {
    return db.documents.get(documentId);
  },

  jointAssessmentReport(app: Application, summary: string, signatories: string[]): GeneratedDocument {
    const deficiencies = db.deficiencies.find((d) => d.applicationId === app.id);
    const body = [
      `Joint Assessment Report — ${app.code}`,
      `Workflow: ${app.workflowType}`,
      `College: ${db.colleges.get(app.collegeId)?.name ?? app.collegeId}`,
      `Course/Intake: ${app.course} / ${app.intake}`,
      `Risk score: ${app.riskScore ?? 0} (${app.riskLevel ?? 'LOW'})`,
      `Deficiencies recorded: ${deficiencies.length}`,
      ...deficiencies.map((d) => ` • [${d.severity}] ${d.requirement} — ${d.deficiency}`),
      '',
      `Assessor summary: ${summary || '(none)'}`,
    ];
    return store({
      applicationId: app.id,
      type: 'JOINT_ASSESSMENT_REPORT',
      title: `Joint Assessment Report ${app.code}`,
      reference: ref('JAR'),
      body,
      issuedByRole: Role.ASSESSOR,
      issuedById: signatories[0] ?? 'system',
      signatories,
    });
  },

  deficiencyLetter(app: Application, issuedById: string): GeneratedDocument {
    const deficiencies = db.deficiencies.find(
      (d) => d.applicationId === app.id && d.status !== 'RESOLVED',
    );
    const body = [
      `Deficiency Letter — ${app.code}`,
      `The following deficiencies must be rectified and compliance submitted:`,
      ...deficiencies.map((d, i) => `${i + 1}. [${d.severity}] ${d.requirement} — ${d.deficiency}`),
      '',
      `Submit your compliance per line with supporting evidence before the statutory cut-off.`,
    ];
    return store({
      applicationId: app.id,
      type: 'DEFICIENCY_LETTER',
      title: `Deficiency Letter ${app.code}`,
      reference: ref('DEF'),
      body,
      issuedByRole: Role.EC_MEMBER,
      issuedById,
      signatories: [issuedById],
    });
  },

  ecRecommendation(app: Application, decision: ECDecision, rationale: string, issuedById: string): GeneratedDocument {
    const body = [
      `Expert Committee Recommendation — ${app.code}`,
      `Decision: ${decision}`,
      `Risk score: ${app.riskScore ?? 0} (${app.riskLevel ?? 'LOW'})`,
      app.intakeCap ? `Capacity restrained to: ${app.intakeCap} seats` : '',
      app.undertaking ? `Undertaking required: ${app.undertaking}` : '',
      '',
      `Rationale: ${rationale || '(none)'}`,
    ].filter(Boolean);
    return store({
      applicationId: app.id,
      type: 'EC_RECOMMENDATION',
      title: `EC Recommendation ${app.code}`,
      reference: ref('ECR'),
      body,
      issuedByRole: Role.EC_MEMBER,
      issuedById,
      signatories: [issuedById],
    });
  },

  letterOfIntent(app: Application, issuedById: string): GeneratedDocument {
    const bg = bankGuaranteeFor({
      workflowType: app.workflowType,
      course: app.course,
      intake: app.approvedIntake ?? app.intakeCap ?? app.intake,
      governmentCollege: app.governmentCollege,
    });
    const body = [
      `Letter of Intent — ${app.code}`,
      `The Central Government intends to grant permission subject to the conditions below.`,
      bg.applicable
        ? `Furnish a performance bank guarantee of ₹${bg.amountLakh} lakh (${bg.basis}).`
        : `Bank guarantee: ${bg.basis}.`,
      app.undertaking ? `Undertaking: ${app.undertaking}` : '',
      `Accept the conditions to proceed to the Letter of Permission.`,
    ].filter(Boolean);
    return store({
      applicationId: app.id,
      type: 'LETTER_OF_INTENT',
      title: `Letter of Intent ${app.code}`,
      reference: ref('LOI'),
      body,
      issuedByRole: Role.GOVERNMENT_AUTHORITY,
      issuedById,
      signatories: [issuedById],
    });
  },

  letterOfPermission(app: Application, issuedById: string): GeneratedDocument {
    const isRecognition = app.workflowType.includes('RECOGNITION');
    const grantedIntake = app.approvedIntake ?? app.intakeCap ?? app.intake;
    const body = [
      `${isRecognition ? 'Recognition Letter' : 'Letter of Permission'} — ${app.code}`,
      `College: ${db.colleges.get(app.collegeId)?.name ?? app.collegeId}`,
      `Course: ${app.course}`,
      `Granted intake: ${grantedIntake} seats`,
      `Valid for the academic session, subject to yearly renewal.`,
    ];
    return store({
      applicationId: app.id,
      type: isRecognition ? 'RECOGNITION_LETTER' : 'LETTER_OF_PERMISSION',
      title: `${isRecognition ? 'Recognition Letter' : 'Letter of Permission'} ${app.code}`,
      reference: ref(isRecognition ? 'REC' : 'LOP'),
      body,
      issuedByRole: Role.GOVERNMENT_AUTHORITY,
      issuedById,
      signatories: [issuedById],
    });
  },
};
