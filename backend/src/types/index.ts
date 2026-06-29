/**
 * DantaDrishti — domain model interfaces.
 * These describe the shape of records held in the store abstraction.
 */
import {
  CollegeStatus,
  ComplianceVerdict,
  DetectionCategory,
  ECDecision,
  FindingStatus,
  Role,
  RuleType,
  Severity,
  WorkflowAction,
  WorkflowState,
  WorkflowType,
} from '../domain/enums.js';
import type { ProformaTier } from '../domain/workflowConfig.js';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  role: Role;
  collegeId?: string;
  /** Colleges a consultant is delegated to act for. */
  delegatedCollegeIds?: string[];
  mfaEnabled?: boolean;
  /** Conflict-of-interest attributes for assessors/observers. */
  coi?: { states: string[]; institutions: string[] };
  specialties?: string[];
  createdAt: string;
}

export interface College {
  id: string;
  name: string;
  status: CollegeStatus;
  state: string;
  city: string;
  geo: { lat: number; lng: number };
  courses: { course: string; intake: number }[];
  hospitalAttached?: { name: string; beds: number; distanceKm: number };
  registrationNo?: string;
  /** Private trust / society ownership data — restricted to owner & admins. */
  trust?: { name: string; registrationType: string; panOrRegId: string };
  /** Confidential financials — restricted to owner & admins. */
  finance?: { corpusFundLakh: number; bankBalanceLakh: number };
  /** Private contact details — restricted to owner, admins & statutory letters. */
  contact?: { email: string; phone: string; address: string };
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  applicationId: string;
  workflowType: WorkflowType;
  fromState: WorkflowState | null;
  toState: WorkflowState | null;
  action: string;
  actorId: string;
  actorRole: Role | 'SYSTEM';
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Notification {
  id: string;
  userId: string;
  role: Role;
  applicationId?: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface ApplicationDocument {
  id: string;
  name: string;
  type: string;
  uploaded: boolean;
  validUpto?: string;
  /** How this requirement is collected. Defaults to a file upload. */
  kind?: 'file' | 'geo' | 'proforma';
  /** Geo-location proof (e.g. site ↔ attached hospital distance, ≤10 km). */
  geo?: GeoProof;
  /** Structured inspection-proforma self-assessment values (key → value). */
  proforma?: { values: Record<string, number> };
}

/** Site ↔ attached medical college / hospital geo proof (Reg 6, ≤10 km). */
export interface GeoProof {
  collegeLat: number;
  collegeLng: number;
  hospitalLat: number;
  hospitalLng: number;
  distanceKm: number;
}

export interface DeficiencyItem {
  id: string;
  applicationId: string;
  sourceWorkflowId?: string;
  normRuleId?: string;
  requirement: string;
  deficiency: string;
  section: string;
  severity: Severity;
  status: 'OUTSTANDING' | 'RESOLVED' | 'IN_REVIEW';
  applicantReply?: string;
  evidenceUploads: string[];
  observerOrInspectorObservation?: string;
  resolvedAt?: string;
  outstandingDelta?: boolean;
}

export interface Application {
  id: string;
  code: string;
  collegeId: string;
  applicantId: string;
  workflowType: WorkflowType;
  state: WorkflowState;
  applicationType: string;
  course: string;
  specialty?: string;
  intake: number;
  location: { state: string; city: string; geo: { lat: number; lng: number } };
  documents: ApplicationDocument[];
  /** Locked snapshot after submission — original cannot be edited. */
  submittedSnapshot?: Record<string, unknown>;
  locked: boolean;
  checklist?: Record<string, boolean>;
  eligibility?: Record<string, boolean>;
  statutoryDocuments?: ApplicationDocument[];
  completeness?: number;
  scheduling?: InspectionSchedule;
  riskScore?: number;
  riskLevel?: string;
  suggestedDecision?: ECDecision;
  ecDecision?: ECDecision;
  ecRationale?: string;
  undertaking?: string;
  sourceApplicationId?: string; // for Workflow 7
  bankGuaranteeVerified?: boolean;
  bankGuarantee?: BankGuarantee;
  /** Fee (₹ lakh) due for this workflow and whether it has been paid. */
  feeLakh?: number;
  feePaid?: boolean;
  governmentCollege?: boolean;
  /** Capacity granted after an EC partial-approval / restrain decision. */
  intakeCap?: number;
  approvedIntake?: number;
  /** Per-state statutory deadlines computed at submission. */
  statutoryDeadlines?: Record<string, string>;
  /** Result of the deterministic scrutiny gate evaluation. */
  scrutinyGates?: ScrutinyGateResult;
  createdAt: string;
  updatedAt: string;
}

export interface ScrutinyGateResult {
  passed: boolean;
  evaluatedAt: string;
  gates: {
    key: string;
    label: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    detail: string;
    gating: boolean;
  }[];
}

export interface InspectionSchedule {
  scheduledDates: string[];
  assessorIds: string[];
  observerId?: string;
  approvedByCaseOfficer: boolean;
  visitCredentialIssued: boolean;
  multiDay: boolean;
}

export interface COIDeclaration {
  id: string;
  userId: string;
  applicationId: string;
  conflict: boolean;
  note?: string;
  createdAt: string;
}

export interface InspectionSession {
  id: string;
  applicationId: string;
  startedBy: string;
  startedAt: string;
  status: 'OPEN' | 'CLOSED';
}

export interface Evidence {
  id: string;
  applicationId: string;
  sessionId: string;
  category: DetectionCategory;
  fileRef: string;
  geo: { lat: number; lng: number };
  timestamp: string;
  hash: string;
  hashValid: boolean;
  geoValid: boolean;
}

export interface AIFinding {
  id: string;
  applicationId: string;
  inspectionSessionId: string;
  normRuleId?: string;
  section: string;
  item: string;
  category: DetectionCategory;
  requiredValue: number | string | boolean;
  detectedValue: number | string | boolean;
  availableValue: number | string | boolean;
  aiVerdict: ComplianceVerdict;
  confidence: number;
  evidenceRefs: string[];
  geo: { lat: number; lng: number };
  timestamp: string;
  hash: string;
  riskImpact: number;
  severity: Severity;
  status: FindingStatus;
  observerVerdict?: 'ACCEPT' | 'FLAG' | 'OVERRIDE';
  observerNotes?: string;
  exceptionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  assessorOverride?: boolean;
  overrideReason?: string;
  finalVerdict?: ComplianceVerdict;
}

export interface NormRule {
  id: string;
  normSetId: string;
  /** Stable matching key (also stamped onto findings via normRuleId). */
  key: string;
  section: string;
  requirementText: string;
  requiredValue: number | string | boolean;
  unit?: string;
  type: RuleType;
  /** AI detection category this rule is evidenced by (if any). */
  category?: DetectionCategory;
  /** Document name keyword used to evidence validity_date rules. */
  documentKey?: string;
  dataSource: string;
  evaluator: string;
  severityWeight: Severity;
  gating: boolean;
  course: string;
  tier: ProformaTier;
  intake: number;
  purpose: string;
  regulationVersion: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

/** A generated statutory document (Deficiency Letter, Report, LOI, LOP, …). */
export interface GeneratedDocument {
  id: string;
  applicationId: string;
  type:
    | 'JOINT_ASSESSMENT_REPORT'
    | 'DEFICIENCY_LETTER'
    | 'EC_RECOMMENDATION'
    | 'LETTER_OF_INTENT'
    | 'LETTER_OF_PERMISSION'
    | 'RECOGNITION_LETTER';
  title: string;
  reference: string;
  /** Structured, human-readable body lines. */
  body: string[];
  issuedByRole: Role | 'SYSTEM';
  issuedById: string;
  signatories: string[];
  verificationId: string;
  createdAt: string;
}

/** Performance bank guarantee record (Reg 10/17/23). */
export interface BankGuarantee {
  amountLakh: number;
  requiredLakh: number;
  bank: string;
  reference?: string;
  validUpto?: string;
  verified: boolean;
  verifiedAt?: string;
  basis: string;
}

export interface ComplianceResult {
  id: string;
  applicationId: string;
  ruleId: string;
  requiredValue: number | string | boolean;
  availableValue: number | string | boolean;
  source: string;
  verdict: ComplianceVerdict;
  deficiencyValue?: number | string;
  severity: Severity;
  evidenceRefs: string[];
  riskImpact: number;
  override?: boolean;
  overrideReason?: string;
}

export interface AssessorReport {
  id: string;
  applicationId: string;
  assessorSignatures: { assessorId: string; signedAt: string }[];
  summary: string;
  overrides: { findingId: string; reason: string; by: string }[];
  finalizedAt?: string;
  midnightWarning: boolean;
}

export interface TransitionResult {
  application: Application;
  guidance: RoleGuidance;
}

export interface RoleGuidance {
  state: WorkflowState;
  responsibleRole: Role | string;
  nextActions: { action: WorkflowAction; to: WorkflowState; description: string; roles: Role[] }[];
  message: string;
}
