import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { aiInspectionService } from '../services/aiInspection.service.js';
import { workflowService } from '../services/workflow.service.js';
import { WorkflowAction, WorkflowState } from '../domain/enums.js';

export const aiInspectionRouter = Router();
aiInspectionRouter.use(authenticate);

aiInspectionRouter.post(
  '/:applicationId/session',
  requirePermission('inspection:capture'),
  asyncH(async (req, res) => {
    res.status(201).json(aiInspectionService.openSession(req.params.applicationId, req.user!));
  }),
);

aiInspectionRouter.post(
  '/:applicationId/evidence',
  requirePermission('inspection:capture'),
  asyncH(async (req, res) => {
    const { sessionId, category, fileRef, geo, hashValid, geoValid } = req.body ?? {};
    res.status(201).json(
      aiInspectionService.registerEvidence({
        applicationId: req.params.applicationId,
        sessionId,
        category,
        fileRef,
        geo: geo ?? { lat: 0, lng: 0 },
        hashValid,
        geoValid,
      }),
    );
  }),
);

aiInspectionRouter.post(
  '/:applicationId/findings',
  requirePermission('inspection:capture'),
  asyncH(async (req, res) => {
    const { sessionId, requests } = req.body ?? {};
    const findings = (requests ?? []).map((r: any) =>
      aiInspectionService.generateFinding(req.params.applicationId, sessionId, r),
    );
    // After generating findings, route AI_INSPECTION → AI_OBSERVER_REVIEW.
    let guidance;
    try {
      const result = workflowService.transition(
        req.params.applicationId,
        WorkflowAction.SEND_TO_OBSERVER,
        WorkflowState.AI_OBSERVER_REVIEW,
        { actorId: req.user!.id, actorRole: req.user!.role, reason: 'AI findings generated' },
      );
      guidance = result.guidance;
    } catch {
      // Transition may be invalid if already past this stage — findings still returned.
    }
    res.status(201).json({ findings, guidance });
  }),
);

aiInspectionRouter.post(
  '/:applicationId/run',
  requirePermission('inspection:capture'),
  asyncH(async (req, res) => {
    // Norm-driven full capture: one finding per applicable proforma rule.
    const session = aiInspectionService.openSession(req.params.applicationId, req.user!);
    const profile = req.body?.profile === 'mixed' ? 'mixed' : 'clean';
    const findings = aiInspectionService.runFullCapture(req.params.applicationId, session.id, profile);
    let guidance;
    try {
      const result = workflowService.transition(
        req.params.applicationId,
        WorkflowAction.SEND_TO_OBSERVER,
        WorkflowState.AI_OBSERVER_REVIEW,
        { actorId: req.user!.id, actorRole: req.user!.role, reason: 'AI full capture completed' },
      );
      guidance = result.guidance;
    } catch {
      // Already past this stage — findings still returned.
    }
    res.status(201).json({ sessionId: session.id, findings, guidance });
  }),
);

aiInspectionRouter.get(
  '/:applicationId/findings',
  asyncH(async (req, res) => {
    res.json(aiInspectionService.findingsFor(req.params.applicationId));
  }),
);

aiInspectionRouter.get(
  '/:applicationId/exceptions',
  asyncH(async (req, res) => {
    res.json(aiInspectionService.exceptionsFor(req.params.applicationId));
  }),
);
