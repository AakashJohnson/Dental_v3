import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import { authenticate } from './middleware/auth.js';
import { authRouter } from './routes/auth.routes.js';
import { applicationRouter } from './routes/application.routes.js';
import { dashboardRouter, notificationRouter } from './routes/dashboard.routes.js';
import { scrutinyRouter } from './routes/scrutiny.routes.js';
import { inspectionRouter } from './routes/inspection.routes.js';
import { aiInspectionRouter } from './routes/aiInspection.routes.js';
import { observerRouter } from './routes/observer.routes.js';
import { assessorRouter } from './routes/assessor.routes.js';
import { ecRouter } from './routes/ec.routes.js';
import { complianceRouter, deficiencyRouter } from './routes/deficiency.routes.js';
import { governmentRouter } from './routes/government.routes.js';
import { reportRouter } from './routes/report.routes.js';
import { db } from './store/db.js';
import { ECDecision, WorkflowState, WorkflowType, Role } from './domain/enums.js';
import { TRANSITIONS } from './domain/transitions.js';
import { serializeCollege, collegeDisclosureFor } from './serializers/college.serializer.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'dantadrishti' }));

  // Reference / metadata used by the frontend.
  app.get('/api/meta', (_req, res) =>
    res.json({
      states: Object.values(WorkflowState),
      workflows: Object.values(WorkflowType),
      decisions: Object.values(ECDecision),
      roles: Object.values(Role),
      transitions: TRANSITIONS,
    }),
  );

  app.get('/api/colleges', authenticate, (req, res) => {
    const viewer = req.user!;
    const owns = (collegeId: string) =>
      viewer.collegeId === collegeId || (viewer.delegatedCollegeIds ?? []).includes(collegeId);
    res.json(
      db.colleges
        .all()
        .map((c) => serializeCollege(c, collegeDisclosureFor(viewer, c, owns(c.id)))),
    );
  });

  // ---- Public (no-auth) endpoints for the pre-login site --------------------
  app.get('/api/public/stats', (_req, res) => {
    const apps = db.applications.all();
    const findings = db.findings.all();
    const deficiencies = db.deficiencies.all();
    res.json({
      applications: apps.length,
      colleges: db.colleges.all().length,
      evidence: db.evidence.all().length,
      aiFindings: findings.length,
      deficienciesResolved: deficiencies.filter((d) => d.status === 'RESOLVED').length,
      approved: apps.filter((a) => a.state === WorkflowState.APPROVED).length,
      byState: apps.reduce<Record<string, number>>((acc, a) => {
        acc[a.state] = (acc[a.state] ?? 0) + 1;
        return acc;
      }, {}),
      sampleCodes: apps.slice(0, 4).map((a) => a.code),
    });
  });

  app.get('/api/public/colleges', (_req, res) => {
    const apps = db.applications.all();
    const publicList = db.colleges.all().map((c) => {
      const collegeApps = apps.filter((a) => a.collegeId === c.id);
      const latest = collegeApps.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      return {
        id: c.id,
        name: c.name,
        state: c.state,
        city: c.city,
        status: c.status,
        courses: c.courses,
        geo: c.geo,
        latestState: latest?.state ?? null,
        latestWorkflow: latest?.workflowType ?? null,
        applications: collegeApps.length,
      };
    });
    res.json(publicList);
  });

  app.get('/api/public/track/:code', (req, res) => {
    const app2 = db.applications.find((a) => a.code.toLowerCase() === String(req.params.code).toLowerCase())[0];
    if (!app2) return res.status(404).json({ error: 'No application found for that reference code.' });
    const college = db.colleges.get(app2.collegeId);
    const history = db.audit
      .find((e) => e.applicationId === app2.id)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((e) => ({ action: e.action, toState: e.toState, timestamp: e.timestamp }));
    res.json({
      code: app2.code,
      college: college?.name ?? 'Dental College',
      state: college?.state,
      workflowType: app2.workflowType,
      currentState: app2.state,
      course: app2.course,
      intake: app2.intake,
      history,
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/applications', applicationRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/scrutiny', scrutinyRouter);
  app.use('/api/inspections', inspectionRouter);
  app.use('/api/ai-inspection', aiInspectionRouter);
  app.use('/api/observer', observerRouter);
  app.use('/api/assessor', assessorRouter);
  app.use('/api/ec', ecRouter);
  app.use('/api/deficiency', deficiencyRouter);
  app.use('/api/compliance', complianceRouter);
  app.use('/api/government', governmentRouter);
  app.use('/api/reports', reportRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
