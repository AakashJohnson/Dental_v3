/**
 * Role-aware dashboard workflow guidance — faithful port of the old backend
 * `services/guidance.service.js`. For a given (role × state) it answers
 * "what must I do next?" so every user always knows their next required action.
 */
import { Role, WorkflowState } from '../domain/enums.js';
import { computeAllowedActions, visibleSectionsFor, ActionKey } from '../domain/actions.js';
import { Application, DeficiencyItem } from '../types/index.js';
import { db } from '../store/db.js';

/** Ordered spine for progress bars (excludes adverse terminals). */
export const PROGRESS_STEPS: WorkflowState[] = [
  WorkflowState.DRAFT,
  WorkflowState.SUBMITTED,
  WorkflowState.UNDER_SCRUTINY,
  WorkflowState.INSPECTION_SCHEDULED,
  WorkflowState.AI_INSPECTION,
  WorkflowState.AI_OBSERVER_REVIEW,
  WorkflowState.ASSESSOR_REVIEW,
  WorkflowState.EC_REVIEW,
  WorkflowState.GOVERNMENT_DECISION,
  WorkflowState.LETTER_OF_INTENT,
  WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION,
  WorkflowState.APPROVED,
];

type GuideMap = Partial<Record<string, string>> & { _: string };

const GUIDANCE: Record<WorkflowState, GuideMap> = {
  [WorkflowState.DRAFT]: {
    [Role.APPLICANT]: 'Complete the form, upload annexures, pay the fee, and submit.',
    [Role.CONSULTANT]: 'Complete the form, upload annexures, pay the fee, and submit.',
    _: 'Awaiting the applicant to complete and submit the application.',
  },
  [WorkflowState.SUBMITTED]: {
    [Role.CASE_OFFICER]: 'Verify the package is complete and forward it to the Council.',
    [Role.SCRUTINY_OFFICER]: 'A new case is incoming for technical scrutiny.',
    [Role.APPLICANT]: 'Submitted. Await government intake and forwarding to the Council.',
    _: 'Application submitted — awaiting government intake.',
  },
  [WorkflowState.UNDER_SCRUTINY]: {
    [Role.SCRUTINY_OFFICER]: 'Run the scrutiny checklist; pass, request clarification, or reject.',
    [Role.APPLICANT]: 'If a clarification is requested, reply within the deadline.',
    _: 'Technical scrutiny in progress.',
  },
  [WorkflowState.INSPECTION_SCHEDULED]: {
    [Role.CASE_OFFICER]: 'Assign ≥2 assessors + 1 observer, clear COI, and approve the schedule.',
    [Role.ASSESSOR]: 'Review your assignment, declare COI, and prepare for the on-site visit.',
    [Role.OBSERVER]: 'Review your assignment and declare any conflict of interest.',
    [Role.APPLICANT]: 'An inspection has been scheduled — prepare the institution for the visit.',
    _: 'Inspection scheduling in progress.',
  },
  [WorkflowState.AI_INSPECTION]: {
    [Role.ASSESSOR]: 'Capture the on-site walkthrough; run AI analysis to produce findings.',
    [Role.APPLICANT]: 'The AI inspection is underway.',
    _: 'AI capture in progress.',
  },
  [WorkflowState.AI_OBSERVER_REVIEW]: {
    [Role.OBSERVER]: 'Verify each AI finding (accept / flag / override), then sign off.',
    [Role.ASSESSOR]: 'Awaiting observer verification of AI findings.',
    [Role.APPLICANT]: 'AI findings are under independent observer verification.',
    _: 'Observer verification in progress.',
  },
  [WorkflowState.ASSESSOR_REVIEW]: {
    [Role.ASSESSOR]:
      'Assemble the Joint Assessment Report, apply overrides with reasons, and co-sign (both assessors, within 24h).',
    [Role.APPLICANT]: 'Assessors are finalising the report.',
    _: 'Assessor report being finalised.',
  },
  [WorkflowState.EC_REVIEW]: {
    [Role.EC_MEMBER]:
      'Review the deficiency list + risk score + evidence and record a decision (vocabulary only).',
    [Role.APPLICANT]: 'The report is before the Expert Committee.',
    _: 'EC decision pending.',
  },
  [WorkflowState.DEFICIENCY]: {
    [Role.APPLICANT]: 'Submit per-line compliance responses + evidence before the deadline.',
    [Role.COMPLIANCE_OFFICER]: 'Validate the applicant compliance and trigger re-verification.',
    _: 'Awaiting applicant compliance.',
  },
  [WorkflowState.GOVERNMENT_DECISION]: {
    [Role.GOVERNMENT_AUTHORITY]:
      'Act on the EC recommendation: issue the LOI, reject, or record an adverse order.',
    [Role.APPLICANT]: 'The recommendation is with the Central Government.',
    _: 'Government decision pending.',
  },
  [WorkflowState.LETTER_OF_INTENT]: {
    [Role.APPLICANT]: 'Accept the conditions and furnish a valid performance bank guarantee.',
    [Role.GOVERNMENT_AUTHORITY]: 'Awaiting LOI acceptance + bank guarantee, then issue the LOP.',
    _: 'Awaiting LOI acceptance + bank guarantee.',
  },
  [WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION]: {
    [Role.GOVERNMENT_AUTHORITY]: 'Issue / finalise the Letter of Permission.',
    [Role.APPLICANT]: 'Your Letter of Permission is being issued.',
    _: 'Letter of Permission issued.',
  },
  [WorkflowState.APPROVED]: {
    _: 'Approved. No further action — the next obligation will be scheduled automatically.',
  },
  [WorkflowState.REJECTED]: { _: 'Application rejected (terminal).' },
  [WorkflowState.WITHDRAWN]: { _: 'Recognition withdrawn (terminal adverse).' },
  [WorkflowState.STOPPED]: { _: 'Admissions stopped (terminal adverse).' },
};

/** Which role(s) the workflow is currently waiting on (for "pendingUsers"). */
const WAITING_ON: Partial<Record<WorkflowState, Role[]>> = {
  [WorkflowState.DRAFT]: [Role.APPLICANT],
  [WorkflowState.SUBMITTED]: [Role.CASE_OFFICER],
  [WorkflowState.UNDER_SCRUTINY]: [Role.SCRUTINY_OFFICER],
  [WorkflowState.INSPECTION_SCHEDULED]: [Role.CASE_OFFICER],
  [WorkflowState.AI_INSPECTION]: [Role.ASSESSOR],
  [WorkflowState.AI_OBSERVER_REVIEW]: [Role.OBSERVER],
  [WorkflowState.ASSESSOR_REVIEW]: [Role.ASSESSOR],
  [WorkflowState.EC_REVIEW]: [Role.EC_MEMBER],
  [WorkflowState.DEFICIENCY]: [Role.APPLICANT, Role.COMPLIANCE_OFFICER],
  [WorkflowState.GOVERNMENT_DECISION]: [Role.GOVERNMENT_AUTHORITY],
  [WorkflowState.LETTER_OF_INTENT]: [Role.APPLICANT],
  [WorkflowState.LETTER_OF_PERMISSION_OR_RECOGNITION]: [Role.GOVERNMENT_AUTHORITY],
};

export interface Guidance {
  applicationId: string;
  applicationNo: string;
  currentState: WorkflowState;
  workflowType: string;
  viewerRole: string;
  nextAction: string;
  allowedActions: ActionKey[];
  visibleSections: string[];
  blockedReason: string | null;
  pendingDocuments: { id: string; description: string; severity: string }[];
  pendingUsers: Role[];
  deadline: string | null;
  notificationMessage: string;
  progressSteps: { state: WorkflowState; done: boolean; current: boolean }[];
}

export function computeGuidance(role: Role | string, application: Application): Guidance {
  const state = application.state;
  const stateGuide = GUIDANCE[state] || ({ _: 'No action required.' } as GuideMap);
  const nextAction = stateGuide[role as string] || stateGuide._ || 'No action required.';

  const idx = PROGRESS_STEPS.indexOf(state);
  const progressSteps = PROGRESS_STEPS.map((s, i) => ({
    state: s,
    done: idx >= 0 && i < idx,
    current: s === state,
  }));

  const deficiencies: DeficiencyItem[] = db.deficiencies.find((d) => d.applicationId === application.id);
  const pendingDocuments = deficiencies
    .filter((d) => ['OUTSTANDING', 'IN_REVIEW'].includes(d.status))
    .map((d) => ({ id: d.id, description: d.deficiency, severity: d.severity }));

  let deadline: string | null = null;
  if (state === WorkflowState.DEFICIENCY || state === WorkflowState.UNDER_SCRUTINY) {
    deadline = application.statutoryDeadlines?.[state] ?? null;
  }

  // The action vocabulary the viewer may actually perform now (RBAC matrix).
  const allowedActions = computeAllowedActions({ role: role as Role }, application);

  return {
    applicationId: application.id,
    applicationNo: application.code,
    currentState: state,
    workflowType: application.workflowType,
    viewerRole: role as string,
    nextAction,
    allowedActions,
    visibleSections: visibleSectionsFor(role as string),
    blockedReason: null,
    pendingDocuments,
    pendingUsers: WAITING_ON[state] || [],
    deadline,
    notificationMessage: nextAction,
    progressSteps,
  };
}
