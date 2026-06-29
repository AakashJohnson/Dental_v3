import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { dashboardService } from '../services/dashboard.service.js';
import { notificationService } from '../services/notification.service.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get(
  '/',
  asyncH(async (req, res) => {
    res.json(dashboardService.forUser(req.user!));
  }),
);

dashboardRouter.get(
  '/workflow-guidance',
  asyncH(async (req, res) => {
    const applicationId = String(req.query.applicationId ?? '');
    res.json(dashboardService.guidanceFor(applicationId, req.user!));
  }),
);

export const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get(
  '/',
  asyncH(async (req, res) => {
    res.json(notificationService.forUser(req.user!.id));
  }),
);

notificationRouter.patch(
  '/:id/read',
  asyncH(async (req, res) => {
    const n = notificationService.markRead(req.params.id, req.user!.id);
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.json(n);
  }),
);
