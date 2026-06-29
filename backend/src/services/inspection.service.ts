import { db } from '../store/db.js';
import { WorkflowAction, WorkflowState } from '../domain/enums.js';
import { COIDeclaration, InspectionSchedule, User } from '../types/index.js';
import { id, nowIso } from '../utils/id.js';
import { workflowService } from './workflow.service.js';

export const inspectionService = {
  /** Assign a team: minimum 2 assessors + 1 observer, with COI checks. */
  assignTeam(applicationId: string, assessorIds: string[], observerId: string, dates: string[]) {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    if (assessorIds.length < 2) {
      throw Object.assign(new Error('At least 2 assessors are required'), { status: 422 });
    }
    if (!observerId) {
      throw Object.assign(new Error('An observer is required'), { status: 422 });
    }
    // COI / region check: assessors must not be from the same state as the college.
    const conflicted = [...assessorIds, observerId].filter((uid) => {
      const u = db.users.get(uid);
      return u?.coi?.states?.includes(app.location.state);
    });
    if (conflicted.length) {
      throw Object.assign(
        new Error(`Conflict of interest for team members from college state ${app.location.state}.`),
        { status: 422 },
      );
    }

    const schedule: InspectionSchedule = {
      scheduledDates: dates,
      assessorIds,
      observerId,
      approvedByCaseOfficer: false,
      visitCredentialIssued: false,
      multiDay: dates.length > 1,
    };
    return db.applications.update(applicationId, { scheduling: schedule })!;
  },

  recordCOI(input: { userId: string; applicationId: string; conflict: boolean; note?: string }): COIDeclaration {
    const decl: COIDeclaration = {
      id: id('coi'),
      createdAt: nowIso(),
      ...input,
    };
    return db.coiDeclarations.insert(decl);
  },

  approveSchedule(applicationId: string) {
    const app = db.applications.get(applicationId);
    if (!app?.scheduling) throw Object.assign(new Error('No team assigned'), { status: 422 });
    return db.applications.update(applicationId, {
      scheduling: { ...app.scheduling, approvedByCaseOfficer: true, visitCredentialIssued: true },
    })!;
  },

  /** Transition from UNDER_SCRUTINY → INSPECTION_SCHEDULED. */
  schedule(applicationId: string, actor: User) {
    return workflowService.transition(
      applicationId,
      WorkflowAction.SCHEDULE_INSPECTION,
      WorkflowState.INSPECTION_SCHEDULED,
      { actorId: actor.id, actorRole: actor.role, reason: 'Inspection scheduled' },
    );
  },

  /** Begin on-site AI inspection. */
  start(applicationId: string, actor: User) {
    const app = db.applications.get(applicationId);
    if (!app?.scheduling?.approvedByCaseOfficer) {
      throw Object.assign(new Error('Schedule must be approved by Case Officer before starting'), {
        status: 422,
      });
    }
    return workflowService.transition(
      applicationId,
      WorkflowAction.START_AI_INSPECTION,
      WorkflowState.AI_INSPECTION,
      { actorId: actor.id, actorRole: actor.role, reason: 'AI inspection started' },
    );
  },
};
