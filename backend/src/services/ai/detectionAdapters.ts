/**
 * DantaDrishti AI — mock/demo detection adapters.
 *
 * Each adapter simulates a model output for a detection category. Real ML
 * can be swapped in behind the same interface. Adapters return a raw value
 * plus a confidence; integrity (geo/time/hash) is handled separately by the
 * AI inspection service when building the structured finding.
 *
 * Source of truth for categories & behaviour: 06_Compliance_Engine_and_DantaDrishti_AI.md
 */
import { DetectionCategory } from '../../domain/enums.js';

export interface DetectionInput {
  category: DetectionCategory;
  /** What the norm requires (for delta-based simulation only). */
  requiredValue: number | string | boolean;
  /** Optional override so seeds can craft deterministic scenarios. */
  scenario?: 'compliant' | 'deficient' | 'low_confidence' | 'integrity';
}

export interface DetectionOutput {
  detectedValue: number | string | boolean;
  availableValue: number | string | boolean;
  confidence: number;
  /** Simulated integrity flags the adapter is aware of. */
  geoValid: boolean;
  hashValid: boolean;
}

export type DetectionAdapter = (input: DetectionInput) => DetectionOutput;

function numericAdapter(input: DetectionInput): DetectionOutput {
  const required = Number(input.requiredValue) || 0;
  switch (input.scenario) {
    case 'deficient':
      return { detectedValue: Math.max(0, required - 3), availableValue: Math.max(0, required - 3), confidence: 0.92, geoValid: true, hashValid: true };
    case 'low_confidence':
      return { detectedValue: required, availableValue: required, confidence: 0.55, geoValid: true, hashValid: true };
    case 'integrity':
      return { detectedValue: required, availableValue: required, confidence: 0.9, geoValid: false, hashValid: false };
    default:
      return { detectedValue: required + 2, availableValue: required + 2, confidence: 0.95, geoValid: true, hashValid: true };
  }
}

function booleanAdapter(input: DetectionInput): DetectionOutput {
  const present = input.scenario !== 'deficient';
  return {
    detectedValue: present,
    availableValue: present,
    confidence: input.scenario === 'low_confidence' ? 0.5 : 0.9,
    geoValid: input.scenario !== 'integrity',
    hashValid: input.scenario !== 'integrity',
  };
}

function geoAdapter(input: DetectionInput): DetectionOutput {
  // requiredValue = max allowed distance km. detected = measured km.
  const maxKm = Number(input.requiredValue) || 10;
  const detected = input.scenario === 'deficient' ? maxKm + 8 : maxKm - 2;
  return {
    detectedValue: detected,
    availableValue: detected,
    confidence: input.scenario === 'low_confidence' ? 0.6 : 0.97,
    geoValid: input.scenario !== 'integrity',
    hashValid: input.scenario !== 'integrity',
  };
}

/** Registry mapping every detection category to an adapter. */
export const detectionAdapters: Record<DetectionCategory, DetectionAdapter> = {
  [DetectionCategory.DENTAL_CHAIRS]: numericAdapter,
  [DetectionCategory.HOSPITAL_BEDS]: numericAdapter,
  [DetectionCategory.WARD_OCCUPANCY]: numericAdapter,
  [DetectionCategory.OPD_CENSUS]: numericAdapter,
  [DetectionCategory.DEPARTMENT_EQUIPMENT]: booleanAdapter,
  [DetectionCategory.LIBRARY]: numericAdapter,
  [DetectionCategory.ROOM_AREA]: numericAdapter,
  [DetectionCategory.LAB_EQUIPMENT]: booleanAdapter,
  [DetectionCategory.CONSTRUCTION]: booleanAdapter,
  [DetectionCategory.CCTV]: booleanAdapter,
  [DetectionCategory.BIOMETRIC]: booleanAdapter,
  [DetectionCategory.FACULTY_ATTENDANCE]: numericAdapter,
  [DetectionCategory.GEO_DISTANCE]: geoAdapter,
  [DetectionCategory.FIRE_AERB_STP]: booleanAdapter,
  [DetectionCategory.CENSUS_MISMATCH]: numericAdapter,
  [DetectionCategory.GHOST_FACULTY]: booleanAdapter,
};

export function runDetection(input: DetectionInput): DetectionOutput {
  const adapter = detectionAdapters[input.category] ?? numericAdapter;
  return adapter(input);
}
