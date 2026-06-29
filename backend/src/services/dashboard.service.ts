import { db } from '../store/db.js';
import { Role, WorkflowState } from '../domain/enums.js';
import { Application, User } from '../types/index.js';
import { applicationService } from './application.service.js';
import { workflowService } from './workflow.service.js';
import { computeGuidance } from './guidance.service.js';

interface RoleGuide {
  responsibility: string;
  can: string[];
  cannot: string[];
}

const ROLE_GUIDE: Record<string, RoleGuide> = {
  [Role.APPLICANT]: {
    responsibility: 'Submit accurate Form 1/2/3, upload annexures, respond to deficiencies, accept LOI, furnish bank guarantee.',
    can: ['Create & edit own drafts', 'Submit application & pay fee', 'Submit compliance', 'Accept LOI & upload guarantee'],
    cannot: ['View other institutions', 'Alter submitted snapshot', 'See assessor identities pre-visit', 'See internal risk scores'],
  },
  [Role.CONSULTANT]: {
    responsibility: 'Prepare & submit applications for delegating institutions under explicit mandate.',
    can: ['Prepare drafts for delegated colleges', 'Upload documents', 'Submit on behalf'],
    cannot: ['Sign statutory undertakings unless authorised', 'Access non-delegated colleges'],
  },
  [Role.SCRUTINY_OFFICER]: {
    responsibility: 'Verify eligibility, documents, application window, fee and statutory completeness.',
    can: ['Run scrutiny checklist', 'Raise clarifications', 'Pass / return / reject (ineligible)'],
    cannot: ['Make inspection or EC decisions', 'Edit applicant documents', 'See full risk score'],
  },
  [Role.CASE_OFFICER]: {
    responsibility: 'Manage case lifecycle, schedule inspections, assign teams, monitor SLA.',
    can: ['Assign ≥2 assessors + observer', 'Schedule & reschedule', 'Return-incomplete'],
    cannot: ['Make compliance verdicts', 'Edit captured evidence', 'Issue EC/government decisions'],
  },
  [Role.ASSESSOR]: {
    responsibility: 'Conduct on-site assessment, validate evidence, prepare and sign joint report.',
    can: ['Capture evidence', 'Override AI findings (with reason)', 'Co-sign Joint Assessment Report'],
    cannot: ['Assess where COI', 'Self-assign', 'Edit after dual-sign lock', 'Make EC decisions'],
  },
  [Role.OBSERVER]: {
    responsibility: 'Independently verify AI findings, flag exceptions, certify the evidence set.',
    can: ['Accept / flag / quarantine each finding', 'Record observations', 'Sign verification'],
    cannot: ['Author the assessment report', 'Capture in place of assessors', 'Access non-assigned cases'],
  },
  [Role.EC_MEMBER]: {
    responsibility: 'Review deficiency list and risk score, record decision using approved vocabulary.',
    can: ['Add / strike deficiencies', 'Require undertaking', 'Ask compliance / recommend'],
    cannot: ['Alter raw evidence', 'Issue LOI / LOP', 'See unnecessary college details'],
  },
  [Role.COMPLIANCE_OFFICER]: {
    responsibility: 'Validate compliance response, track deficiency closure, trigger verification.',
    can: ['Validate compliance submissions', 'Trigger re-verification (WF7)', 'Run compliance reports'],
    cannot: ['Make EC/government decisions', 'Edit evidence'],
  },
  [Role.GOVERNMENT_AUTHORITY]: {
    responsibility: 'Record final government decision and issue statutory approval documents.',
    can: ['Issue LOI', 'Verify bank guarantee', 'Issue LOP / Recognition', 'Order refuse / withdraw / stop'],
    cannot: ['Alter assessment evidence', 'Bypass statutory dates'],
  },
  [Role.DCI_ADMIN]: {
    responsibility: 'Manage platform operations, monitor workflow, configure rules and reports.',
    can: ['Full administrative oversight', 'User / role management', 'View audit & reports'],
    cannot: ['Bypass the workflow state machine'],
  },
  [Role.SUPER_ADMIN]: {
    responsibility: 'Govern the platform — roles, norms, decision rules, SLA dates, templates.',
    can: ['Configure master data & rules', 'Manage users/roles', 'Full audit access'],
    cannot: ['Act inside case decisions (segregation of duties)'],
  },
  [Role.SYSTEM_ADMINISTRATOR]: {
    responsibility: 'Maintain environment, integrations, security, monitoring.',
    can: ['Manage infrastructure & integrations', 'View system logs', 'Monitor services'],
    cannot: ['Access case decisions or evidence content', 'Make any application decision'],
  },
};

/** Role-specific dashboard widgets + workflow guidance. */
export const dashboardService = {
  forUser(user: User) {
    const apps = applicationService.listForActor(user);
    return {
      role: user.role,
      guide: ROLE_GUIDE[user.role] ?? { responsibility: 'Platform user.', can: [], cannot: [] },
      counts: this.counts(apps),
      widgets: this.widgets(user, apps),
      tasks: this.tasks(user, apps),
      recentAudit: this.recentAudit(user, apps),
    };
  },

  recentAudit(user: User, apps: Application[]) {
    const ids = new Set(apps.map((a) => a.id));
    const isAdmin = ([Role.DCI_ADMIN, Role.SUPER_ADMIN, Role.SYSTEM_ADMINISTRATOR] as Role[]).includes(user.role);
    return db.audit
      .all()
      .filter((e) => isAdmin || ids.has(e.applicationId))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 8)
      .map((e) => ({ action: e.action, toState: e.toState, actorRole: e.actorRole, timestamp: e.timestamp }));
  },

  counts(apps: Application[]) {
    const byState: Record<string, number> = {};
    for (const a of apps) byState[a.state] = (byState[a.state] ?? 0) + 1;
    return { total: apps.length, byState };
  },

  /** Role-aware widget set — never mixes another role's controls. */
  widgets(user: User, apps: Application[]): { key: string; label: string; value: number }[] {
    switch (user.role) {
      case Role.APPLICANT:
      case Role.CONSULTANT:
        return [
          { key: 'active', label: 'Active applications', value: apps.filter((a) => !isTerminal(a.state)).length },
          { key: 'deficiency', label: 'Awaiting your compliance', value: apps.filter((a) => a.state === WorkflowState.DEFICIENCY).length },
          { key: 'approved', label: 'Approved', value: apps.filter((a) => a.state === WorkflowState.APPROVED).length },
        ];
      case Role.SCRUTINY_OFFICER:
        return [
          { key: 'queue', label: 'In scrutiny queue', value: apps.filter((a) => ([WorkflowState.SUBMITTED, WorkflowState.UNDER_SCRUTINY] as WorkflowState[]).includes(a.state)).length },
        ];
      case Role.CASE_OFFICER:
        return [
          { key: 'scheduling', label: 'To schedule', value: apps.filter((a) => a.state === WorkflowState.UNDER_SCRUTINY).length },
          { key: 'scheduled', label: 'Scheduled', value: apps.filter((a) => a.state === WorkflowState.INSPECTION_SCHEDULED).length },
        ];
      case Role.ASSESSOR:
        return [
          { key: 'assigned', label: 'Assigned inspections', value: apps.length },
          { key: 'review', label: 'Pending report', value: apps.filter((a) => a.state === WorkflowState.ASSESSOR_REVIEW).length },
        ];
      case Role.OBSERVER:
        return [
          { key: 'verify', label: 'Findings to verify', value: apps.filter((a) => a.state === WorkflowState.AI_OBSERVER_REVIEW).length },
        ];
      case Role.EC_MEMBER:
        return [
          { key: 'agenda', label: 'EC agenda', value: apps.filter((a) => a.state === WorkflowState.EC_REVIEW).length },
        ];
      case Role.COMPLIANCE_OFFICER:
        return [
          { key: 'backlog', label: 'Compliance backlog', value: apps.filter((a) => a.state === WorkflowState.DEFICIENCY).length },
        ];
      case Role.GOVERNMENT_AUTHORITY:
        return [
          { key: 'pending', label: 'EC recommendations', value: apps.filter((a) => a.state === WorkflowState.GOVERNMENT_DECISION).length },
          { key: 'loi', label: 'LOI awaiting LOP', value: apps.filter((a) => a.state === WorkflowState.LETTER_OF_INTENT).length },
        ];
      default:
        return [{ key: 'all', label: 'All applications', value: apps.length }];
    }
  },

  /** Pending tasks with workflow guidance for the applicant tracker. */
  tasks(user: User, apps: Application[]) {
    return apps
      .filter((a) => !isTerminal(a.state))
      .map((a) => ({
        applicationId: a.id,
        code: a.code,
        state: a.state,
        guidance: computeGuidance(user.role, a),
      }));
  },

  guidanceFor(applicationId: string, user?: User) {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    // Role-aware guidance (action envelope + progress) when a viewer is known;
    // otherwise fall back to the neutral state guidance.
    return user ? computeGuidance(user.role, app) : workflowService.guidanceFor(app);
  },
};

function isTerminal(state: WorkflowState): boolean {
  return ([
    WorkflowState.APPROVED,
    WorkflowState.REJECTED,
    WorkflowState.WITHDRAWN,
    WorkflowState.STOPPED,
  ] as WorkflowState[]).includes(state);
}
