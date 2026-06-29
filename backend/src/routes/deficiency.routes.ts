import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { deficiencyService } from '../services/deficiency.service.js';

/** Deficiency issuance (compliance officers / admins). */
export const deficiencyRouter = Router();
deficiencyRouter.use(authenticate, requirePermission('compliance:work'));

deficiencyRouter.post(
  '/:applicationId/issue',
  asyncH(async (req, res) => {
    res.json(deficiencyService.issue(req.params.applicationId, req.user!));
  }),
);

deficiencyRouter.post(
  '/:applicationId/reopen-window',
  asyncH(async (req, res) => {
    res.json(deficiencyService.reopenWindow(req.params.applicationId, req.user!));
  }),
);

/** Compliance: visible to applicants (read/submit) and officers (validate). */
export const complianceRouter = Router();
complianceRouter.use(authenticate);

complianceRouter.get(
  '/:applicationId',
  asyncH(async (req, res) => {
    res.json(deficiencyService.delta(req.params.applicationId));
  }),
);

complianceRouter.post(
  '/:applicationId/submit',
  requirePermission('application:transition'),
  asyncH(async (req, res) => {
    res.json(deficiencyService.submitCompliance(req.params.applicationId, req.body?.replies ?? []));
  }),
);

complianceRouter.post(
  '/:applicationId/validate',
  requirePermission('compliance:work'),
  asyncH(async (req, res) => {
    res.json(deficiencyService.validate(req.params.applicationId, req.body?.decisions ?? []));
  }),
);

complianceRouter.post(
  '/:applicationId/trigger-reverification',
  requirePermission('compliance:work'),
  asyncH(async (req, res) => {
    res.json(deficiencyService.triggerReverification(req.params.applicationId, req.user!));
  }),
);
