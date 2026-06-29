/**
 * Per-role demo dashboard data: KPI cards + chart datasets for all 12 roles.
 * Structured so each field can later be swapped for a `/dashboard` API response.
 */

export interface Kpi {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number; // +/- percentage
  tone?: 'teal' | 'royal' | 'saffron' | 'green' | 'maroon' | 'risk';
}

export interface RoleDashboard {
  kpis: Kpi[];
  series: Record<string, any>;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const mk = (key: string, vals: number[]) => months.map((m, i) => ({ month: m, [key]: vals[i] }));

export const ROLE_DASHBOARDS: Record<string, RoleDashboard> = {
  APPLICANT: {
    kpis: [
      { label: 'Active applications', value: 3, tone: 'teal', trend: 0 },
      { label: 'Document completion', value: '82%', tone: 'royal', trend: 6 },
      { label: 'Pending deficiencies', value: 4, tone: 'saffron', trend: -2 },
      { label: 'Days left (SLA)', value: 12, tone: 'maroon' },
      { label: 'Payments pending', value: '₹2.5L', tone: 'risk' },
      { label: 'Approval docs received', value: 1, tone: 'green', trend: 1 },
    ],
    series: {
      docDonut: [
        { name: 'Uploaded', value: 18, color: '#15803d' },
        { name: 'Pending', value: 4, color: '#ea7317' },
      ],
      reqVsUploaded: [
        { doc: 'Statutory', required: 8, uploaded: 8 },
        { doc: 'Land/Site', required: 5, uploaded: 4 },
        { doc: 'Faculty', required: 6, uploaded: 5 },
        { doc: 'Equipment', required: 4, uploaded: 3 },
        { doc: 'Safety', required: 5, uploaded: 4 },
      ],
      deficiencyTrend: mk('resolved', [0, 1, 1, 2, 3, 4]),
      compliance: 78,
      stageProgress: ['Submitted', 'Scrutiny', 'Inspection', 'Observer', 'EC'],
    },
  },
  CONSULTANT: {
    kpis: [
      { label: 'Delegated colleges', value: 6, tone: 'teal' },
      { label: 'Active drafts', value: 4, tone: 'royal' },
      { label: 'Missing documents', value: 11, tone: 'saffron', trend: -4 },
      { label: 'Upcoming deadlines', value: 5, tone: 'maroon' },
      { label: 'Submitted', value: 9, tone: 'green', trend: 3 },
      { label: 'Deficiencies pending', value: 7, tone: 'risk' },
    ],
    series: {
      clientStatus: [
        { client: 'Sunrise', draft: 2, submitted: 1, deficiency: 1 },
        { client: 'Heritage', draft: 1, submitted: 2, deficiency: 2 },
        { client: 'Metro', draft: 0, submitted: 3, deficiency: 0 },
        { client: 'Ganga', draft: 1, submitted: 1, deficiency: 1 },
      ],
      readiness: [
        { name: 'Ready', value: 64, color: '#15803d' },
        { name: 'Gaps', value: 36, color: '#ea7317' },
      ],
      submissionTrend: mk('submitted', [1, 2, 2, 3, 4, 5]),
      deadlineHeat: [
        { client: 'Sunrise', d: [2, 1, 0, 3, 1] },
        { client: 'Heritage', d: [0, 2, 1, 0, 2] },
        { client: 'Metro', d: [1, 0, 0, 1, 0] },
      ],
    },
  },
  SCRUTINY_OFFICER: {
    kpis: [
      { label: 'Pending scrutiny', value: 17, tone: 'teal' },
      { label: 'Returned incomplete', value: 6, tone: 'saffron', trend: -3 },
      { label: 'Clarification pending', value: 4, tone: 'royal' },
      { label: 'Scrutiny passed', value: 31, tone: 'green', trend: 8 },
      { label: 'Expired documents', value: 9, tone: 'maroon' },
      { label: 'SLA breaches', value: 5, tone: 'risk' },
    ],
    series: {
      queueByWorkflow: [
        { workflow: 'New College', count: 6 },
        { workflow: 'Increase Seats', count: 4 },
        { workflow: 'Renewal', count: 3 },
        { workflow: 'Recognition', count: 2 },
        { workflow: 'Periodic', count: 2 },
      ],
      missingDocs: [
        { category: 'Statutory', minor: 4, major: 3 },
        { category: 'Land', minor: 2, major: 4 },
        { category: 'Faculty', minor: 5, major: 2 },
        { category: 'Safety', minor: 3, major: 3 },
      ],
      throughput: mk('cleared', [4, 6, 5, 7, 6, 8]),
      failReasons: [
        { name: 'Missing essentiality', value: 28, color: '#dc2626' },
        { name: 'Affiliation lapse', value: 22, color: '#ea7317' },
        { name: 'Land title', value: 19, color: '#b8860b' },
        { name: 'Faculty docs', value: 31, color: '#0d5c5c' },
      ],
      slaAging: [
        { bucket: '0-3d', count: 9 },
        { bucket: '4-7d', count: 5 },
        { bucket: '8-10d', count: 3 },
        { bucket: '>10d', count: 5 },
      ],
    },
  },
  CASE_OFFICER: {
    kpis: [
      { label: 'Inspections to schedule', value: 12, tone: 'teal' },
      { label: 'Active teams', value: 7, tone: 'royal' },
      { label: 'COI conflicts', value: 3, tone: 'saffron' },
      { label: 'Upcoming visits', value: 9, tone: 'green' },
      { label: 'Overdue assignments', value: 4, tone: 'maroon', trend: -1 },
      { label: 'Observer shortage', value: 2, tone: 'risk' },
    ],
    series: {
      scheduleHeat: [
        { week: 'W1', d: [1, 0, 2, 1, 0, 3, 1] },
        { week: 'W2', d: [0, 2, 1, 0, 2, 1, 0] },
        { week: 'W3', d: [2, 1, 0, 3, 1, 0, 2] },
        { week: 'W4', d: [1, 0, 1, 0, 2, 1, 0] },
      ],
      assessorAvail: [
        { name: 'Available', value: 14, color: '#15803d' },
        { name: 'Assigned', value: 9, color: '#1d4ed8' },
        { name: 'On leave', value: 3, color: '#94a3b8' },
        { name: 'COI blocked', value: 3, color: '#dc2626' },
      ],
      funnel: [
        { stage: 'To schedule', value: 12 },
        { stage: 'Team assigned', value: 9 },
        { stage: 'Credential issued', value: 7 },
        { stage: 'Visit done', value: 5 },
      ],
      coiTrend: mk('coi', [4, 3, 5, 2, 3, 3]),
    },
  },
  ASSESSOR: {
    kpis: [
      { label: 'Assigned inspections', value: 5, tone: 'teal' },
      { label: 'Reports pending', value: 2, tone: 'saffron' },
      { label: 'AI findings reviewed', value: 48, tone: 'royal', trend: 12 },
      { label: 'Overrides made', value: 6, tone: 'maroon' },
      { label: 'Evidence clips', value: 134, tone: 'green' },
      { label: 'Reports signed', value: 3, tone: 'green', trend: 1 },
    ],
    series: {
      byStatus: [
        { status: 'Scheduled', value: 2 },
        { status: 'Capturing', value: 1 },
        { status: 'Review', value: 1 },
        { status: 'Signed', value: 3 },
      ],
      evidenceBySection: [
        { section: 'Chairs', verified: 12, flagged: 2 },
        { section: 'Beds', verified: 20, flagged: 2 },
        { section: 'Equipment', verified: 14, flagged: 4 },
        { section: 'Faculty', verified: 11, flagged: 5 },
        { section: 'OPD', verified: 9, flagged: 1 },
      ],
      confidence: [
        { band: '70-79', count: 5 },
        { band: '80-89', count: 14 },
        { band: '90-94', count: 19 },
        { band: '95-100', count: 12 },
      ],
      overrideReasons: [
        { name: 'Occlusion', value: 34, color: '#ea7317' },
        { name: 'Duplicate count', value: 26, color: '#b8860b' },
        { name: 'Low light', value: 22, color: '#0d5c5c' },
        { name: 'Mislabel', value: 18, color: '#1d4ed8' },
      ],
      slaTrend: mk('days', [9, 8, 8, 7, 7, 6]),
    },
  },
  OBSERVER: {
    kpis: [
      { label: 'Pending findings', value: 23, tone: 'teal' },
      { label: 'Accepted findings', value: 118, tone: 'green', trend: 9 },
      { label: 'Flagged exceptions', value: 14, tone: 'saffron' },
      { label: 'Quarantined evidence', value: 5, tone: 'risk' },
      { label: 'Low-confidence items', value: 8, tone: 'maroon' },
      { label: 'Sign-offs pending', value: 3, tone: 'royal' },
    ],
    series: {
      statusDonut: [
        { name: 'Accepted', value: 118, color: '#15803d' },
        { name: 'Flagged', value: 14, color: '#ea7317' },
        { name: 'Low conf.', value: 8, color: '#b8860b' },
        { name: 'Quarantined', value: 5, color: '#dc2626' },
      ],
      exceptions: [
        { category: 'Geo mismatch', count: 6 },
        { category: 'Hash break', count: 3 },
        { category: 'Duplicate', count: 5 },
        { category: 'Absent faculty', count: 7 },
        { category: 'Census gap', count: 4 },
      ],
      confidence: [
        { band: '60-69', count: 3 },
        { band: '70-79', count: 6 },
        { band: '80-89', count: 14 },
        { band: '90-100', count: 31 },
      ],
      workload: mk('reviewed', [18, 22, 25, 30, 27, 33]),
    },
  },
  EC_MEMBER: {
    kpis: [
      { label: 'Cases in EC queue', value: 14, tone: 'teal' },
      { label: 'High-risk cases', value: 5, tone: 'risk' },
      { label: 'Compliance asked', value: 6, tone: 'saffron' },
      { label: 'Approval recommended', value: 7, tone: 'green' },
      { label: 'Undertaking cases', value: 3, tone: 'royal' },
      { label: 'Adverse recommended', value: 2, tone: 'maroon' },
    ],
    series: {
      riskDist: [
        { band: 'Low', count: 4 },
        { band: 'Medium', count: 5 },
        { band: 'High', count: 3 },
        { band: 'Severe', count: 2 },
      ],
      deficiencyStack: [
        { category: 'Faculty', curable: 6, gross: 2 },
        { category: 'Equipment', curable: 4, gross: 1 },
        { category: 'Hospital', curable: 3, gross: 2 },
        { category: 'Safety', curable: 5, gross: 3 },
      ],
      outcome: [
        { name: 'Approve', value: 7, color: '#15803d' },
        { name: 'Ask compliance', value: 6, color: '#b8860b' },
        { name: 'Refuse', value: 2, color: '#dc2626' },
      ],
      queueByWorkflow: [
        { workflow: 'New College', count: 5 },
        { workflow: 'Increase', count: 4 },
        { workflow: 'Renewal', count: 3 },
        { workflow: 'Recognition', count: 2 },
      ],
      severityTrend: mk('gross', [3, 4, 2, 3, 2, 2]),
    },
  },
  COMPLIANCE_OFFICER: {
    kpis: [
      { label: 'Active deficiency cases', value: 19, tone: 'teal' },
      { label: 'Resolved deficiencies', value: 142, tone: 'green', trend: 11 },
      { label: 'Outstanding', value: 36, tone: 'saffron' },
      { label: 'Re-verification pending', value: 8, tone: 'royal' },
      { label: 'Overdue replies', value: 5, tone: 'maroon' },
      { label: 'High-risk compliance', value: 4, tone: 'risk' },
    ],
    series: {
      resolvedVsOutstanding: [
        { month: 'Mar', resolved: 35, outstanding: 38 },
        { month: 'Apr', resolved: 41, outstanding: 49 },
        { month: 'May', resolved: 46, outstanding: 42 },
        { month: 'Jun', resolved: 52, outstanding: 36 },
      ],
      severityDonut: [
        { name: 'Curable', value: 58, color: '#b8860b' },
        { name: 'Major', value: 31, color: '#ea7317' },
        { name: 'Gross', value: 14, color: '#dc2626' },
      ],
      reverifyByState: [
        { state: 'MH', count: 3 },
        { state: 'TN', count: 2 },
        { state: 'KA', count: 2 },
        { state: 'UP', count: 1 },
      ],
      submissionTrend: mk('replies', [12, 18, 16, 22, 27, 31]),
      aging: [
        { bucket: '0-7d', count: 12 },
        { bucket: '8-14d', count: 8 },
        { bucket: '15-21d', count: 4 },
        { bucket: '>21d', count: 5 },
      ],
    },
  },
  GOVERNMENT_AUTHORITY: {
    kpis: [
      { label: 'Decisions pending', value: 9, tone: 'teal' },
      { label: 'LOIs issued', value: 18, tone: 'royal', trend: 4 },
      { label: 'Bank guarantees pending', value: 7, tone: 'saffron' },
      { label: 'LOPs issued', value: 11, tone: 'green', trend: 3 },
      { label: 'Recognition letters', value: 6, tone: 'green' },
      { label: 'Adverse orders pending', value: 2, tone: 'risk' },
    ],
    series: {
      pipeline: [
        { stage: 'Govt Decision', value: 9 },
        { stage: 'LOI', value: 18 },
        { stage: 'Bank Guarantee', value: 11 },
        { stage: 'LOP', value: 11 },
        { stage: 'Recognition', value: 6 },
      ],
      outcome: [
        { name: 'LOI Issued', value: 18, color: '#1d4ed8' },
        { name: 'LOP Issued', value: 11, color: '#15803d' },
        { name: 'BG Pending', value: 7, color: '#b8860b' },
        { name: 'Refused', value: 5, color: '#dc2626' },
      ],
      loiLopTrend: [
        { month: 'Mar', loi: 5, lop: 3 },
        { month: 'Apr', loi: 6, lop: 4 },
        { month: 'May', loi: 5, lop: 5 },
        { month: 'Jun', loi: 7, lop: 6 },
      ],
      bgAging: [
        { bucket: '0-15d', count: 3 },
        { bucket: '16-30d', count: 2 },
        { bucket: '>30d', count: 2 },
      ],
    },
  },
  DCI_ADMIN: {
    kpis: [
      { label: 'Total applications', value: 138, tone: 'teal', trend: 6 },
      { label: 'Live inspections', value: 12, tone: 'royal' },
      { label: 'Active deficiencies', value: 36, tone: 'saffron' },
      { label: 'Approvals issued', value: 27, tone: 'green', trend: 4 },
      { label: 'High-risk cases', value: 9, tone: 'risk' },
      { label: 'SLA breaches', value: 14, tone: 'maroon', trend: -2 },
    ],
    series: {
      pipeline: [
        { stage: 'Submitted', value: 52 },
        { stage: 'Scrutiny', value: 45 },
        { stage: 'Inspection', value: 33 },
        { stage: 'Observer', value: 29 },
        { stage: 'EC', value: 22 },
        { stage: 'Govt', value: 17 },
        { stage: 'Approved', value: 11 },
      ],
      slaBreach: mk('breaches', [18, 16, 19, 15, 14, 12]),
      evidenceVolume: mk('clips', [220, 310, 415, 560, 498, 642]),
    },
  },
  SUPER_ADMIN: {
    kpis: [
      { label: 'Users', value: 248, tone: 'teal' },
      { label: 'Active roles', value: 12, tone: 'royal' },
      { label: 'Services healthy', value: '9/10', tone: 'green' },
      { label: 'Audit events (24h)', value: 1842, tone: 'maroon' },
      { label: 'Failed logins', value: 23, tone: 'saffron', trend: -5 },
      { label: 'Integration issues', value: 1, tone: 'risk' },
    ],
    series: {
      usersByRole: [
        { role: 'Applicant', value: 96 },
        { role: 'Consultant', value: 22 },
        { role: 'Scrutiny', value: 14 },
        { role: 'Assessor', value: 48 },
        { role: 'Observer', value: 18 },
        { role: 'EC', value: 16 },
        { role: 'Govt', value: 8 },
        { role: 'Admin', value: 26 },
      ],
      health: mk('uptime', [99.7, 99.8, 99.6, 99.9, 99.8, 99.9]),
      apiErrors: mk('errors', [12, 9, 14, 7, 8, 5]),
      audit: mk('events', [1400, 1620, 1510, 1730, 1690, 1842]),
      integrations: [
        { name: 'Payment Gateway', status: 'ok' },
        { name: 'DigiLocker', status: 'ok' },
        { name: 'SMS/Email', status: 'ok' },
        { name: 'AI Inference', status: 'ok' },
        { name: 'Object Store', status: 'degraded' },
      ],
    },
  },
  SYSTEM_ADMINISTRATOR: {
    kpis: [
      { label: 'API uptime', value: '99.9%', tone: 'green' },
      { label: 'AI service status', value: 'Healthy', tone: 'teal' },
      { label: 'Storage usage', value: '68%', tone: 'royal' },
      { label: 'Queue backlog', value: 42, tone: 'saffron' },
      { label: 'Failed jobs', value: 7, tone: 'maroon' },
      { label: 'Avg response time', value: '212ms', tone: 'royal', trend: -8 },
    ],
    series: {
      latency: mk('ms', [240, 228, 235, 219, 224, 212]),
      services: [
        { name: 'API Gateway', status: 'ok' },
        { name: 'Workflow Engine', status: 'ok' },
        { name: 'AI Inference', status: 'ok' },
        { name: 'Notification', status: 'ok' },
        { name: 'Object Store', status: 'degraded' },
        { name: 'Report Worker', status: 'ok' },
      ],
      storage: mk('gb', [380, 410, 445, 498, 540, 612]),
      queue: mk('jobs', [60, 52, 71, 44, 50, 42]),
      errorRate: [
        { svc: 'API', errors: 5 },
        { svc: 'AI', errors: 3 },
        { svc: 'Notify', errors: 2 },
        { svc: 'Report', errors: 4 },
        { svc: 'Store', errors: 7 },
      ],
    },
  },
};

export const ROLE_ACTIVITY: { actor: string; action: string; time: string }[] = [
  { actor: 'DantaDrishti AI', action: 'Captured 14 evidence clips · Dental chair lab', time: '2m ago' },
  { actor: 'Observer', action: 'Flagged equipment finding for review', time: '11m ago' },
  { actor: 'Scrutiny Officer', action: 'Passed scrutiny · DD-554120', time: '38m ago' },
  { actor: 'Case Officer', action: 'Assigned inspection team · DD-220471', time: '1h ago' },
  { actor: 'EC Member', action: 'Recommended compliance · DD-632149', time: '2h ago' },
  { actor: 'Government Authority', action: 'Issued LOI · DD-939104', time: '4h ago' },
];
