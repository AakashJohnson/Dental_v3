import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { scrutinyService } from '../services/scrutiny.service.js';
import { serializeMany, serializeApplication } from '../serializers/application.serializer.js';

export const scrutinyRouter = Router();
scrutinyRouter.use(authenticate, requirePermission('scrutiny:work'));

scrutinyRouter.get(
  '/queue',
  asyncH(async (req, res) => {
    res.json(serializeMany(scrutinyService.queue(), req.user!));
  }),
);

scrutinyRouter.get(
  '/:applicationId',
  asyncH(async (req, res) => {
    const apps = scrutinyService.queue().find((a) => a.id === req.params.applicationId);
    if (!apps) return res.status(404).json({ error: 'Not in scrutiny queue' });
    res.json(serializeApplication(apps, req.user!));
  }),
);

scrutinyRouter.post(
  '/:applicationId/checklist',
  asyncH(async (req, res) => {
    res.json(scrutinyService.runChecklist(req.params.applicationId, req.body?.checklist ?? {}));
  }),
);

scrutinyRouter.get(
  '/:applicationId/gates',
  asyncH(async (req, res) => {
    res.json(scrutinyService.evaluateGates(req.params.applicationId));
  }),
);

scrutinyRouter.post(
  '/:applicationId/clarification',
  asyncH(async (req, res) => {
    const result = scrutinyService.requestClarification(
      req.params.applicationId,
      req.body?.reason ?? 'Clarification requested',
      req.user!,
    );
    res.json(result);
  }),
);

scrutinyRouter.post(
  '/:applicationId/pass',
  asyncH(async (req, res) => {
    res.json(scrutinyService.pass(req.params.applicationId, req.user!));
  }),
);

scrutinyRouter.post(
  '/:applicationId/reject',
  asyncH(async (req, res) => {
    res.json(
      scrutinyService.reject(req.params.applicationId, req.body?.reason ?? 'Ineligible', req.user!),
    );
  }),
);
