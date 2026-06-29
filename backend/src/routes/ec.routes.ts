import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { ecService } from '../services/ec.service.js';
import { serializeMany } from '../serializers/application.serializer.js';

export const ecRouter = Router();
ecRouter.use(authenticate, requirePermission('ec:decide'));

ecRouter.get(
  '/queue',
  asyncH(async (req, res) => {
    res.json(serializeMany(ecService.queue(), req.user!));
  }),
);

ecRouter.get(
  '/:applicationId/review',
  asyncH(async (req, res) => {
    res.json(ecService.review(req.params.applicationId));
  }),
);

ecRouter.post(
  '/:applicationId/decision',
  asyncH(async (req, res) => {
    const { decision, rationale, undertaking } = req.body ?? {};
    res.json(ecService.decide(req.params.applicationId, decision, rationale ?? '', undertaking, req.user!));
  }),
);
