/**
 * Demo applications used by dev/demo mode (no backend). The Queue and Dashboard
 * fall back to these when a client-only session returns no live data.
 *
 * Each row matches the shape the UI reads: { id, code, workflowType, state }.
 */

export interface DemoApplication {
  id: string;
  code: string;
  workflowType: string;
  state: string;
}

/** A realistic spread of colleges across every workflow and pipeline stage. */
export const DEMO_APPLICATIONS: DemoApplication[] = [
  { id: 'dd-1001', code: 'DD-554120', workflowType: 'WORKFLOW_1_NEW_COLLEGE_FIRST_PG', state: 'SUBMITTED' },
  { id: 'dd-1002', code: 'DD-554121', workflowType: 'WORKFLOW_1_NEW_COLLEGE_FIRST_PG', state: 'UNDER_SCRUTINY' },
  { id: 'dd-1003', code: 'DD-220471', workflowType: 'WORKFLOW_2_INCREASE_BDS_MDS_SEATS', state: 'INSPECTION_SCHEDULED' },
  { id: 'dd-1004', code: 'DD-220472', workflowType: 'WORKFLOW_2_INCREASE_BDS_MDS_SEATS', state: 'AI_INSPECTION' },
  { id: 'dd-1005', code: 'DD-330918', workflowType: 'WORKFLOW_3_RENEWAL_BDS_MDS', state: 'AI_OBSERVER_REVIEW' },
  { id: 'dd-1006', code: 'DD-330919', workflowType: 'WORKFLOW_3_RENEWAL_BDS_MDS', state: 'ASSESSOR_REVIEW' },
  { id: 'dd-1007', code: 'DD-632149', workflowType: 'WORKFLOW_4_RECOGNITION_BDS_MDS', state: 'EC_REVIEW' },
  { id: 'dd-1008', code: 'DD-632150', workflowType: 'WORKFLOW_4_RECOGNITION_BDS_MDS', state: 'DEFICIENCY' },
  { id: 'dd-1009', code: 'DD-939104', workflowType: 'WORKFLOW_5_PRE_PG_INSPECTION', state: 'GOVERNMENT_DECISION' },
  { id: 'dd-1010', code: 'DD-939105', workflowType: 'WORKFLOW_5_PRE_PG_INSPECTION', state: 'LETTER_OF_INTENT' },
  { id: 'dd-1011', code: 'DD-771260', workflowType: 'WORKFLOW_6_PERIODIC_INSPECTION', state: 'LETTER_OF_PERMISSION_OR_RECOGNITION' },
  { id: 'dd-1012', code: 'DD-771261', workflowType: 'WORKFLOW_6_PERIODIC_INSPECTION', state: 'APPROVED' },
  { id: 'dd-1013', code: 'DD-118803', workflowType: 'WORKFLOW_7_COMPLIANCE_VERIFICATION', state: 'DEFICIENCY' },
  { id: 'dd-1014', code: 'DD-118804', workflowType: 'WORKFLOW_1_NEW_COLLEGE_FIRST_PG', state: 'DRAFT' },
  { id: 'dd-1015', code: 'DD-445077', workflowType: 'WORKFLOW_2_INCREASE_BDS_MDS_SEATS', state: 'UNDER_SCRUTINY' },
  { id: 'dd-1016', code: 'DD-445078', workflowType: 'WORKFLOW_3_RENEWAL_BDS_MDS', state: 'AI_INSPECTION' },
];

/** States each role's queue endpoint is concerned with. */
const ENDPOINT_STATES: Record<string, string[]> = {
  '/scrutiny/queue': ['SUBMITTED', 'UNDER_SCRUTINY'],
  '/assessor/assigned': ['INSPECTION_SCHEDULED', 'AI_INSPECTION', 'AI_OBSERVER_REVIEW', 'ASSESSOR_REVIEW'],
  '/ec/queue': ['EC_REVIEW', 'DEFICIENCY'],
  '/government/queue': ['GOVERNMENT_DECISION', 'LETTER_OF_INTENT', 'LETTER_OF_PERMISSION_OR_RECOGNITION'],
};

/**
 * Returns the demo rows for a given queue endpoint. Endpoints without a specific
 * filter (e.g. `/applications`) get the full list.
 */
export function demoQueueFor(endpoint: string): DemoApplication[] {
  const states = ENDPOINT_STATES[endpoint];
  if (!states) return DEMO_APPLICATIONS;
  return DEMO_APPLICATIONS.filter((a) => states.includes(a.state));
}
