import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { assessorService } from '../services/assessor.service.js';
import { serializeMany } from '../serializers/application.serializer.js';

export const assessorRouter = Router();
assessorRouter.use(authenticate, requirePermission('assessor:review'));

assessorRouter.get(
  '/assigned',
  asyncH(async (req, res) => {
    res.json(serializeMany(assessorService.assignedTo(req.user!), req.user!));
  }),
);

assessorRouter.get(
  '/:applicationId/report',
  asyncH(async (req, res) => {
    res.json(assessorService.getOrCreateReport(req.params.applicationId));
  }),
);

assessorRouter.post(
  '/:applicationId/override',
  asyncH(async (req, res) => {
    const { findingId, reason } = req.body ?? {};
    res.json(assessorService.override(req.params.applicationId, findingId, reason, req.user!));
  }),
);

assessorRouter.post(
  '/:applicationId/sign-report',
  asyncH(async (req, res) => {
    res.json(assessorService.sign(req.params.applicationId, req.body?.summary ?? '', req.user!));
  }),
);

assessorRouter.post(
  '/:applicationId/submit-report',
  asyncH(async (req, res) => {
    res.json(assessorService.submit(req.params.applicationId, req.user!));
  }),
);
