import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { inspectionService } from '../services/inspection.service.js';
import { db } from '../store/db.js';
import { Role } from '../domain/enums.js';

export const inspectionRouter = Router();
inspectionRouter.use(authenticate);

/** Assignable assessors & observers for a case (COI flagged for the college state). */
inspectionRouter.get(
  '/:applicationId/assignable',
  requirePermission('inspection:schedule'),
  asyncH(async (req, res) => {
    const app = db.applications.get(req.params.applicationId);
    const collegeState = app?.location?.state;
    const map = (u: any) => ({ id: u.id, name: u.name, coi: Boolean(collegeState && u.coi?.states?.includes(collegeState)) });
    res.json({
      assessors: db.users.find((u) => u.role === Role.ASSESSOR).map(map),
      observers: db.users.find((u) => u.role === Role.OBSERVER).map(map),
    });
  }),
);

inspectionRouter.post(
  '/:applicationId/schedule',
  requirePermission('inspection:schedule'),
  asyncH(async (req, res) => {
    res.json(inspectionService.schedule(req.params.applicationId, req.user!));
  }),
);

inspectionRouter.post(
  '/:applicationId/assign-team',
  requirePermission('inspection:schedule'),
  asyncH(async (req, res) => {
    const { assessorIds, observerId, dates } = req.body ?? {};
    res.json(
      inspectionService.assignTeam(req.params.applicationId, assessorIds ?? [], observerId, dates ?? []),
    );
  }),
);

inspectionRouter.get(
  '/:applicationId/assignment',
  asyncH(async (req, res) => {
    const app = db.applications.get(req.params.applicationId);
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(app.scheduling ?? null);
  }),
);

inspectionRouter.post(
  '/:applicationId/approve-schedule',
  requirePermission('inspection:schedule'),
  asyncH(async (req, res) => {
    res.json(inspectionService.approveSchedule(req.params.applicationId));
  }),
);

inspectionRouter.post(
  '/:applicationId/start',
  asyncH(async (req, res) => {
    res.json(inspectionService.start(req.params.applicationId, req.user!));
  }),
);
