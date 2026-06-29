/**
 * Workflow + pipeline demo statistics shared by Workflows/Process pages and
 * pipeline reports. Replace with `/dashboard` aggregates later.
 */

export const WORKFLOW_FUNNEL = [
  { stage: 'Draft', value: 64 },
  { stage: 'Submitted', value: 52 },
  { stage: 'Scrutiny', value: 45 },
  { stage: 'Inspection Scheduled', value: 38 },
  { stage: 'AI Inspection', value: 33 },
  { stage: 'Observer Review', value: 29 },
  { stage: 'Assessor Review', value: 26 },
  { stage: 'EC Review', value: 22 },
  { stage: 'Govt Decision', value: 17 },
  { stage: 'LOI', value: 14 },
  { stage: 'LOP / Approved', value: 11 },
];

export const STAGE_ORDER = [
  'Draft', 'Submitted', 'Scrutiny', 'Inspection Scheduled', 'AI Inspection',
  'Observer Review', 'Assessor Review', 'EC Review', 'Govt Decision', 'LOI', 'LOP', 'Approved',
];

export const WORKFLOW_DISTRIBUTION = [
  { name: 'New College + First PG', value: 22, color: '#0d5c5c' },
  { name: 'Increase Seats', value: 18, color: '#1d4ed8' },
  { name: 'Renewal', value: 26, color: '#15803d' },
  { name: 'Recognition', value: 14, color: '#b8860b' },
  { name: 'Pre-PG', value: 9, color: '#ea7317' },
  { name: 'Periodic', value: 12, color: '#7c2d12' },
  { name: 'Compliance Verify', value: 7, color: '#9f1239' },
];

export const SLA_AGING = [
  { stage: 'Scrutiny', onTime: 32, atRisk: 8, breached: 5 },
  { stage: 'Scheduling', onTime: 24, atRisk: 6, breached: 4 },
  { stage: 'AI Inspection', onTime: 28, atRisk: 4, breached: 1 },
  { stage: 'Observer', onTime: 21, atRisk: 5, breached: 3 },
  { stage: 'EC Review', onTime: 16, atRisk: 4, breached: 2 },
  { stage: 'Govt Decision', onTime: 11, atRisk: 3, breached: 3 },
];

export const COMPLIANCE_RADAR = [
  { axis: 'Infrastructure', score: 82 },
  { axis: 'Faculty', score: 68 },
  { axis: 'Clinical Material', score: 74 },
  { axis: 'Equipment', score: 71 },
  { axis: 'Hospital', score: 88 },
  { axis: 'Safety/Statutory', score: 63 },
];
