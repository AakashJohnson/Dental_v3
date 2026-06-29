/**
 * Realistic demo AI-inspection findings used across the AI Inspection page,
 * observer/assessor dashboards and reports. Replace with `/ai-inspection` API later.
 */

export type FindingStatus = 'verified' | 'flagged' | 'lowConfidence' | 'quarantined';

export interface DetectionModule {
  key: string;
  label: string;
  scene: string;
  detected: number;
  required: number;
  unit: string;
  confidence: number;
  status: FindingStatus;
  evidence: number;
}

export const DETECTION_MODULES: DetectionModule[] = [
  { key: 'chairs', label: 'Dental Chair Count', scene: 'dentalChair', detected: 9, required: 10, unit: 'chairs', confidence: 96, status: 'flagged', evidence: 14 },
  { key: 'beds', label: 'Hospital Bed Count', scene: 'hospitalBed', detected: 312, required: 320, unit: 'beds', confidence: 92, status: 'verified', evidence: 22 },
  { key: 'equipment', label: 'Equipment Presence', scene: 'equipment', detected: 18, required: 20, unit: 'items', confidence: 88, status: 'flagged', evidence: 18 },
  { key: 'faculty', label: 'Faculty Attendance', scene: 'faculty', detected: 42, required: 48, unit: 'faculty', confidence: 84, status: 'lowConfidence', evidence: 16 },
  { key: 'opd', label: 'OPD Census', scene: 'opd', detected: 214, required: 150, unit: 'patients', confidence: 90, status: 'verified', evidence: 9 },
  { key: 'area', label: 'Room Area Verification', scene: 'proforma', detected: 95, required: 100, unit: '% area', confidence: 86, status: 'verified', evidence: 11 },
  { key: 'cctv', label: 'CCTV / Biometric Device', scene: 'faculty', detected: 24, required: 24, unit: 'devices', confidence: 94, status: 'verified', evidence: 8 },
  { key: 'safety', label: 'Fire / AERB / STP Evidence', scene: 'equipment', detected: 6, required: 8, unit: 'certs', confidence: 71, status: 'quarantined', evidence: 6 },
  { key: 'geo', label: 'Geo-distance Verification', scene: 'geo', detected: 4, required: 8, unit: 'km', confidence: 99, status: 'verified', evidence: 4 },
];

export const FINDING_META: Record<FindingStatus, { label: string; color: string; soft: string }> = {
  verified: { label: 'Verified', color: '#15803d', soft: '#e4f4ea' },
  flagged: { label: 'Flagged', color: '#ea7317', soft: '#fdebd8' },
  lowConfidence: { label: 'Low confidence', color: '#b8860b', soft: '#f7eecb' },
  quarantined: { label: 'Quarantined', color: '#dc2626', soft: '#fde7e7' },
};

export interface EvidenceClip {
  id: string;
  module: string;
  scene: string;
  status: FindingStatus;
  geo: string;
  time: string;
  hash: string;
}

export const EVIDENCE_GALLERY: EvidenceClip[] = [
  { id: 'EV-0091', module: 'Dental Chair Lab', scene: 'dentalChair', status: 'verified', geo: '12.296°N 76.639°E', time: '10:14:22', hash: '0x9af3…1c' },
  { id: 'EV-0092', module: 'Hospital Ward B', scene: 'hospitalBed', status: 'verified', geo: '12.296°N 76.641°E', time: '10:31:05', hash: '0x4b21…7e' },
  { id: 'EV-0093', module: 'Equipment Store', scene: 'equipment', status: 'flagged', geo: '12.295°N 76.640°E', time: '10:52:40', hash: '0x77de…02' },
  { id: 'EV-0094', module: 'Faculty Biometric', scene: 'faculty', status: 'lowConfidence', geo: '12.296°N 76.639°E', time: '11:05:18', hash: '0x10ac…b9' },
  { id: 'EV-0095', module: 'OPD Registration', scene: 'opd', status: 'verified', geo: '12.297°N 76.638°E', time: '11:22:51', hash: '0x52f8…3d' },
  { id: 'EV-0096', module: 'STP / Bio-waste', scene: 'equipment', status: 'quarantined', geo: '12.294°N 76.642°E', time: '11:40:09', hash: '0xee01…aa' },
];

export const CONFIDENCE_HISTOGRAM = [
  { band: '60-69', count: 3 },
  { band: '70-79', count: 6 },
  { band: '80-89', count: 14 },
  { band: '90-94', count: 19 },
  { band: '95-100', count: 12 },
];

export const OBSERVER_TIMELINE = [
  { step: 'AI Finding generated', actor: 'DantaDrishti AI', state: 'done' },
  { step: 'Observer verification', actor: 'Observer', state: 'active' },
  { step: 'Assessor override / sign', actor: 'Assessor', state: 'pending' },
  { step: 'EC deficiency list', actor: 'Expert Committee', state: 'pending' },
];
