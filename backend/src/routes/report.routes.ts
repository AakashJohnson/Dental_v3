import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { reportService } from '../services/report.service.js';

export const reportRouter = Router();
reportRouter.use(authenticate, requirePermission('reports:view'));

reportRouter.get('/pipeline', asyncH(async (_req, res) => res.json(reportService.pipeline())));
reportRouter.get('/deficiencies', asyncH(async (_req, res) => res.json(reportService.deficiencies())));
reportRouter.get('/risk', asyncH(async (_req, res) => res.json(reportService.risk())));
reportRouter.get('/sla', asyncH(async (_req, res) => res.json(reportService.sla())));
reportRouter.get('/map', asyncH(async (_req, res) => res.json(reportService.map())));
reportRouter.get(
  '/audit/:applicationId',
  asyncH(async (req, res) => res.json(reportService.audit(req.params.applicationId))),
);
