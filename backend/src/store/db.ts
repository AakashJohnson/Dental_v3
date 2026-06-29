/**
 * DantaDrishti — in-memory store with optional MongoDB write-through.
 *
 * Every collection is a Map for fast synchronous reads/writes (services stay
 * synchronous). When a persistence adapter is attached (see persistence.ts),
 * every mutation is mirrored to MongoDB so data survives restarts. Without an
 * adapter (e.g. unit tests) the store behaves as a pure in-memory store.
 */
import {
  AIFinding,
  Application,
  AssessorReport,
  AuditEvent,
  COIDeclaration,
  College,
  ComplianceResult,
  DeficiencyItem,
  Evidence,
  GeneratedDocument,
  InspectionSession,
  NormRule,
  Notification,
  User,
} from '../types/index.js';

/** Write-through target (MongoDB). Attached at boot; null in tests. */
export interface PersistenceAdapter {
  upsert(collection: string, doc: { id: string }): void;
  remove(collection: string, id: string): void;
  clear(collection: string): void;
}

let persistence: PersistenceAdapter | null = null;
export function setPersistenceAdapter(adapter: PersistenceAdapter | null): void {
  persistence = adapter;
}

class Collection<T extends { id: string }> {
  private items = new Map<string, T>();

  constructor(private readonly name: string) {}

  insert(item: T): T {
    this.items.set(item.id, item);
    persistence?.upsert(this.name, item);
    return item;
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  update(id: string, patch: Partial<T>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const next = { ...existing, ...patch };
    this.items.set(id, next);
    persistence?.upsert(this.name, next);
    return next;
  }

  all(): T[] {
    return [...this.items.values()];
  }

  find(pred: (item: T) => unknown): T[] {
    return this.all().filter((i) => Boolean(pred(i)));
  }

  findOne(pred: (item: T) => unknown): T | undefined {
    return this.all().find((i) => Boolean(pred(i)));
  }

  delete(id: string): boolean {
    const ok = this.items.delete(id);
    if (ok) persistence?.remove(this.name, id);
    return ok;
  }

  removeWhere(pred: (item: T) => unknown): number {
    let n = 0;
    for (const item of this.all()) {
      if (pred(item)) {
        this.items.delete(item.id);
        persistence?.remove(this.name, item.id);
        n++;
      }
    }
    return n;
  }

  clear(): void {
    this.items.clear();
    persistence?.clear(this.name);
  }

  /** Bulk-load records from storage WITHOUT re-persisting them (hydration). */
  load(items: T[]): void {
    this.items.clear();
    for (const it of items) this.items.set(it.id, it);
  }
}

export const db = {
  users: new Collection<User>('users'),
  colleges: new Collection<College>('colleges'),
  applications: new Collection<Application>('applications'),
  audit: new Collection<AuditEvent>('audit'),
  notifications: new Collection<Notification>('notifications'),
  findings: new Collection<AIFinding>('findings'),
  evidence: new Collection<Evidence>('evidence'),
  sessions: new Collection<InspectionSession>('sessions'),
  normRules: new Collection<NormRule>('normRules'),
  complianceResults: new Collection<ComplianceResult>('complianceResults'),
  deficiencies: new Collection<DeficiencyItem>('deficiencies'),
  assessorReports: new Collection<AssessorReport>('assessorReports'),
  coiDeclarations: new Collection<COIDeclaration>('coiDeclarations'),
  documents: new Collection<GeneratedDocument>('documents'),
};

export function resetDb(): void {
  Object.values(db).forEach((c) => c.clear());
}
