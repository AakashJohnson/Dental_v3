/**
 * Compliance Rule Engine + Risk Scoring.
 *
 * Evaluates the application's proforma NormRules (Required vs Available),
 * drawing "Available" from AI findings (by norm rule) and from uploaded
 * documents (validity dates). Produces ComplianceResult records, derives a
 * structured DeficiencyItem list with severity, computes a weighted risk
 * score, and suggests an EC outcome (advisory only — the EC always decides).
 *
 * Source of truth: 06_Compliance_Engine_and_DantaDrishti_AI.md
 *                  (and the BDS inspection proformas as the rule table)
 */
import { db } from '../store/db.js';
import {
  ComplianceVerdict,
  ECDecision,
  FindingStatus,
  RiskLevel,
  Severity,
  WorkflowType,
} from '../domain/enums.js';
import { proformaTier } from '../domain/workflowConfig.js';
import { Application, ComplianceResult, DeficiencyItem, NormRule } from '../types/index.js';
import { id } from '../utils/id.js';

const SEVERITY_WEIGHT: Record<Severity, number> = {
  [Severity.MINOR]: 1,
  [Severity.MAJOR]: 3,
  [Severity.GROSS]: 6,
  [Severity.INTEGRITY]: 10,
};

/** The proforma NormRules applicable to an application (course + intake tier). */
export function rulesForApp(app: Application): NormRule[] {
  const course = app.course.toUpperCase();
  const tier = proformaTier(app.course, app.intake);
  return db.normRules.find((r) => r.course === course && r.tier === tier);
}

function numeric(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

/** Evaluate one rule given an available value. */
function evaluateRule(
  rule: NormRule,
  available: number | string | boolean | undefined,
): ComplianceVerdict {
  if (available === undefined || available === null) return ComplianceVerdict.NEEDS_HUMAN_REVIEW;
  if (rule.type === 'boolean' || typeof rule.requiredValue === 'boolean') {
    return available === rule.requiredValue ? ComplianceVerdict.COMPLIANT : ComplianceVerdict.DEFICIENT;
  }
  const req = numeric(rule.requiredValue);
  const av = typeof available === 'boolean' ? undefined : Number(available);
  if (req === undefined || av === undefined || Number.isNaN(av)) return ComplianceVerdict.NEEDS_HUMAN_REVIEW;
  // Distance-type rules use "<=" (available must not exceed the max).
  if (rule.evaluator.includes('<=')) {
    return av <= req ? ComplianceVerdict.COMPLIANT : ComplianceVerdict.DEFICIENT;
  }
  return av >= req ? ComplianceVerdict.COMPLIANT : ComplianceVerdict.DEFICIENT;
}

function makeDeficiency(
  app: Application,
  section: string,
  requirement: string,
  required: string,
  available: string,
  severity: Severity,
  observation?: string,
  normRuleId?: string,
): DeficiencyItem {
  return {
    id: id('def'),
    applicationId: app.id,
    sourceWorkflowId: app.id,
    normRuleId,
    requirement: `${section}: ${requirement} (required ${required})`,
    deficiency: `Available ${available}, required ${required}`,
    section,
    severity,
    status: 'OUTSTANDING',
    evidenceUploads: [],
    observerOrInspectorObservation: observation,
    outstandingDelta: true,
  };
}

export const complianceService = {
  /** Run the engine across an application's proforma rules + findings. */
  evaluateApplication(applicationId: string) {
    const app = db.applications.get(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });

    // Recompute cleanly: clear prior auto-generated results + outstanding auto deficiencies.
    db.complianceResults.removeWhere((r) => r.applicationId === applicationId);
    db.deficiencies.removeWhere(
      (d) =>
        d.applicationId === applicationId &&
        d.status === 'OUTSTANDING' &&
        d.sourceWorkflowId === app.id,
    );

    const rules = rulesForApp(app);
    const findings = db.findings.find((f) => f.applicationId === applicationId);
    const usedFindingIds = new Set<string>();
    const results: ComplianceResult[] = [];
    const deficiencies: DeficiencyItem[] = [];

    const pushResult = (r: ComplianceResult) => {
      db.complianceResults.insert(r);
      results.push(r);
    };
    const pushDeficiency = (d: DeficiencyItem) => {
      db.deficiencies.insert(d);
      deficiencies.push(d);
    };

    const recordRule = (
      rule: NormRule,
      verdict: ComplianceVerdict,
      available: number | string | boolean | undefined,
      source: string,
      evidenceRefs: string[],
      integrity: boolean,
    ) => {
      const deficient = verdict === ComplianceVerdict.DEFICIENT || integrity;
      let severity = integrity ? Severity.INTEGRITY : rule.severityWeight;
      if (deficient && rule.gating && severity !== Severity.INTEGRITY) severity = Severity.GROSS;

      const deficiencyValue =
        typeof rule.requiredValue === 'number' && typeof available === 'number'
          ? Math.max(0, rule.requiredValue - available)
          : undefined;

      pushResult({
        id: id('cmp'),
        applicationId,
        ruleId: rule.id,
        requiredValue: rule.requiredValue,
        availableValue: available ?? 'NOT_VERIFIED',
        source,
        verdict,
        deficiencyValue,
        severity,
        evidenceRefs,
        riskImpact: deficient ? SEVERITY_WEIGHT[severity] : 0,
      });

      if (deficient) {
        pushDeficiency(
          makeDeficiency(
            app,
            rule.section,
            rule.requirementText,
            String(rule.requiredValue),
            available === undefined ? 'not verified' : String(available),
            severity,
            undefined,
            rule.id,
          ),
        );
      }
    };

    // 1) Evaluate every applicable proforma rule.
    for (const rule of rules) {
      let available: number | string | boolean | undefined;
      let source = rule.dataSource;
      let evidenceRefs: string[] = [];
      let integrity = false;

      if (rule.type === 'validity_date' && rule.documentKey) {
        const doc = (app.documents ?? []).find((d) =>
          d.name.toLowerCase().includes(rule.documentKey!.toLowerCase()),
        );
        source = 'document_verified';
        if (!doc || !doc.uploaded) {
          // Missing mandatory gating doc → hard deficiency.
          recordRule(rule, ComplianceVerdict.DEFICIENT, undefined, source, [], false);
          continue;
        }
        if (!doc.validUpto) {
          available = undefined; // uploaded but undated → needs human review (non-deficiency)
        } else {
          available = new Date(doc.validUpto).getTime() >= Date.now();
        }
        const verdict = available === undefined ? ComplianceVerdict.NEEDS_HUMAN_REVIEW : evaluateRule(rule, available);
        recordRule(rule, verdict, available, source, [], false);
        continue;
      }

      const finding = findings.find(
        (f) => !usedFindingIds.has(f.id) && (f.normRuleId === rule.id || f.category === rule.category),
      );
      if (finding) {
        usedFindingIds.add(finding.id);
        available = finding.availableValue;
        evidenceRefs = finding.evidenceRefs;
        source = 'ai_inspection';
        integrity = finding.severity === Severity.INTEGRITY || finding.status === FindingStatus.QUARANTINED;
      }

      const verdict = integrity ? ComplianceVerdict.DEFICIENT : evaluateRule(rule, available);
      recordRule(rule, verdict, available, source, evidenceRefs, integrity);
    }

    // 2) Fold in findings not covered by a rule (census mismatch, ghost faculty, …)
    //    so integrity/deficient evidence is never silently dropped.
    for (const f of findings) {
      if (usedFindingIds.has(f.id)) continue;
      const verdict = f.finalVerdict ?? f.aiVerdict;
      const integrity = f.severity === Severity.INTEGRITY || f.status === FindingStatus.QUARANTINED;
      if (verdict !== ComplianceVerdict.DEFICIENT && !integrity) continue;
      const severity = integrity ? Severity.INTEGRITY : f.severity;
      pushResult({
        id: id('cmp'),
        applicationId,
        ruleId: f.normRuleId ?? f.category,
        requiredValue: f.requiredValue,
        availableValue: f.availableValue,
        source: 'ai_inspection',
        verdict: ComplianceVerdict.DEFICIENT,
        severity,
        evidenceRefs: f.evidenceRefs,
        riskImpact: SEVERITY_WEIGHT[severity],
        override: f.assessorOverride,
        overrideReason: f.overrideReason,
      });
      pushDeficiency(
        makeDeficiency(app, f.section, f.item, String(f.requiredValue), String(f.availableValue), severity, f.observerNotes),
      );
    }

    // 3) Risk roll-up + advisory decision.
    const riskScore = results.reduce((sum, r) => sum + r.riskImpact, 0);
    const riskLevel = this.riskLevel(riskScore);
    const suggestedDecision = this.suggestDecision(app.workflowType, app.collegeId, deficiencies, riskScore);
    db.applications.update(applicationId, { riskScore, riskLevel, suggestedDecision });

    return { results, deficiencies, riskScore, riskLevel, suggestedDecision };
  },

  riskLevel(score: number): RiskLevel {
    if (score === 0) return RiskLevel.LOW;
    if (score <= 5) return RiskLevel.MEDIUM;
    return RiskLevel.HIGH;
  },

  /** Advisory EC outcome based on the documented severity → outcome mapping. */
  suggestDecision(
    workflowType: WorkflowType,
    collegeId: string,
    deficiencies: DeficiencyItem[],
    riskScore: number,
  ): ECDecision {
    const college = db.colleges.get(collegeId);
    const hasIntegrity = deficiencies.some((d) => d.severity === Severity.INTEGRITY);
    const hasGross = deficiencies.some((d) => d.severity === Severity.GROSS);
    const hasMajor = deficiencies.some((d) => d.severity === Severity.MAJOR);
    const recognized = college?.status === 'RECOGNIZED';

    if (riskScore === 0 && deficiencies.length === 0) return ECDecision.APPROVE;
    if (!hasMajor && !hasGross && !hasIntegrity) return ECDecision.APPROVE_ON_UNDERTAKING;

    if (hasGross || hasIntegrity) {
      if (
        recognized ||
        workflowType === WorkflowType.WORKFLOW_6_PERIODIC_INSPECTION ||
        workflowType === WorkflowType.WORKFLOW_4_RECOGNITION_BDS_MDS
      ) {
        return ECDecision.WITHDRAW_OR_STOP_ADMISSION;
      }
      if (
        workflowType === WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG ||
        workflowType === WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS
      ) {
        return ECDecision.PARTIAL_APPROVAL_OR_RESTRAIN_CAPACITY;
      }
      return ECDecision.REFUSE;
    }

    const persistent = deficiencies.some((d) => d.outstandingDelta === true && d.status !== 'RESOLVED');
    return persistent ? ECDecision.NOT_GRANTED_TILL_DEFICIENCIES_RECTIFIED : ECDecision.ASK_COMPLIANCE;
  },

  resultsFor(applicationId: string): ComplianceResult[] {
    return db.complianceResults.find((r) => r.applicationId === applicationId);
  },

  severityWeight: SEVERITY_WEIGHT,
};
