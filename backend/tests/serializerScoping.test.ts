import { describe, it, expect, beforeEach } from 'vitest';
import { seed } from '../src/store/seed.js';
import { db } from '../src/store/db.js';
import { serializeApplication } from '../src/serializers/application.serializer.js';
import { APPLICATION_FIELD_SCOPES } from '../src/domain/permissions.js';
import { Role } from '../src/domain/enums.js';
import { User } from '../src/types/index.js';

beforeEach(() => seed());

const userOf = (role: Role) => db.users.findOne((u) => u.role === role)!;
const anyApp = () => db.applications.all()[0];

/** The private college keys that must never reach an unauthorized role. */
const PRIVATE_KEYS = ['trust', 'finance', 'contact'] as const;
function collegeOf(view: Record<string, unknown>): Record<string, unknown> | undefined {
  return view.college as Record<string, unknown> | undefined;
}

describe('Serializer envelope is always present', () => {
  it('attaches viewerRole, allowedActions, visibleSections, nextAction, blockedReason, guidance', () => {
    const app = anyApp();
    for (const role of Object.values(Role)) {
      const view = serializeApplication(app, userOf(role) ?? ({ role } as User));
      expect(view).toHaveProperty('viewerRole');
      expect(view).toHaveProperty('allowedActions');
      expect(view).toHaveProperty('visibleSections');
      expect(view).toHaveProperty('nextAction');
      expect(view).toHaveProperty('blockedReason');
      expect(view).toHaveProperty('guidance');
      expect(Array.isArray(view.allowedActions)).toBe(true);
    }
  });
});

describe('PART 1 — strict role-based college disclosure', () => {
  it('Applicant CAN see own full college (trust + finance + contact)', () => {
    const applicant = db.users.findOne((u) => u.role === Role.APPLICANT)!;
    const ownApp = db.applications.find((a) => a.applicantId === applicant.id)[0];
    const college = collegeOf(serializeApplication(ownApp, applicant))!;
    expect(college.trust).toBeDefined();
    expect(college.finance).toBeDefined();
    expect(college.contact).toBeDefined();
  });

  it('Applicant CANNOT see full college of an application they do NOT own', () => {
    const applicant = db.users.findOne((u) => u.role === Role.APPLICANT)!;
    const foreignApp = db.applications.find((a) => a.applicantId !== applicant.id)[0];
    const college = collegeOf(serializeApplication(foreignApp, applicant));
    // Down-graded to identity — no private trust/finance/contact.
    for (const k of PRIVATE_KEYS) expect(college?.[k]).toBeUndefined();
  });

  it('Linked Consultant CAN see delegated college full details', () => {
    const consultant = db.users.findOne((u) => u.role === Role.CONSULTANT)!;
    const delegatedId = (consultant.delegatedCollegeIds ?? [])[0];
    const app = db.applications.find((a) => a.collegeId === delegatedId)[0];
    const college = collegeOf(serializeApplication(app, consultant))!;
    expect(college.trust).toBeDefined();
    expect(college.finance).toBeDefined();
  });

  it('DCI Admin and Super Admin CAN see full college details', () => {
    const app = anyApp();
    for (const role of [Role.DCI_ADMIN, Role.SUPER_ADMIN]) {
      const college = collegeOf(serializeApplication(app, userOf(role)))!;
      expect(college.trust).toBeDefined();
      expect(college.finance).toBeDefined();
      expect(college.contact).toBeDefined();
    }
  });

  it('EC member CANNOT see full college details', () => {
    const app = anyApp();
    const college = collegeOf(serializeApplication(app, userOf(Role.EC_MEMBER)));
    for (const k of PRIVATE_KEYS) expect(college?.[k]).toBeUndefined();
    expect(college?.hospitalAttached).toBeUndefined();
  });

  it('Observer CANNOT see full college details (location only)', () => {
    const app = anyApp();
    const college = collegeOf(serializeApplication(app, userOf(Role.OBSERVER)));
    for (const k of PRIVATE_KEYS) expect(college?.[k]).toBeUndefined();
    expect(college?.registrationNo).toBeUndefined();
    expect(college?.name).toBeUndefined();
    expect(college?.state).toBeDefined(); // needed for the visit
  });

  it('Assessor CANNOT see trust/financial/private applicant data', () => {
    const app = anyApp();
    const college = collegeOf(serializeApplication(app, userOf(Role.ASSESSOR)));
    for (const k of PRIVATE_KEYS) expect(college?.[k]).toBeUndefined();
    expect(college?.state).toBeDefined(); // visit logistics only
  });

  it('Case Officer CANNOT see unnecessary private college details', () => {
    const app = anyApp();
    const college = collegeOf(serializeApplication(app, userOf(Role.CASE_OFFICER)));
    for (const k of PRIVATE_KEYS) expect(college?.[k]).toBeUndefined();
    expect(college?.state).toBeDefined();
    expect(college?.city).toBeDefined();
  });

  it('Government Authority sees statutory college details only (no trust/finance)', () => {
    const app = anyApp();
    const college = collegeOf(serializeApplication(app, userOf(Role.GOVERNMENT_AUTHORITY)))!;
    expect(college.name).toBeDefined();
    expect(college.status).toBeDefined();
    expect(college.trust).toBeUndefined();
    expect(college.finance).toBeUndefined();
    // statutory letter address is allowed, but not phone/email
    expect((college as Record<string, unknown>).contact).toBeUndefined();
  });
});

describe('PART 1 — strict role-based application field scoping', () => {
  it('Scrutiny Officer does NOT receive EC-only risk score', () => {
    const app = anyApp();
    const view = serializeApplication(app, userOf(Role.SCRUTINY_OFFICER));
    expect(view.riskScore).toBeUndefined();
    expect(view.bankGuarantee).toBeUndefined();
    expect(view.code).toBeDefined();
    expect(view.documents).toBeDefined();
  });

  it('Government Authority view is the statutory decision surface only', () => {
    const app = anyApp();
    const view = serializeApplication(app, userOf(Role.GOVERNMENT_AUTHORITY));
    // Statutory decision fields are part of the government scope...
    const govScope = APPLICATION_FIELD_SCOPES[Role.GOVERNMENT_AUTHORITY] as string[];
    expect(govScope).toContain('bankGuarantee');
    expect(govScope).toContain('ecDecision');
    // ...while raw applicant documents / scrutiny checklist never leak.
    expect(govScope).not.toContain('documents');
    expect(govScope).not.toContain('checklist');
    expect(view.documents).toBeUndefined();
    expect(view.checklist).toBeUndefined();
    expect(view.code).toBeDefined();
  });

  it('Applicant (owner) receives the full application record', () => {
    const applicant = db.users.findOne((u) => u.role === Role.APPLICANT)!;
    const ownApp = db.applications.find((a) => a.applicantId === applicant.id)[0];
    const view = serializeApplication(ownApp, applicant);
    expect(view.documents).toBeDefined();
    expect(view.collegeId).toBeDefined();
    expect(view.feePaid).toBeDefined();
  });
});
