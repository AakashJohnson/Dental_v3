/**
 * Role-scoped serializers — backend-level field filtering.
 * A role only ever receives the fields declared in APPLICATION_FIELD_SCOPES,
 * plus a role-scoped college projection and its action/guidance envelope.
 * This is enforced server-side; the frontend never relies on hiding alone.
 */
import { APPLICATION_FIELD_SCOPES } from '../domain/permissions.js';
import { buildActionEnvelope } from '../domain/actions.js';
import { computeGuidance } from '../services/guidance.service.js';
import { Role } from '../domain/enums.js';
import { db } from '../store/db.js';
import { Application, User } from '../types/index.js';
import { collegeDisclosureFor, serializeCollege } from './college.serializer.js';

/** A viewer may be a full User (preferred — enables ownership) or a bare Role. */
export type Viewer = User | Role;

function toRole(viewer: Viewer): Role {
  return typeof viewer === 'string' ? viewer : viewer.role;
}

/** Does this viewer own / is delegated to the application's college? */
function ownsApplication(viewer: Viewer, application: Application): boolean {
  if (typeof viewer === 'string') return false; // role-only viewer: no identity
  if (viewer.role === Role.APPLICANT) return application.applicantId === viewer.id;
  if (viewer.role === Role.CONSULTANT) {
    return (viewer.delegatedCollegeIds ?? []).includes(application.collegeId);
  }
  return false;
}

/** Build the role-enriched, then field-projected, view of an application. */
export function serializeApplication(application: Application, viewer: Viewer): Record<string, unknown> {
  const role = toRole(viewer);

  // Derived/computed fields some roles are entitled to see.
  const enriched: Record<string, unknown> = {
    ...application,
    deficiencyList: db.deficiencies.find((d) => d.applicationId === application.id),
    evidenceLinks: db.evidence
      .find((e) => e.applicationId === application.id)
      .map((e) => ({ id: e.id, category: e.category, fileRef: e.fileRef })),
    aiFindingsSummary: summariseFindings(application.id),
    assessorSummary:
      db.assessorReports.findOne((r) => r.applicationId === application.id)?.summary ?? null,
    complianceDelta: complianceDelta(application.id),
    applicantReplies: db.deficiencies
      .find((d) => d.applicationId === application.id)
      .map((d) => ({ id: d.id, reply: d.applicantReply })),
    complianceEvidence: db.deficiencies
      .find((d) => d.applicationId === application.id)
      .flatMap((d) => d.evidenceUploads),
    evidenceSections: distinctSections(application.id),
  };

  // Role + ownership scoped college projection (never the raw college record).
  const college = db.colleges.get(application.collegeId);
  const collegeView = typeof viewer === 'string'
    ? serializeCollege(college, role === Role.DCI_ADMIN || role === Role.SUPER_ADMIN ? 'full' : 'identity')
    : serializeCollege(college, collegeDisclosureFor(viewer, college!, ownsApplication(viewer, application)));

  const scope = APPLICATION_FIELD_SCOPES[role];
  // The action envelope + guidance are ALWAYS attached, regardless of field
  // scope, so the frontend renders buttons from `allowedActions` (never roles).
  const envelope = buildActionEnvelope({ role }, application);
  const guidance = computeGuidance(role, application);

  if (scope === '*') {
    return { ...enriched, college: collegeView, ...envelope, guidance };
  }

  const out: Record<string, unknown> = {};
  for (const field of scope) {
    if (field in enriched) out[field] = enriched[field];
  }
  return { ...out, college: collegeView, ...envelope, guidance };
}

export function serializeMany(applications: Application[], viewer: Viewer): Record<string, unknown>[] {
  return applications.map((a) => serializeApplication(a, viewer));
}

function summariseFindings(applicationId: string) {
  const findings = db.findings.find((f) => f.applicationId === applicationId);
  return {
    total: findings.length,
    compliant: findings.filter((f) => f.finalVerdict === 'COMPLIANT' || f.aiVerdict === 'COMPLIANT')
      .length,
    deficient: findings.filter((f) => f.aiVerdict === 'DEFICIENT').length,
    needsReview: findings.filter((f) => f.status === 'NEEDS_HUMAN_REVIEW').length,
    quarantined: findings.filter((f) => f.status === 'QUARANTINED').length,
  };
}

function distinctSections(applicationId: string): string[] {
  const sections = new Set(db.findings.find((f) => f.applicationId === applicationId).map((f) => f.section));
  return [...sections];
}

function complianceDelta(applicationId: string) {
  const items = db.deficiencies.find((d) => d.applicationId === applicationId);
  return {
    total: items.length,
    resolved: items.filter((d) => d.status === 'RESOLVED').length,
    outstanding: items.filter((d) => d.status === 'OUTSTANDING').length,
  };
}
