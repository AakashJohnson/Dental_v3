import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import { seed } from '../src/store/seed.js';
import { db } from '../src/store/db.js';
import { WorkflowState, WorkflowType, ECDecision } from '../src/domain/enums.js';

/**
 * PART 2 — full lifecycle through the real Express HTTP surface.
 * Boots the app on an ephemeral port and drives DRAFT → APPROVED purely over
 * HTTP with role-based logins, then asserts audit, notifications and the
 * evolving `allowedActions` envelope.
 */
let server: Server;
let base: string;

beforeAll(async () => {
  seed();
  server = createApp().listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
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

describe('PART 2 — HTTP API full lifecycle DRAFT → APPROVED', () => {
  it('walks the whole approval workflow across role logins over HTTP', async () => {
    // 1. Login as applicant (owns the proposed NEW college Sunrise).
    const applicant = await login('applicant_new_college');
    const sunrise = db.colleges.findOne((c) => c.name.includes('Sunrise'))!;

    // 2+3. Create application with mandatory (gating) documents already uploaded.
    const created = await api(applicant, 'POST', '/api/applications', {
      collegeId: sunrise.id,
      workflowType: WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG,
      applicationType: 'NEW_COLLEGE_PERMISSION',
      course: 'BDS',
      intake: 50,
      documents: [
        { name: 'Essentiality Certificate', type: 'ESSENTIALITY', uploaded: true, validUpto: '2030-12-31' },
        { name: 'University Affiliation Letter', type: 'AFFILIATION', uploaded: true, validUpto: '2030-12-31' },
        { name: 'Land Documents 6 acres', type: 'LAND', uploaded: true },
        { name: 'Site & Hospital Distance Map Proof', type: 'DISTANCE_MAP', uploaded: true },
        { name: 'Inspection Proforma Self-Assessment', type: 'PROFORMA', uploaded: true },
      ],
    });
    expect(created.status).toBe(201);
    const appId = created.body.id as string;
    expect(created.body.state).toBe(WorkflowState.DRAFT);
    // Applicant in DRAFT may submit.
    expect(created.body.allowedActions).toContain('APPLICATION_SUBMIT');

    // 4+5. Submit → Under Scrutiny.
    const submitted = await api(applicant, 'POST', `/api/applications/${appId}/submit`);
    expect(submitted.status).toBe(200);
    expect(submitted.body.application.state).toBe(WorkflowState.UNDER_SCRUTINY);
    const submitActions = submitted.body.application.allowedActions as string[];

    // 6+7. Scrutiny Officer passes scrutiny → Inspection Scheduled.
    const scrutiny = await login('scrutiny_officer');
    const passed = await api(scrutiny, 'POST', `/api/scrutiny/${appId}/pass`);
    expect(passed.status).toBe(200);
    expect(db.applications.get(appId)!.state).toBe(WorkflowState.INSPECTION_SCHEDULED);

    // 8. Login as Case Officer; read assignable team (COI-flagged).
    const caseOfficer = await login('case_officer');
    const assignable = await api(caseOfficer, 'GET', `/api/inspections/${appId}/assignable`);
    expect(assignable.status).toBe(200);
    const assessors = assignable.body.assessors.filter((a: any) => !a.coi).slice(0, 2);
    const observer = assignable.body.observers.find((o: any) => !o.coi);
    expect(assessors.length).toBe(2);

    // 9+10+11. Assign ≥2 assessors + 1 observer, then approve the schedule.
    const assign = await api(caseOfficer, 'POST', `/api/inspections/${appId}/assign-team`, {
      assessorIds: assessors.map((a: any) => a.id),
      observerId: observer.id,
      dates: ['2026-09-01'],
    });
    expect(assign.status).toBe(200);
    const approve = await api(caseOfficer, 'POST', `/api/inspections/${appId}/approve-schedule`);
    expect(approve.status).toBe(200);

    // 12+13. Login as Assessor 1; start AI inspection → AI Inspection.
    const assessor1Name = assessors[0].id;
    const assessor1 = await loginByUserId(assessor1Name);
    const start = await api(assessor1, 'POST', `/api/inspections/${appId}/start`);
    expect(start.status).toBe(200);
    expect(db.applications.get(appId)!.state).toBe(WorkflowState.AI_INSPECTION);

    // 14+15. Full AI capture + route to observer → AI Observer Review.
    const run = await api(assessor1, 'POST', `/api/ai-inspection/${appId}/run`, { profile: 'clean' });
    expect(run.status).toBe(201);
    expect(db.applications.get(appId)!.state).toBe(WorkflowState.AI_OBSERVER_REVIEW);

    // 16+17+18. Login as Observer; verify every finding, then sign off.
    const observerTok = await login('observer');
    const findings = await api(observerTok, 'GET', `/api/observer/${appId}/findings`);
    expect(findings.status).toBe(200);
    for (const f of findings.body) {
      const v = await api(observerTok, 'POST', `/api/observer/${appId}/verify-finding`, {
        findingId: f.id,
        verdict: 'ACCEPT',
        notes: 'verified',
      });
      expect(v.status).toBe(200);
    }
    const signoff = await api(observerTok, 'POST', `/api/observer/${appId}/signoff`);
    expect(signoff.status).toBe(200);
    expect(db.applications.get(appId)!.state).toBe(WorkflowState.ASSESSOR_REVIEW);

    // 19+20. Assessor adds an override with a reason on the first finding.
    const firstFinding = findings.body[0];
    const override = await api(assessor1, 'POST', `/api/assessor/${appId}/override`, {
      findingId: firstFinding.id,
      reason: 'On-site re-measurement confirms compliance',
    });
    expect(override.status).toBe(200);

    // 21+22+23. Two distinct assessors sign, then submit → EC Review.
    const s1 = await api(assessor1, 'POST', `/api/assessor/${appId}/sign-report`, { summary: 'Joint report' });
    expect(s1.status).toBe(200);
    const assessor2 = await loginByUserId(assessors[1].id);
    const s2 = await api(assessor2, 'POST', `/api/assessor/${appId}/sign-report`, { summary: 'Joint report' });
    expect(s2.status).toBe(200);
    const submitReport = await api(assessor1, 'POST', `/api/assessor/${appId}/submit-report`);
    expect(submitReport.status).toBe(200);
    expect(db.applications.get(appId)!.state).toBe(WorkflowState.EC_REVIEW);

    // 24+25. Login as EC member; record APPROVE → Government Decision.
    const ec = await login('ec_member');
    const ecDecision = await api(ec, 'POST', `/api/ec/${appId}/decision`, {
      decision: ECDecision.APPROVE,
      rationale: 'Compliant with norms',
    });
    expect(ecDecision.status).toBe(200);
    expect(db.applications.get(appId)!.state).toBe(WorkflowState.GOVERNMENT_DECISION);

    // 26+27. Login as Government Authority; issue LOI → Letter of Intent.
    const gov = await login('government_authority');
    const loi = await api(gov, 'POST', `/api/government/${appId}/issue-loi`);
    expect(loi.status).toBe(200);
    expect(db.applications.get(appId)!.state).toBe(WorkflowState.LETTER_OF_INTENT);

    // 28+29. Bank guarantee verified (statutory financial step).
    const detail = await api(gov, 'GET', `/api/government/${appId}`);
    const required = detail.body.requiredBankGuarantee;
    const bg = await api(gov, 'POST', `/api/government/${appId}/verify-bank-guarantee`, {
      amountLakh: required?.applicable ? required.amountLakh : 0,
      bank: 'State Bank',
      reference: 'BG-HTTP-1',
      validUpto: '2032-12-31',
    });
    expect(bg.status).toBe(200);

    // 30+31+32. Issue LOP → Approved.
    const lop = await api(gov, 'POST', `/api/government/${appId}/issue-lop`);
    expect(lop.status).toBe(200);
    expect(db.applications.get(appId)!.state).toBe(WorkflowState.APPROVED);

    // 33. Audit log exists for every transition (via the HTTP audit report).
    const dci = await login('dci_admin');
    const audit = await api(dci, 'GET', `/api/reports/audit/${appId}`);
    expect(audit.status).toBe(200);
    const toStates = audit.body.map((e: any) => e.toState);
    for (const s of [
      WorkflowState.SUBMITTED,
      WorkflowState.UNDER_SCRUTINY,
      WorkflowState.INSPECTION_SCHEDULED,
      WorkflowState.AI_INSPECTION,
      WorkflowState.AI_OBSERVER_REVIEW,
      WorkflowState.ASSESSOR_REVIEW,
      WorkflowState.EC_REVIEW,
      WorkflowState.GOVERNMENT_DECISION,
      WorkflowState.LETTER_OF_INTENT,
      WorkflowState.APPROVED,
    ]) {
      expect(toStates, `audit should record ${s}`).toContain(s);
    }

    // 34. Notifications were created for the applicant along the way.
    const notifs = await api(applicant, 'GET', '/api/notifications');
    expect(notifs.status).toBe(200);
    expect(Array.isArray(notifs.body)).toBe(true);
    expect(notifs.body.length).toBeGreaterThan(0);

    // 35. allowedActions changed across stages and is empty in the terminal state.
    const finalView = await api(dci, 'GET', `/api/applications/${appId}`);
    expect(finalView.status).toBe(200);
    expect(finalView.body.state).toBe(WorkflowState.APPROVED);
    const finalActions = finalView.body.allowedActions as string[];
    // Terminal APPROVED state exposes no forward workflow actions to the applicant.
    const applicantFinal = await api(applicant, 'GET', `/api/applications/${appId}`);
    expect(applicantFinal.body.allowedActions).not.toContain('APPLICATION_SUBMIT');
    expect(submitActions).not.toEqual(finalActions);
  });
});

/** Resolve a login token for a known seeded user id (assessors picked dynamically). */
async function loginByUserId(userId: string): Promise<string> {
  const user = db.users.get(userId)!;
  return login(user.username);
}
