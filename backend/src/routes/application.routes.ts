import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncH } from '../middleware/error.js';
import { applicationService } from '../services/application.service.js';
import { workflowService } from '../services/workflow.service.js';
import { documentService } from '../services/document.service.js';
import { serializeApplication, serializeMany } from '../serializers/application.serializer.js';
import { selectableWorkflows } from '../domain/permissions.js';
import { workflowRequirements, requiredDocuments, proformaFields, MAX_HOSPITAL_DISTANCE_KM } from '../domain/workflowConfig.js';
import { db } from '../store/db.js';
import { WorkflowAction, WorkflowState, WorkflowType } from '../domain/enums.js';

export const applicationRouter = Router();
applicationRouter.use(authenticate);

const createSchema = z.object({
  collegeId: z.string(),
  workflowType: z.nativeEnum(WorkflowType),
  applicationType: z.string(),
  course: z.string(),
  specialty: z.string().optional(),
  intake: z.number().int().nonnegative(),
  documents: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        uploaded: z.boolean().optional(),
        validUpto: z.string().optional(),
      }),
    )
    .optional(),
});

applicationRouter.post(
  '/',
  requirePermission('application:create'),
  asyncH(async (req, res) => {
    const input = createSchema.parse(req.body);
    const app = applicationService.create(input, req.user!);
    res.status(201).json(serializeApplication(app, req.user!));
  }),
);

applicationRouter.get(
  '/',
  asyncH(async (req, res) => {
    const apps = applicationService.listForActor(req.user!);
    res.json(serializeMany(apps, req.user!));
  }),
);

applicationRouter.get(
  '/selectable-workflows',
  asyncH(async (req, res) => {
    const collegeId = String(req.query.collegeId ?? req.user!.collegeId ?? '');
    const college = db.colleges.get(collegeId);
    res.json(selectableWorkflows(college?.status ?? 'NEW'));
  }),
);

applicationRouter.get(
  '/workflow-requirements',
  asyncH(async (req, res) => {
    const workflowType = String(req.query.workflowType ?? '') as WorkflowType;
    if (!Object.values(WorkflowType).includes(workflowType)) {
      return res.status(400).json({ error: 'Unknown or missing workflowType' });
    }
    const course = String(req.query.course ?? 'BDS');
    const intake = Number(req.query.intake ?? 0);
    res.json(
      workflowRequirements({
        workflowType,
        course,
        intake,
        governmentCollege: false,
      }),
    );
  }),
);

applicationRouter.get(
  '/:id',
  asyncH(async (req, res) => {
    const app = applicationService.get(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(serializeApplication(app, req.user!));
  }),
);

applicationRouter.get(
  '/:id/summary',
  asyncH(async (req, res) => {
    const app = applicationService.get(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...serializeApplication(app, req.user!),
      guidance: workflowService.guidanceFor(app),
      requiredDocuments: requiredDocuments(app.workflowType),
      proformaFields: proformaFields(app.course, app.intake ?? 0),
      maxHospitalDistanceKm: MAX_HOSPITAL_DISTANCE_KM,
    });
  }),
);

applicationRouter.get(
  '/:id/documents',
  asyncH(async (req, res) => {
    const app = applicationService.get(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(documentService.list(req.params.id));
  }),
);

applicationRouter.get(
  '/:id/documents/:docId',
  asyncH(async (req, res) => {
    const doc = documentService.get(req.params.docId);
    if (!doc || doc.applicationId !== req.params.id) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  }),
);

applicationRouter.post(
  '/:id/submit',
  requirePermission('application:submit'),
  asyncH(async (req, res) => {
    const result = applicationService.submit(req.params.id, req.user!);
    res.json({
      application: serializeApplication(result.application, req.user!),
      guidance: result.guidance,
    });
  }),
);

const documentsSchema = z.object({
  documents: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      uploaded: z.boolean().optional(),
      validUpto: z.string().optional(),
      kind: z.enum(['file', 'geo', 'proforma']).optional(),
      geo: z
        .object({
          collegeLat: z.number(),
          collegeLng: z.number(),
          hospitalLat: z.number(),
          hospitalLng: z.number(),
        })
        .optional(),
      proforma: z.object({ values: z.record(z.string(), z.number()) }).optional(),
    }),
  ),
});

applicationRouter.patch(
  '/:id/documents',
  requirePermission('application:submit'),
  asyncH(async (req, res) => {
    const { documents } = documentsSchema.parse(req.body);
    const app = applicationService.updateDocuments(req.params.id, documents, req.user!);
    res.json(serializeApplication(app, req.user!));
  }),
);

const transitionSchema = z.object({
  action: z.nativeEnum(WorkflowAction),
  to: z.nativeEnum(WorkflowState),
  reason: z.string().optional(),
});

applicationRouter.post(
  '/:id/transition',
  requirePermission('application:transition'),
  asyncH(async (req, res) => {
    const { action, to, reason } = transitionSchema.parse(req.body);
    const result = workflowService.transition(req.params.id, action, to, {
      actorId: req.user!.id,
      actorRole: req.user!.role,
      reason,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({
      application: serializeApplication(result.application, req.user!),
      guidance: result.guidance,
    });
  }),
);
