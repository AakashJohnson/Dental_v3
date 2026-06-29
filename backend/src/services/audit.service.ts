import { db } from '../store/db.js';
import { AuditEvent } from '../types/index.js';
import { Role, WorkflowState, WorkflowType } from '../domain/enums.js';
import { id, nowIso } from '../utils/id.js';

export interface AuditInput {
  applicationId: string;
  workflowType: WorkflowType;
  fromState: WorkflowState | null;
  toState: WorkflowState | null;
  action: string;
  actorId: string;
  actorRole: Role | 'SYSTEM';
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/** Append-only audit log. Records are never updated or deleted. */
export const auditService = {
  record(input: AuditInput): AuditEvent {
    const event: AuditEvent = {
      id: id('aud'),
      timestamp: nowIso(),
      ...input,
    };
    return db.audit.insert(event);
  },

  forApplication(applicationId: string): AuditEvent[] {
    return db.audit
      .find((e) => e.applicationId === applicationId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },

  all(): AuditEvent[] {
    return db.audit.all().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },
};
