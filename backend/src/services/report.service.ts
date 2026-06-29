import { db } from '../store/db.js';
import { Severity, WorkflowState } from '../domain/enums.js';
import { auditService } from './audit.service.js';

export const reportService = {
  pipeline() {
    const apps = db.applications.all();
    const byState: Record<string, number> = {};
    for (const a of apps) byState[a.state] = (byState[a.state] ?? 0) + 1;
    const byWorkflow: Record<string, number> = {};
    for (const a of apps) byWorkflow[a.workflowType] = (byWorkflow[a.workflowType] ?? 0) + 1;
    return { total: apps.length, byState, byWorkflow };
  },

  deficiencies() {
    const items = db.deficiencies.all();
    const bySeverity: Record<string, number> = {};
    for (const d of items) bySeverity[d.severity] = (bySeverity[d.severity] ?? 0) + 1;
    return {
      total: items.length,
      outstanding: items.filter((d) => d.status === 'OUTSTANDING').length,
      resolved: items.filter((d) => d.status === 'RESOLVED').length,
      bySeverity,
    };
  },

  risk() {
    const apps = db.applications.all().filter((a) => a.riskScore != null);
    return apps
      .map((a) => ({
        code: a.code,
        state: a.state,
        riskScore: a.riskScore ?? 0,
        integrity: db.findings.find((f) => f.applicationId === a.id && f.severity === Severity.INTEGRITY).length > 0,
      }))
      .sort((x, y) => y.riskScore - x.riskScore);
  },

  /** Simple SLA heatmap based on time-in-state since last update. */
  sla() {
    const now = Date.now();
    return db.applications
      .all()
      .filter((a) => !isTerminal(a.state))
      .map((a) => {
        const ageHours = Math.round((now - new Date(a.updatedAt).getTime()) / 3_600_000);
        return {
          code: a.code,
          state: a.state,
          ageHours,
          breach: ageHours > 72,
        };
      });
  },

  map() {
    return db.applications.all().map((a) => ({
      code: a.code,
      state: a.state,
      geo: a.location.geo,
      city: a.location.city,
      region: a.location.state,
      riskScore: a.riskScore ?? 0,
    }));
  },

  audit(applicationId: string) {
    return auditService.forApplication(applicationId);
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
