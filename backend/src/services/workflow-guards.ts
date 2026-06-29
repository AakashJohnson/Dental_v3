/**
 * Pure stage-precondition guards — faithful port of the old backend
 * `services/workflow-guards.js`. Side-effect-free and unit-testable. These
 * encode the hard blockers the transition graph cannot express on its own:
 *   - AI + Observer → Assessor Review: EVERY AI finding must be dispositioned.
 *   - Assessor Review → EC Review: TWO distinct assessors must have signed.
 */
import { FindingStatus } from '../domain/enums.js';

export interface FindingLike {
  status?: string;
}
export interface SignoffLike {
  assessorId: string;
}

/** Findings still awaiting an observer disposition (accept / flag / override). */
export function pendingFindings<T extends FindingLike>(findings: T[] = []): T[] {
  return (findings || []).filter(
    (f) => (f.status || FindingStatus.PENDING_OBSERVER_REVIEW) === FindingStatus.PENDING_OBSERVER_REVIEW,
  );
}

/**
 * Observer may sign off only when there is at least one finding and none remain
 * PENDING_OBSERVER_REVIEW (the machine stage never auto-passes).
 */
export function allFindingsDispositioned(findings: FindingLike[] = []): boolean {
  const list = findings || [];
  return list.length > 0 && pendingFindings(list).length === 0;
}

/** Number of DISTINCT assessors who have signed the Joint Assessment Report. */
export function distinctSigners(signoffs: SignoffLike[] = []): number {
  return new Set((signoffs || []).map((s) => String(s.assessorId))).size;
}

/** Two distinct assessors must sign before the report can move to EC Review. */
export function isDualSigned(signoffs: SignoffLike[] = []): boolean {
  return distinctSigners(signoffs) >= 2;
}
