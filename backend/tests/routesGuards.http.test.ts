import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import { seed } from '../src/store/seed.js';
import { db } from '../src/store/db.js';
import { WorkflowState, WorkflowAction } from '../src/domain/enums.js';

/**
 * PART 2 — negative / guard tests over the real HTTP surface.
 * Each test re-seeds a clean in-memory store so cases are independent.
 * Proves RBAC gates (403), auth gates (401) and that the centralized engine
 * rejects illegal transitions (422) even when the permission gate passes.
 */
let server: Server;
let base: string;

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
});

beforeEach(() => {
  seed();
});

afterAll(() => {
  server.close();
});

async function login(username: string): Promise<string> {
  const res = await api(null, 'POST', '/api/auth/login', { username, password: 'Passw0rd!' });
  expect(res.status, `login ${username}`).toBe(200);
  return res.body.token as string;
}

async function api(
  token: string | null,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: any = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* keep raw text */
  }
  return { status: res.status, body: parsed };
}

function appInState(state: WorkflowState) {
  const found = db.applications.find((a) => a.state === state)[0];
  expect(found, `seeded app in ${state}`).toBeTruthy();
  return found!;
}

describe('PART 2 — HTTP guard / negative tests', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await api(null, 'GET', '/api/applications');
    expect(res.status).toBe(401);
  });

  it('rejects invalid credentials with 401', async () => {
    const res = await api(null, 'POST', '/api/auth/login', {
      username: 'applicant_new_college',
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });

  it('forbids an applicant from passing scrutiny (403)', async () => {
    const app = appInState(WorkflowState.UNDER_SCRUTINY);
    const applicant = await login('applicant_existing_college');
    const res = await api(applicant, 'POST', `/api/scrutiny/${app.id}/pass`);
    expect(res.status).toBe(403);
  });

  it('forbids an applicant from recording an EC decision (403)', async () => {
    const app = appInState(WorkflowState.ASSESSOR_REVIEW);
    const applicant = await login('applicant_existing_college');
    const res = await api(applicant, 'POST', `/api/ec/${app.id}/decision`, {
      decision: 'APPROVE',
      rationale: 'should not be allowed',
    });
    expect(res.status).toBe(403);
  });

  it('forbids an applicant from assigning an inspection team (403)', async () => {
    const app = appInState(WorkflowState.INSPECTION_SCHEDULED);
    const applicant = await login('applicant_existing_college');
    const res = await api(applicant, 'POST', `/api/inspections/${app.id}/assign-team`, {
      assessorIds: ['x', 'y'],
      observerId: 'z',
      dates: ['2026-09-01'],
    });
    expect(res.status).toBe(403);
  });

  it('engine blocks an applicant from force-jumping DRAFT → APPROVED via /transition (422)', async () => {
    const app = appInState(WorkflowState.DRAFT);
    const applicant = await login('applicant_existing_college');
    // Applicant HAS application:transition permission, so the gate passes —
    // the centralized engine must still reject this illegal edge.
    const res = await api(applicant, 'POST', `/api/applications/${app.id}/transition`, {
      action: WorkflowAction.MARK_APPROVED,
      to: WorkflowState.APPROVED,
      reason: 'attempted shortcut',
    });
    expect(res.status).toBe(422);
    expect(db.applications.get(app.id)!.state).toBe(WorkflowState.DRAFT);
  });

  it('engine rejects scrutiny pass on an application in the wrong state (422)', async () => {
    const app = appInState(WorkflowState.DRAFT);
    const scrutiny = await login('scrutiny_officer');
    const res = await api(scrutiny, 'POST', `/api/scrutiny/${app.id}/pass`);
    expect(res.status).toBe(422);
    expect(db.applications.get(app.id)!.state).toBe(WorkflowState.DRAFT);
  });

  it('blocks observer sign-off while findings are still pending (422)', async () => {
    const app = appInState(WorkflowState.AI_OBSERVER_REVIEW);
    const observer = await login('observer');
    const res = await api(observer, 'POST', `/api/observer/${app.id}/signoff`);
    expect(res.status).toBe(422);
    expect(db.applications.get(app.id)!.state).toBe(WorkflowState.AI_OBSERVER_REVIEW);
  });

  it('blocks report submission with fewer than two distinct assessor signatures (422)', async () => {
    const app = appInState(WorkflowState.ASSESSOR_REVIEW);
    const assessor1 = await login('assessor_1');
    const signed = await api(assessor1, 'POST', `/api/assessor/${app.id}/sign-report`, {
      summary: 'Solo signature',
    });
    expect(signed.status).toBe(200);
    const submit = await api(assessor1, 'POST', `/api/assessor/${app.id}/submit-report`);
    expect(submit.status).toBe(422);
    expect(db.applications.get(app.id)!.state).toBe(WorkflowState.ASSESSOR_REVIEW);
  });
});
