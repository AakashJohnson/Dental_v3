/**
 * AI Inspection Service.
 *
 * Manages capture sessions, evidence registration, and conversion of model
 * outputs into structured AIFinding records. Enforces the rules:
 *   - confidence < threshold  → NEEDS_HUMAN_REVIEW
 *   - geo/time/hash mismatch  → QUARANTINED
 *   - AI can NEVER approve/reject an application
 * Findings always start PENDING_OBSERVER_REVIEW unless quarantined/needs-review.
 */
import { db } from '../store/db.js';
import { env } from '../config/env.js';
import {
  ComplianceVerdict,
  DetectionCategory,
  FindingStatus,
  Severity,
} from '../domain/enums.js';
import { AIFinding, Evidence, InspectionSession, User } from '../types/index.js';
import { id, nowIso } from '../utils/id.js';
import { runDetection } from './ai/detectionAdapters.js';
import { rulesForApp } from './compliance.service.js';

export interface FindingRequest {
  category: DetectionCategory;
  section: string;
  item: string;
  requiredValue: number | string | boolean;
  normRuleId?: string;
  severity?: Severity;
  scenario?: 'compliant' | 'deficient' | 'low_confidence' | 'integrity';
  geo?: { lat: number; lng: number };
  /** Real detected value (e.g. from an in-browser COCO-SSD detector). */
  detectedValue?: number | string | boolean;
  /** Real detection confidence (0–1) to override the mock adapter. */
  confidence?: number;
  /** Reference to the captured evidence (video / frame source). */
  evidenceRef?: string;
}

/** Deterministic scenario picker for the "mixed" demo capture profile. */
const MIXED_DEFICIENT_KEYS = new Set(['oral_surgery_equipment', 'faculty_present', 'pg_equipment']);
const MIXED_INTEGRITY_KEYS = new Set(['hospital_distance']);
const MIXED_LOWCONF_KEYS = new Set(['lecture_hall_area']);

export const aiInspectionService = {
  openSession(applicationId: string, actor: User): InspectionSession {
    const session: InspectionSession = {
      id: id('ses'),
      applicationId,
      startedBy: actor.id,
      startedAt: nowIso(),
      status: 'OPEN',
    };
    return db.sessions.insert(session);
  },

  /**
   * Norm-driven full capture: generate one finding per applicable proforma
   * NormRule (the "show-list"). The same rules are later evaluated by the
   * compliance engine, so AI capture and compliance stay in lock-step.
   *  - profile 'clean' → everything compliant (happy path)
   *  - profile 'mixed' → a few deficiencies/integrity flags for realism
   */
  runFullCapture(
    applicationId: string,
    sessionId: string,
    profile: 'clean' | 'mixed' = 'clean',
  ): AIFinding[] {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    const rules = rulesForApp(app).filter((r) => r.category);
    const out: AIFinding[] = [];
    for (const rule of rules) {
      let scenario: FindingRequest['scenario'] = 'compliant';
      if (profile === 'mixed') {
        if (MIXED_INTEGRITY_KEYS.has(rule.key)) scenario = 'integrity';
        else if (MIXED_DEFICIENT_KEYS.has(rule.key)) scenario = 'deficient';
        else if (MIXED_LOWCONF_KEYS.has(rule.key)) scenario = 'low_confidence';
      }
      out.push(
        this.generateFinding(applicationId, sessionId, {
          category: rule.category!,
          section: rule.section,
          item: rule.requirementText,
          requiredValue: rule.requiredValue,
          normRuleId: rule.id,
          severity: rule.severityWeight,
          scenario,
        }),
      );
    }
    return out;
  },

  registerEvidence(input: {
    applicationId: string;
    sessionId: string;
    category: DetectionCategory;
    fileRef: string;
    geo: { lat: number; lng: number };
    hashValid?: boolean;
    geoValid?: boolean;
  }): Evidence {
    const evidence: Evidence = {
      id: id('evd'),
      applicationId: input.applicationId,
      sessionId: input.sessionId,
      category: input.category,
      fileRef: input.fileRef,
      geo: input.geo,
      timestamp: nowIso(),
      hash: `sha256:${id('h')}`,
      hashValid: input.hashValid ?? true,
      geoValid: input.geoValid ?? true,
    };
    return db.evidence.insert(evidence);
  },

  /** Run detection for a request and persist a structured finding. */
  generateFinding(applicationId: string, sessionId: string, req: FindingRequest): AIFinding {
    const out = runDetection({
      category: req.category,
      requiredValue: req.requiredValue,
      scenario: req.scenario,
    });

    // Real in-browser detection (COCO-SSD) may override the mock adapter.
    const detectedValue = req.detectedValue ?? out.detectedValue;
    const availableValue = req.detectedValue ?? out.availableValue;
    const confidence = req.confidence ?? out.confidence;

    const evidence = this.registerEvidence({
      applicationId,
      sessionId,
      category: req.category,
      fileRef: req.evidenceRef ?? `evidence/${req.category}/${id('f')}.jpg`,
      geo: req.geo ?? { lat: 0, lng: 0 },
      hashValid: out.hashValid,
      geoValid: out.geoValid,
    });

    const aiVerdict = this.evaluate(req.category, req.requiredValue, detectedValue);
    const severity = req.severity ?? this.deriveSeverity(aiVerdict);
    let status: FindingStatus = FindingStatus.PENDING_OBSERVER_REVIEW;

    // Integrity violations quarantine the finding immediately.
    if (!out.geoValid || !out.hashValid) {
      status = FindingStatus.QUARANTINED;
    } else if (confidence < env.aiConfidenceThreshold) {
      status = FindingStatus.NEEDS_HUMAN_REVIEW;
    }

    const finding: AIFinding = {
      id: id('fnd'),
      applicationId,
      inspectionSessionId: sessionId,
      normRuleId: req.normRuleId,
      section: req.section,
      item: req.item,
      category: req.category,
      requiredValue: req.requiredValue,
      detectedValue,
      availableValue,
      aiVerdict,
      confidence,
      evidenceRefs: [evidence.id],
      geo: evidence.geo,
      timestamp: evidence.timestamp,
      hash: evidence.hash,
      riskImpact: this.riskImpact(severity, aiVerdict),
      severity: status === FindingStatus.QUARANTINED ? Severity.INTEGRITY : severity,
      status,
    };
    return db.findings.insert(finding);
  },

  evaluate(
    category: DetectionCategory,
    required: number | string | boolean,
    detected: number | string | boolean,
  ): ComplianceVerdict {
    if (typeof required === 'boolean') {
      return detected === required ? ComplianceVerdict.COMPLIANT : ComplianceVerdict.DEFICIENT;
    }
    if (category === DetectionCategory.GEO_DISTANCE) {
      // For geo distance, detected must be <= required (max allowed).
      return Number(detected) <= Number(required)
        ? ComplianceVerdict.COMPLIANT
        : ComplianceVerdict.DEFICIENT;
    }
    return Number(detected) >= Number(required)
      ? ComplianceVerdict.COMPLIANT
      : ComplianceVerdict.DEFICIENT;
  },

  deriveSeverity(verdict: ComplianceVerdict): Severity {
    return verdict === ComplianceVerdict.DEFICIENT ? Severity.MAJOR : Severity.MINOR;
  },

  riskImpact(severity: Severity, verdict: ComplianceVerdict): number {
    if (verdict === ComplianceVerdict.COMPLIANT) return 0;
    switch (severity) {
      case Severity.MINOR:
        return 1;
      case Severity.MAJOR:
        return 3;
      case Severity.GROSS:
        return 6;
      case Severity.INTEGRITY:
        return 10;
      default:
        return 1;
    }
  },

  findingsFor(applicationId: string): AIFinding[] {
    return db.findings.find((f) => f.applicationId === applicationId);
  },

  exceptionsFor(applicationId: string): AIFinding[] {
    return db.findings.find(
      (f) =>
        f.applicationId === applicationId &&
        (f.status === FindingStatus.NEEDS_HUMAN_REVIEW ||
          f.status === FindingStatus.QUARANTINED ||
          f.status === FindingStatus.FLAGGED),
    );
  },
};
