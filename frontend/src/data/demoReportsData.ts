/**
 * Demo data for the Reports section. Replace with `/reports/*` endpoints later.
 */

export const DEFICIENCY_BY_CATEGORY = [
  { category: 'Faculty shortfall', count: 34 },
  { category: 'Equipment missing', count: 27 },
  { category: 'Hospital beds', count: 19 },
  { category: 'Clinical material', count: 16 },
  { category: 'Fire/AERB/STP', count: 22 },
  { category: 'Library', count: 9 },
  { category: 'Built-up area', count: 12 },
];

export const DEFICIENCY_BY_SEVERITY = [
  { name: 'Curable', value: 58, color: '#b8860b' },
  { name: 'Major', value: 31, color: '#ea7317' },
  { name: 'Gross', value: 14, color: '#dc2626' },
];

export const DEFICIENCY_TREND = [
  { month: 'Jan', outstanding: 40, resolved: 22 },
  { month: 'Feb', outstanding: 44, resolved: 31 },
  { month: 'Mar', outstanding: 38, resolved: 35 },
  { month: 'Apr', outstanding: 49, resolved: 41 },
  { month: 'May', outstanding: 42, resolved: 46 },
  { month: 'Jun', outstanding: 36, resolved: 52 },
];

export const AI_DETECTION_VOLUME = [
  { month: 'Jan', clips: 220 },
  { month: 'Feb', clips: 310 },
  { month: 'Mar', clips: 415 },
  { month: 'Apr', clips: 560 },
  { month: 'May', clips: 498 },
  { month: 'Jun', clips: 642 },
];

export const AI_ACCEPTED_FLAGGED = [
  { type: 'Chairs', accepted: 86, flagged: 14 },
  { type: 'Beds', accepted: 92, flagged: 8 },
  { type: 'Equipment', accepted: 78, flagged: 22 },
  { type: 'Faculty', accepted: 71, flagged: 29 },
  { type: 'OPD', accepted: 90, flagged: 10 },
  { type: 'Safety', accepted: 64, flagged: 36 },
];

export const GOV_DECISIONS = [
  { name: 'LOI Issued', value: 18, color: '#1d4ed8' },
  { name: 'LOP Issued', value: 11, color: '#15803d' },
  { name: 'BG Pending', value: 7, color: '#b8860b' },
  { name: 'Refused', value: 5, color: '#dc2626' },
];

export const LOI_LOP_TREND = [
  { month: 'Jan', loi: 3, lop: 1 },
  { month: 'Feb', loi: 4, lop: 2 },
  { month: 'Mar', loi: 5, lop: 3 },
  { month: 'Apr', loi: 6, lop: 4 },
  { month: 'May', loi: 5, lop: 5 },
  { month: 'Jun', loi: 7, lop: 6 },
];

export const SLA_COMPLIANCE = [
  { stage: 'Scrutiny', avgDays: 9, target: 10 },
  { stage: 'Scheduling', avgDays: 13, target: 12 },
  { stage: 'AI Inspection', avgDays: 6, target: 7 },
  { stage: 'Observer', avgDays: 8, target: 7 },
  { stage: 'EC Review', avgDays: 15, target: 14 },
  { stage: 'Govt Decision', avgDays: 21, target: 18 },
];

export const REPORT_INDEX = [
  { slug: 'pipeline', title: 'Pipeline Report', desc: 'Workflow funnel, stage aging & role-wise queue.', accent: '#1d4ed8' },
  { slug: 'inspection-map', title: 'National Inspection Map', desc: 'State clusters, live markers & risk heat layer.', accent: '#0d5c5c' },
  { slug: 'deficiencies', title: 'Deficiency Report', desc: 'Category, severity, recurring & resolution.', accent: '#ea7317' },
  { slug: 'ai-findings', title: 'AI Findings Report', desc: 'Detection volume, confidence & accept/flag.', accent: '#7c2d12' },
  { slug: 'sla', title: 'SLA Report', desc: 'Deadline compliance & role bottlenecks.', accent: '#b8860b' },
  { slug: 'compliance', title: 'Compliance Report', desc: 'Replies, resolved deltas & re-verification.', accent: '#15803d' },
  { slug: 'government-decisions', title: 'Government Decision Report', desc: 'LOI/LOP, bank guarantee & approval trends.', accent: '#9f1239' },
];
