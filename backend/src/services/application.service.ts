import { db } from '../store/db.js';
import {
  CollegeStatus,
  Role,
  WorkflowAction,
  WorkflowState,
  WorkflowType,
} from '../domain/enums.js';
import { checkWorkflowEligibility } from '../domain/permissions.js';
import { applicationFeeLakh, computeStatutoryDeadlines, requiredDocuments, proformaFields, geoDistanceKm } from '../domain/workflowConfig.js';
import { Application, User } from '../types/index.js';
import { id, nowIso, shortCode } from '../utils/id.js';
import { workflowService } from './workflow.service.js';

export interface CreateApplicationInput {
  collegeId: string;
  workflowType: WorkflowType;
  applicationType: string;
  course: string;
  specialty?: string;
  intake: number;
  documents?: { name: string; type: string; uploaded?: boolean; validUpto?: string }[];
  sourceApplicationId?: string;
  systemInitiated?: boolean;
}

export const applicationService = {
  create(input: CreateApplicationInput, actor: User): Application {
    const college = db.colleges.get(input.collegeId);
    if (!college) throw Object.assign(new Error('College not found'), { status: 404 });

    // Eligibility guard enforced at the service layer (not only the UI).
    const eligible = checkWorkflowEligibility(
      input.workflowType,
      college.status,
      input.systemInitiated ?? false,
    );
    if (!eligible.allowed) {
      throw Object.assign(new Error(eligible.reason), { status: 403 });
    }

    const application: Application = {
      id: id('app'),
      code: shortCode('DD'),
      collegeId: college.id,
      applicantId: actor.id,
      workflowType: input.workflowType,
      state: WorkflowState.DRAFT,
      applicationType: input.applicationType,
      course: input.course,
      specialty: input.specialty,
      intake: input.intake,
      location: { state: college.state, city: college.city, geo: college.geo },
      documents: (input.documents ?? []).map((d) => ({
        id: id('doc'),
        name: d.name,
        type: d.type,
        uploaded: d.uploaded ?? false,
        validUpto: d.validUpto,
      })),
      locked: false,
      sourceApplicationId: input.sourceApplicationId,
      feeLakh: applicationFeeLakh(input.workflowType, college.status === CollegeStatus.NEW ? false : undefined),
      feePaid: true,
      governmentCollege: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return db.applications.insert(application);
  },

  /** Submit: locks an immutable snapshot, then transitions via the engine. */
  submit(applicationId: string, actor: User) {
    const application = db.applications.get(applicationId);
    if (!application) throw Object.assign(new Error('Application not found'), { status: 404 });
    if (application.state !== WorkflowState.DRAFT) {
      throw Object.assign(new Error('Only DRAFT applications can be submitted'), { status: 422 });
    }

    // Gate: every mandatory document must be collected & uploaded first.
    const missing = requiredDocuments(application.workflowType)
      .filter((spec) => spec.gating)
      .filter((spec) => {
        const doc = (application.documents ?? []).find((d) =>
          d.name.toLowerCase().includes(spec.key.toLowerCase()),
        );
        return !doc || !doc.uploaded;
      });
    if (missing.length) {
      throw Object.assign(
        new Error(`Upload mandatory documents before submitting: ${missing.map((m) => m.label).join('; ')}`),
        { status: 422, missingDocuments: missing },
      );
    }

    db.applications.update(applicationId, {
      locked: true,
      submittedSnapshot: JSON.parse(JSON.stringify(application)),
      statutoryDeadlines: computeStatutoryDeadlines(nowIso()),
    });
    // Old-backend submit flow: Draft → Submitted, then Submitted → Under Scrutiny
    // (the applicant drives both edges; scrutiny then runs the checklist).
    workflowService.transition(applicationId, WorkflowAction.SUBMIT, WorkflowState.SUBMITTED, {
      actorId: actor.id,
      actorRole: actor.role,
      reason: 'Applicant submitted application',
    });
    return workflowService.transition(
      applicationId,
      WorkflowAction.START_SCRUTINY,
      WorkflowState.UNDER_SCRUTINY,
      { actorId: actor.id, actorRole: actor.role, reason: 'Forwarded into technical scrutiny' },
    );
  },

  get(applicationId: string): Application | undefined {
    return db.applications.get(applicationId);
  },

  /**
   * Collect / upload documents on a DRAFT application.
   * Replaces the document set; only the owning applicant/consultant may edit,
   * and only while the case is still in DRAFT.
   */
  updateDocuments(
    applicationId: string,
    documents: {
      name: string;
      type: string;
      uploaded?: boolean;
      validUpto?: string;
      kind?: 'file' | 'geo' | 'proforma';
      geo?: { collegeLat: number; collegeLng: number; hospitalLat: number; hospitalLng: number };
      proforma?: { values: Record<string, number> };
    }[],
    actor: User,
  ): Application {
    const application = db.applications.get(applicationId);
    if (!application) throw Object.assign(new Error('Application not found'), { status: 404 });
    if (application.state !== WorkflowState.DRAFT) {
      throw Object.assign(new Error('Documents can only be changed while the case is in Draft'), { status: 422 });
    }
    const owns =
      application.applicantId === actor.id ||
      (actor.delegatedCollegeIds ?? []).includes(application.collegeId);
    if (!owns) {
      throw Object.assign(new Error('You may only edit your own application'), { status: 403 });
    }
    const requiredProforma = proformaFields(application.course, application.intake ?? 0).map((f) => f.key);
    const docs = documents.map((d) => {
      const kind = d.kind ?? 'file';
      if (kind === 'geo') {
        const g = d.geo;
        const hasAll =
          !!g &&
          [g.collegeLat, g.collegeLng, g.hospitalLat, g.hospitalLng].every(
            (n) => typeof n === 'number' && !Number.isNaN(n),
          );
        const geo = hasAll
          ? {
              collegeLat: g!.collegeLat,
              collegeLng: g!.collegeLng,
              hospitalLat: g!.hospitalLat,
              hospitalLng: g!.hospitalLng,
              distanceKm: geoDistanceKm(g!.collegeLat, g!.collegeLng, g!.hospitalLat, g!.hospitalLng),
            }
          : undefined;
        return {
          id: id('doc'),
          name: d.name,
          type: d.type,
          kind,
          geo,
          // Completeness = all four coordinates captured (≤10 km is a compliance
          // check evaluated downstream, not a filing-completeness gate).
          uploaded: !!geo,
        };
      }
      if (kind === 'proforma') {
        const values = d.proforma?.values ?? {};
        const complete = requiredProforma.every(
          (k) => typeof values[k] === 'number' && !Number.isNaN(values[k]),
        );
        return {
          id: id('doc'),
          name: d.name,
          type: d.type,
          kind,
          proforma: { values },
          uploaded: requiredProforma.length > 0 && complete,
        };
      }
      return {
        id: id('doc'),
        name: d.name,
        type: d.type,
        kind,
        uploaded: d.uploaded ?? false,
        validUpto: d.validUpto,
      };
    });
    return db.applications.update(applicationId, { documents: docs })!;
  },

  /** List applications visible to an actor based on role scope. */
  listForActor(actor: User): Application[] {
    const all = db.applications.all();
    switch (actor.role) {
      case Role.APPLICANT:
        return all.filter((a) => a.applicantId === actor.id);
      case Role.CONSULTANT:
        return all.filter((a) => (actor.delegatedCollegeIds ?? []).includes(a.collegeId));
      case Role.DCI_ADMIN:
      case Role.SUPER_ADMIN:
      case Role.GOVERNMENT_AUTHORITY:
        return all;
      default:
        // Officer/inspection/EC roles see only items at their stage.
        return all.filter((a) => stageRoles(a.state).includes(actor.role));
    }
  },

  /** Used by the deficiency module to spawn a Workflow-7 child application. */
  createComplianceVerification(sourceApplicationId: string, actor: User): Application {
    const source = db.applications.get(sourceApplicationId);
    if (!source) throw Object.assign(new Error('Source application not found'), { status: 404 });
    return this.create(
      {
        collegeId: source.collegeId,
        workflowType: WorkflowType.WORKFLOW_7_COMPLIANCE_VERIFICATION,
        applicationType: 'COMPLIANCE_VERIFICATION',
        course: source.course,
        specialty: source.specialty,
        intake: source.intake,
        sourceApplicationId: source.id,
        systemInitiated: true,
      },
      actor,
    );
  },
};

/** Which roles are actively engaged with an application at a given state. */
function stageRoles(state: WorkflowState): Role[] {
  switch (state) {
    case WorkflowState.SUBMITTED:
    case WorkflowState.UNDER_SCRUTINY:
      return [Role.SCRUTINY_OFFICER, Role.CASE_OFFICER];
    case WorkflowState.INSPECTION_SCHEDULED:
      return [Role.CASE_OFFICER, Role.ASSESSOR, Role.OBSERVER];
    case WorkflowState.AI_INSPECTION:
      return [Role.ASSESSOR, Role.OBSERVER];
    case WorkflowState.AI_OBSERVER_REVIEW:
      return [Role.OBSERVER];
    case WorkflowState.ASSESSOR_REVIEW:
      return [Role.ASSESSOR];
    case WorkflowState.EC_REVIEW:
      return [Role.EC_MEMBER];
    case WorkflowState.DEFICIENCY:
      return [Role.COMPLIANCE_OFFICER];
    case WorkflowState.GOVERNMENT_DECISION:
    case WorkflowState.LETTER_OF_INTENT:
    case WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION:
      return [Role.GOVERNMENT_AUTHORITY];
    default:
      return [];
  }
}

export { CollegeStatus };
