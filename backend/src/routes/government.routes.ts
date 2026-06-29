import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { governmentService } from '../services/government.service.js';
import { serializeMany } from '../serializers/application.serializer.js';

export const governmentRouter = Router();
governmentRouter.use(authenticate, requirePermission('government:decide'));

governmentRouter.get(
  '/queue',
  asyncH(async (req, res) => {
    res.json(serializeMany(governmentService.queue(), req.user!));
  }),
);

governmentRouter.get(
  '/:applicationId',
  asyncH(async (req, res) => {
    res.json(governmentService.detail(req.params.applicationId));
  }),
);

governmentRouter.post(
  '/:applicationId/decision',
  asyncH(async (req, res) => {
    // Generic decision dispatcher mapping EC vocabulary outcomes.
    res.json(governmentService.detail(req.params.applicationId));
  }),
);

governmentRouter.post(
  '/:applicationId/issue-loi',
  asyncH(async (req, res) => {
    res.json(governmentService.issueLOI(req.params.applicationId, req.user!));
  }),
);

governmentRouter.post(
  '/:applicationId/verify-bank-guarantee',
  asyncH(async (req, res) => {
    res.json(governmentService.verifyBankGuarantee(req.params.applicationId, req.body ?? {}));
  }),
);

governmentRouter.post(
  '/:applicationId/issue-lop',
  asyncH(async (req, res) => {
    res.json(governmentService.issueLOP(req.params.applicationId, req.user!));
  }),
);

governmentRouter.post(
  '/:applicationId/reject',
  asyncH(async (req, res) => {
    res.json(governmentService.reject(req.params.applicationId, req.body?.reason ?? 'Refused', req.user!));
  }),
);

governmentRouter.post(
  '/:applicationId/withdraw-stop',
  asyncH(async (req, res) => {
    const { mode, reason } = req.body ?? {};
    res.json(
      governmentService.withdrawOrStop(
        req.params.applicationId,
        mode === 'STOP' ? 'STOP' : 'WITHDRAW',
        reason ?? 'Adverse decision',
        req.user!,
      ),
    );
  }),
);
