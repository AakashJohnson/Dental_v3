import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { observerService } from '../services/observer.service.js';

export const observerRouter = Router();
observerRouter.use(authenticate, requirePermission('observer:verify'));

observerRouter.get(
  '/:applicationId/findings',
  asyncH(async (req, res) => {
    res.json(observerService.findingsFor(req.params.applicationId));
  }),
);

observerRouter.post(
  '/:applicationId/verify-finding',
  asyncH(async (req, res) => {
    const { findingId, verdict, notes, exceptionReason } = req.body ?? {};
    res.json(observerService.verifyFinding(findingId, verdict, notes, exceptionReason, req.user!));
  }),
);

observerRouter.post(
  '/:applicationId/signoff',
  asyncH(async (req, res) => {
    res.json(observerService.signoff(req.params.applicationId, req.user!));
  }),
);
