/**
 * DantaDrishti — Proforma NormRule registry.
 *
 * "The proforma IS the rule table" (06_Compliance_Engine). Each row of the
 * BDS inspection proforma (50 / 100 seats) and a minimal PG set is expressed
 * as a NormRule with a Required value, a rule type, a severity weight, and a
 * gating flag. The compliance engine evaluates Required-vs-Available against
 * these rules; AI capture is driven by the same rules (the "show-list").
 *
 * Values traced to:
 *  - IP_BDS_Recognition_50_Seats / _100_Seats proformas
 *  - Regulation.md (Reg 6: land, chairs ramp-up, hospital attachment ≤10km)
 */
import { DetectionCategory, Severity } from './enums.js';
import { NormRule } from '../types/index.js';
import { ProformaTier } from './workflowConfig.js';
import { id, nowIso } from '../utils/id.js';

type RuleSpec = Omit<
  NormRule,
  'id' | 'normSetId' | 'course' | 'tier' | 'intake' | 'purpose' | 'regulationVersion' | 'effectiveFrom'
>;

/** BDS proforma rules, parameterised by 50 vs 100 seat tier. */
function bdsRules(tier: '50' | '100'): RuleSpec[] {
  const is100 = tier === '100';
  return [
    {
      key: 'dental_chairs',
      section: 'VIII. Major Equipment',
      requirementText: `Electrical dental chairs installed (Required ${is100 ? 200 : 100})`,
      requiredValue: is100 ? 200 : 100,
      unit: 'chairs',
      type: 'count',
      category: DetectionCategory.DENTAL_CHAIRS,
      dataSource: 'ai_detected',
      evaluator: 'available >= required',
      severityWeight: Severity.MAJOR,
      gating: false,
    },
    {
      key: 'hospital_beds',
      section: 'II(b). Attached Hospital',
      requirementText: '100-bedded general hospital (Annexure I)',
      requiredValue: 100,
      unit: 'beds',
      type: 'count',
      category: DetectionCategory.HOSPITAL_BEDS,
      dataSource: 'ai_detected',
      evaluator: 'available >= required',
      severityWeight: Severity.GROSS,
      gating: false,
    },
    {
      key: 'opd_census',
      section: 'III. Clinical Material',
      requirementText: `New patients/day (Required ${is100 ? 100 : 75})`,
      requiredValue: is100 ? 100 : 75,
      unit: 'patients/day',
      type: 'numeric',
      category: DetectionCategory.OPD_CENSUS,
      dataSource: 'ai_detected',
      evaluator: 'available >= required',
      severityWeight: Severity.MAJOR,
      gating: false,
    },
    {
      key: 'lecture_hall_area',
      section: 'V. Infrastructure',
      requirementText: `Lecture halls total area (Required ${is100 ? 6400 : 3200} sq.ft.)`,
      requiredValue: is100 ? 6400 : 3200,
      unit: 'sq.ft.',
      type: 'numeric',
      category: DetectionCategory.ROOM_AREA,
      dataSource: 'ai_detected',
      evaluator: 'available >= required',
      severityWeight: Severity.MAJOR,
      gating: false,
    },
    {
      key: 'library_area',
      section: 'VII. Central Library',
      requirementText: `Central library area (Required ${is100 ? 8000 : 4500} sq.ft.)`,
      requiredValue: is100 ? 8000 : 4500,
      unit: 'sq.ft.',
      type: 'numeric',
      category: DetectionCategory.LIBRARY,
      dataSource: 'ai_detected',
      evaluator: 'available >= required',
      severityWeight: Severity.MINOR,
      gating: false,
    },
    {
      key: 'hospital_distance',
      section: 'II(a). Medical College Attachment',
      requirementText: 'Attached medical college within 10 km by road',
      requiredValue: 10,
      unit: 'km (max)',
      type: 'numeric',
      category: DetectionCategory.GEO_DISTANCE,
      dataSource: 'ai_detected',
      evaluator: 'available <= required',
      severityWeight: Severity.GROSS,
      gating: true,
    },
    {
      key: 'faculty_present',
      section: 'VI(a). Dental Teaching Staff',
      requirementText: `Teaching faculty present (Required ${is100 ? 40 : 30})`,
      requiredValue: is100 ? 40 : 30,
      unit: 'faculty',
      type: 'count',
      category: DetectionCategory.FACULTY_ATTENDANCE,
      dataSource: 'ai_detected',
      evaluator: 'available >= required',
      severityWeight: Severity.MAJOR,
      gating: false,
    },
    {
      key: 'oral_surgery_equipment',
      section: 'IX. Dental Departments',
      requirementText: 'Essential department equipment present',
      requiredValue: true,
      type: 'boolean',
      category: DetectionCategory.DEPARTMENT_EQUIPMENT,
      dataSource: 'ai_detected',
      evaluator: 'available == required',
      severityWeight: Severity.MAJOR,
      gating: false,
    },
    {
      key: 'fire_safety',
      section: 'IV. Land & Infrastructure',
      requirementText: 'Fire & Safety certificate in order',
      requiredValue: true,
      type: 'boolean',
      category: DetectionCategory.FIRE_AERB_STP,
      dataSource: 'ai_detected',
      evaluator: 'available == required',
      severityWeight: Severity.MAJOR,
      gating: false,
    },
    {
      key: 'cctv',
      section: 'Checklist',
      requirementText: 'CCTV functional',
      requiredValue: true,
      type: 'boolean',
      category: DetectionCategory.CCTV,
      dataSource: 'ai_detected',
      evaluator: 'available == required',
      severityWeight: Severity.MINOR,
      gating: false,
    },
    {
      key: 'biometric',
      section: 'Checklist',
      requirementText: 'Biometric attendance device functional',
      requiredValue: true,
      type: 'boolean',
      category: DetectionCategory.BIOMETRIC,
      dataSource: 'ai_detected',
      evaluator: 'available == required',
      severityWeight: Severity.MINOR,
      gating: false,
    },
    {
      key: 'essentiality_validity',
      section: 'I. Requisite Permissions',
      requirementText: 'Essentiality Certificate valid for the session',
      requiredValue: true,
      type: 'validity_date',
      documentKey: 'essentiality',
      dataSource: 'document_verified',
      evaluator: 'validUpto >= session',
      severityWeight: Severity.GROSS,
      gating: true,
    },
    {
      key: 'affiliation_validity',
      section: 'I. Requisite Permissions',
      requirementText: 'University Affiliation valid for the session',
      requiredValue: true,
      type: 'validity_date',
      documentKey: 'affiliation',
      dataSource: 'document_verified',
      evaluator: 'validUpto >= session',
      severityWeight: Severity.GROSS,
      gating: true,
    },
  ];
}

/** Minimal PG (MDS) proforma rule set. */
function pgRules(): RuleSpec[] {
  return [
    {
      key: 'pg_chairs',
      section: 'PG Department',
      requirementText: 'PG specialty dental chairs',
      requiredValue: 17,
      unit: 'chairs',
      type: 'count',
      category: DetectionCategory.DENTAL_CHAIRS,
      dataSource: 'ai_detected',
      evaluator: 'available >= required',
      severityWeight: Severity.MAJOR,
      gating: false,
    },
    {
      key: 'pg_faculty',
      section: 'PG Teaching Staff',
      requirementText: 'PG guides / faculty present',
      requiredValue: 6,
      unit: 'faculty',
      type: 'count',
      category: DetectionCategory.FACULTY_ATTENDANCE,
      dataSource: 'ai_detected',
      evaluator: 'available >= required',
      severityWeight: Severity.MAJOR,
      gating: false,
    },
    {
      key: 'pg_opd',
      section: 'PG Clinical Material',
      requirementText: 'PG clinical workload (cases/day)',
      requiredValue: 50,
      unit: 'cases/day',
      type: 'numeric',
      category: DetectionCategory.OPD_CENSUS,
      dataSource: 'ai_detected',
      evaluator: 'available >= required',
      severityWeight: Severity.MAJOR,
      gating: false,
    },
    {
      key: 'pg_equipment',
      section: 'PG Department',
      requirementText: 'PG specialty equipment present',
      requiredValue: true,
      type: 'boolean',
      category: DetectionCategory.DEPARTMENT_EQUIPMENT,
      dataSource: 'ai_detected',
      evaluator: 'available == required',
      severityWeight: Severity.MAJOR,
      gating: false,
    },
    {
      key: 'affiliation_validity',
      section: 'I. Requisite Permissions',
      requirementText: 'University permission for the PG course valid',
      requiredValue: true,
      type: 'validity_date',
      documentKey: 'affiliation',
      dataSource: 'document_verified',
      evaluator: 'validUpto >= session',
      severityWeight: Severity.GROSS,
      gating: true,
    },
  ];
}

function materialize(specs: RuleSpec[], course: string, tier: ProformaTier, intake: number): NormRule[] {
  return specs.map((s) => ({
    ...s,
    id: id('nrm'),
    normSetId: `${course.toUpperCase()}-${tier}`,
    course: course.toUpperCase(),
    tier,
    intake,
    purpose: 'STANDARD',
    regulationVersion: 'DCI-2006',
    effectiveFrom: '2006-01-12',
  }));
}

/** Build the full norm registry for all tiers (called once at seed time). */
export function buildNormRules(): NormRule[] {
  return [
    ...materialize(bdsRules('50'), 'BDS', '50', 50),
    ...materialize(bdsRules('100'), 'BDS', '100', 100),
    ...materialize(pgRules(), 'MDS', 'PG', 0),
  ];
}

/** Seed the norm registry into the store (idempotent within a fresh DB). */
export function seedNormRules(insert: (rule: NormRule) => void): void {
  for (const rule of buildNormRules()) insert(rule);
}

/** Stamp for traceability of when the registry was generated. */
export const NORM_REGISTRY_BUILT_AT = nowIso();
