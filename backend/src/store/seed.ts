/**
 * DantaDrishti — demo seed data.
 * Creates one user per role, demo colleges, applications for all 7 workflows,
 * and a representative set of AI findings (compliant, deficient, low-confidence,
 * geo-mismatch, absent faculty, census mismatch).
 *
 * Default password for ALL demo users: Passw0rd!
 */
import bcrypt from 'bcryptjs';
import { db, resetDb } from './db.js';
import {
  CollegeStatus,
  Role,
  WorkflowState,
  WorkflowType,
} from '../domain/enums.js';
import { Application, College, User } from '../types/index.js';
import { id, nowIso, shortCode } from '../utils/id.js';
import { aiInspectionService } from '../services/aiInspection.service.js';
import { seedNormRules } from '../domain/normRules.js';
import { applicationFeeLakh, computeStatutoryDeadlines } from '../domain/workflowConfig.js';

const PASSWORD = 'Passw0rd!';

function mkUser(partial: Omit<User, 'id' | 'passwordHash' | 'createdAt'>): User {
  return db.users.insert({
    id: id('usr'),
    passwordHash: bcrypt.hashSync(PASSWORD, 10),
    createdAt: nowIso(),
    ...partial,
  });
}

function mkCollege(partial: Omit<College, 'id' | 'createdAt'>): College {
  return db.colleges.insert({ id: id('col'), createdAt: nowIso(), ...partial });
}

export function seed(): void {
  resetDb();

  // ---- Proforma NormRule registry (the compliance rule table) -------------
  seedNormRules((rule) => db.normRules.insert(rule));

  // ---- Colleges -----------------------------------------------------------
  const newCollege = mkCollege({
    name: 'Sunrise Dental College (Proposed)',
    status: CollegeStatus.NEW,
    state: 'Karnataka',
    city: 'Mysuru',
    geo: { lat: 12.2958, lng: 76.6394 },
    courses: [{ course: 'BDS', intake: 50 }],
    hospitalAttached: { name: 'Sunrise General Hospital', beds: 320, distanceKm: 4 },
    trust: { name: 'Sunrise Educational & Charitable Trust', registrationType: 'Public Charitable Trust', panOrRegId: 'AAATS1234K' },
    finance: { corpusFundLakh: 1200, bankBalanceLakh: 340 },
    contact: { email: 'office@sunrise.edu', phone: '+91-821-2400000', address: '12 Ring Road, Mysuru, Karnataka 570017' },
  });

  const existingCollege = mkCollege({
    name: 'Heritage Institute of Dental Sciences',
    status: CollegeStatus.APPROVED,
    state: 'Maharashtra',
    city: 'Pune',
    geo: { lat: 18.5204, lng: 73.8567 },
    courses: [
      { course: 'BDS', intake: 100 },
      { course: 'MDS', intake: 24 },
    ],
    registrationNo: 'DCI-MH-0421',
    hospitalAttached: { name: 'Heritage Medical College Hospital', beds: 700, distanceKm: 6 },
    trust: { name: 'Heritage Health & Education Society', registrationType: 'Society', panOrRegId: 'AABTH5678L' },
    finance: { corpusFundLakh: 3400, bankBalanceLakh: 980 },
    contact: { email: 'principal@heritage.edu', phone: '+91-20-26000000', address: '5 College Road, Pune, Maharashtra 411001' },
  });

  const recognizedCollege = mkCollege({
    name: 'Metro Dental College',
    status: CollegeStatus.RECOGNIZED,
    state: 'Tamil Nadu',
    city: 'Chennai',
    geo: { lat: 13.0827, lng: 80.2707 },
    courses: [{ course: 'BDS', intake: 100 }],
    registrationNo: 'DCI-TN-0118',
    hospitalAttached: { name: 'Metro Hospital', beds: 540, distanceKm: 3 },
    trust: { name: 'Metro Dental Education Trust', registrationType: 'Private Trust', panOrRegId: 'AACTM9012M' },
    finance: { corpusFundLakh: 2100, bankBalanceLakh: 610 },
    contact: { email: 'admin@metrodental.edu', phone: '+91-44-28000000', address: '88 Mount Road, Chennai, Tamil Nadu 600002' },
  });

  // ---- Users (one per role) ----------------------------------------------
  const applicantNew = mkUser({
    username: 'applicant_new_college',
    name: 'Dr. Asha Rao (Dean, Sunrise)',
    email: 'asha@sunrise.edu',
    role: Role.APPLICANT,
    collegeId: newCollege.id,
  });
  const applicantExisting = mkUser({
    username: 'applicant_existing_college',
    name: 'Dr. Vikram Shah (Principal, Heritage)',
    email: 'vikram@heritage.edu',
    role: Role.APPLICANT,
    collegeId: existingCollege.id,
  });
  mkUser({
    username: 'consultant',
    name: 'Nimble Education Consultants',
    email: 'ops@nimble.in',
    role: Role.CONSULTANT,
    delegatedCollegeIds: [newCollege.id, existingCollege.id],
  });
  mkUser({ username: 'scrutiny_officer', name: 'S. Iyer (Scrutiny)', email: 'scrutiny@dci.gov.in', role: Role.SCRUTINY_OFFICER });
  mkUser({ username: 'case_officer', name: 'R. Menon (Case Officer)', email: 'case@dci.gov.in', role: Role.CASE_OFFICER });
  const assessor1 = mkUser({
    username: 'assessor_1',
    name: 'Dr. Kabir Sen',
    email: 'kabir@panel.dci.in',
    role: Role.ASSESSOR,
    specialties: ['Prosthodontics', 'Oral Surgery'],
    coi: { states: ['West Bengal'], institutions: [] },
  });
  const assessor2 = mkUser({
    username: 'assessor_2',
    name: 'Dr. Leela Nair',
    email: 'leela@panel.dci.in',
    role: Role.ASSESSOR,
    specialties: ['Periodontology'],
    coi: { states: ['Kerala'], institutions: [] },
  });
  const observer = mkUser({
    username: 'observer',
    name: 'Dr. Imran Qureshi',
    email: 'imran@panel.dci.in',
    role: Role.OBSERVER,
    coi: { states: ['Delhi'], institutions: [] },
  });
  mkUser({ username: 'ec_member', name: 'Prof. Anand Verma (EC)', email: 'ec@dci.gov.in', role: Role.EC_MEMBER });
  mkUser({ username: 'compliance_officer', name: 'P. Das (Compliance)', email: 'compliance@dci.gov.in', role: Role.COMPLIANCE_OFFICER });
  mkUser({ username: 'government_authority', name: 'Joint Secretary, MoHFW', email: 'js@mohfw.gov.in', role: Role.GOVERNMENT_AUTHORITY, mfaEnabled: true });
  mkUser({ username: 'dci_admin', name: 'DCI Administrator', email: 'admin@dci.gov.in', role: Role.DCI_ADMIN, mfaEnabled: true });
  mkUser({ username: 'super_admin', name: 'Super Administrator', email: 'super@dci.gov.in', role: Role.SUPER_ADMIN, mfaEnabled: true });
  mkUser({ username: 'system_admin', name: 'System Administrator', email: 'sysadmin@dci.gov.in', role: Role.SYSTEM_ADMINISTRATOR });

  // ---- Applications across the 7 workflows --------------------------------
  function mkApp(partial: Partial<Application> & {
    collegeId: string;
    applicantId: string;
    workflowType: WorkflowType;
    state: WorkflowState;
    course: string;
    intake: number;
  }): Application {
    const college = db.colleges.get(partial.collegeId)!;
    const nonDraft = partial.state !== WorkflowState.DRAFT;
    return db.applications.insert({
      id: id('app'),
      code: shortCode('DD'),
      applicationType: partial.applicationType ?? 'STANDARD',
      specialty: partial.specialty,
      location: { state: college.state, city: college.city, geo: college.geo },
      documents: partial.documents ?? [
        { id: id('doc'), name: 'Essentiality Certificate', type: 'STATUTORY', uploaded: true, validUpto: '2027-12-31' },
        { id: id('doc'), name: 'Affiliation Letter', type: 'STATUTORY', uploaded: true, validUpto: '2027-12-31' },
        { id: id('doc'), name: 'Land Documents', type: 'STATUTORY', uploaded: true },
        { id: id('doc'), name: 'Site & Hospital Distance Map Proof', type: 'DISTANCE_MAP', uploaded: true },
        { id: id('doc'), name: 'Inspection Proforma (Self-Assessment)', type: 'PROFORMA', uploaded: true },
      ],
      feeLakh: applicationFeeLakh(partial.workflowType),
      feePaid: true,
      governmentCollege: false,
      statutoryDeadlines: nonDraft ? computeStatutoryDeadlines(nowIso()) : undefined,
      locked: nonDraft,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...partial,
    } as Application);
  }

  // Workflow 1 — new college, mid-pipeline at AI_OBSERVER_REVIEW with findings.
  const w1 = mkApp({
    collegeId: newCollege.id,
    applicantId: applicantNew.id,
    workflowType: WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG,
    applicationType: 'NEW_COLLEGE',
    state: WorkflowState.AI_OBSERVER_REVIEW,
    course: 'BDS',
    intake: 50,
    scheduling: {
      scheduledDates: ['2026-07-01'],
      assessorIds: [assessor1.id, assessor2.id],
      observerId: observer.id,
      approvedByCaseOfficer: true,
      visitCredentialIssued: true,
      multiDay: false,
    },
  });
  seedFindings(w1.id);

  // Workflow 2 — increase seats, at EC_REVIEW (compliance already evaluated).
  const w2 = mkApp({
    collegeId: existingCollege.id,
    applicantId: applicantExisting.id,
    workflowType: WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS,
    applicationType: 'INCREASE_SEATS',
    state: WorkflowState.ASSESSOR_REVIEW,
    course: 'BDS',
    intake: 150,
  });
  seedFindings(w2.id);

  // Workflow 3 — renewal (DRAFT).
  mkApp({
    collegeId: existingCollege.id,
    applicantId: applicantExisting.id,
    workflowType: WorkflowType.WORKFLOW_3_RENEWAL_BDS_MDS,
    applicationType: 'RENEWAL',
    state: WorkflowState.DRAFT,
    course: 'MDS',
    specialty: 'Periodontology',
    intake: 24,
    locked: false,
  });

  // Workflow 4 — recognition (UNDER_SCRUTINY).
  mkApp({
    collegeId: recognizedCollege.id,
    applicantId: applicantExisting.id,
    workflowType: WorkflowType.WORKFLOW_4_RECOGNITION_BDS_MDS,
    applicationType: 'RECOGNITION',
    state: WorkflowState.UNDER_SCRUTINY,
    course: 'BDS',
    intake: 100,
  });

  // Workflow 5 — pre-PG inspection (INSPECTION_SCHEDULED).
  mkApp({
    collegeId: existingCollege.id,
    applicantId: applicantExisting.id,
    workflowType: WorkflowType.WORKFLOW_5_PRE_PG_INSPECTION,
    applicationType: 'PRE_PG',
    state: WorkflowState.INSPECTION_SCHEDULED,
    course: 'MDS',
    specialty: 'Prosthodontics',
    intake: 6,
    scheduling: {
      scheduledDates: ['2026-07-10'],
      assessorIds: [assessor1.id, assessor2.id],
      observerId: observer.id,
      approvedByCaseOfficer: true,
      visitCredentialIssued: true,
      multiDay: false,
    },
  });

  // Workflow 6 — periodic inspection (SUBMITTED, system can trigger).
  mkApp({
    collegeId: recognizedCollege.id,
    applicantId: applicantExisting.id,
    workflowType: WorkflowType.WORKFLOW_6_PERIODIC_INSPECTION,
    applicationType: 'PERIODIC',
    state: WorkflowState.SUBMITTED,
    course: 'BDS',
    intake: 100,
  });

  // Workflow 7 — compliance verification (system-created), in DEFICIENCY parent.
  const w7parent = mkApp({
    collegeId: existingCollege.id,
    applicantId: applicantExisting.id,
    workflowType: WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS,
    applicationType: 'INCREASE_SEATS',
    state: WorkflowState.DEFICIENCY,
    course: 'BDS',
    intake: 150,
  });
  seedFindings(w7parent.id);
  // Spawn the Workflow-7 child linked to the parent.
  mkApp({
    collegeId: existingCollege.id,
    applicantId: applicantExisting.id,
    workflowType: WorkflowType.WORKFLOW_7_COMPLIANCE_VERIFICATION,
    applicationType: 'COMPLIANCE_VERIFICATION',
    state: WorkflowState.INSPECTION_SCHEDULED,
    course: 'BDS',
    intake: 150,
    sourceApplicationId: w7parent.id,
  });
}

/** Seed norm-aligned AI findings for an application (mixed deficiency profile). */
function seedFindings(applicationId: string): void {
  const session = aiInspectionService.openSession(applicationId, {
    id: 'system',
    role: Role.ASSESSOR,
  } as User);
  aiInspectionService.runFullCapture(applicationId, session.id, 'mixed');
}

// Allow `npm run seed` to run standalone.
if (process.argv[1]?.includes('seed')) {
  seed();
  // eslint-disable-next-line no-console
  console.log('Seed complete. Demo password: Passw0rd!');
}
