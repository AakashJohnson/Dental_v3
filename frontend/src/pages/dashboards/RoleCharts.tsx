import {
  ChartCard,
  TrendLineChart,
  MultiLineChart,
  AreaChartCard,
  BarChartCard,
  StackedBarChart,
  DonutChartCard,
  RadarChartCard,
  WorkflowFunnel,
  RiskGaugeChart,
  HeatmapGrid,
  C,
} from '../../components/charts';
import { ROLE_DASHBOARDS } from '../../data/demoDashboardData';
import { COMPLIANCE_RADAR } from '../../data/demoWorkflowStats';
import { RealInspectionMap } from '../../components/maps/RealInspectionMap';
import { MAP_MARKERS } from '../../data/demoMapData';

/** Role-specific chart grid. Falls back to a generic set for unknown roles. */
export function RoleCharts({ role }: { role: string }) {
  const d = ROLE_DASHBOARDS[role]?.series ?? {};

  switch (role) {
    case 'APPLICANT':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Document completion" subtitle="Uploaded vs pending" className="lg:col-span-1">
            <DonutChartCard data={d.docDonut} />
          </ChartCard>
          <ChartCard title="Required vs Uploaded" subtitle="By document group" className="lg:col-span-2">
            <StackedBarChart data={d.reqVsUploaded} x="doc" bars={[{ key: 'uploaded', color: C.green }, { key: 'required', color: C.grid }]} />
          </ChartCard>
          <ChartCard title="Deficiency resolution" subtitle="Cumulative resolved" className="lg:col-span-2">
            <TrendLineChart data={d.deficiencyTrend} x="month" y="resolved" color={C.saffron} />
          </ChartCard>
          <ChartCard title="Compliance score" subtitle="Across sections">
            <div className="flex justify-center pt-2"><RiskGaugeChart value={d.compliance} label="Compliance" /></div>
          </ChartCard>
        </div>
      );

    case 'CONSULTANT':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Client-wise status" subtitle="Draft / submitted / deficiency" className="lg:col-span-2">
            <StackedBarChart data={d.clientStatus} x="client" bars={[{ key: 'draft', color: C.gold }, { key: 'submitted', color: C.royal }, { key: 'deficiency', color: C.saffron }]} />
          </ChartCard>
          <ChartCard title="Document readiness" subtitle="Portfolio-wide">
            <DonutChartCard data={d.readiness} />
          </ChartCard>
          <ChartCard title="Submission trend" subtitle="Applications filed" className="lg:col-span-2">
            <AreaChartCard data={d.submissionTrend} x="month" y="submitted" color={C.teal} />
          </ChartCard>
          <ChartCard title="Deadline risk heatmap" subtitle="Pressure by client/week">
            <HeatmapGrid rows={d.deadlineHeat} cols={['W1', 'W2', 'W3', 'W4', 'W5']} color={C.saffron} />
          </ChartCard>
        </div>
      );

    case 'SCRUTINY_OFFICER':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Queue by workflow" subtitle="Pending scrutiny" className="lg:col-span-2">
            <BarChartCard data={d.queueByWorkflow} x="workflow" y="count" color={C.teal} />
          </ChartCard>
          <ChartCard title="Eligibility fail reasons">
            <DonutChartCard data={d.failReasons} />
          </ChartCard>
          <ChartCard title="Missing document categories" subtitle="Minor vs major" className="lg:col-span-2">
            <StackedBarChart data={d.missingDocs} x="category" bars={[{ key: 'minor', color: C.gold }, { key: 'major', color: C.risk }]} />
          </ChartCard>
          <ChartCard title="Daily throughput" subtitle="Files cleared">
            <TrendLineChart data={d.throughput} x="month" y="cleared" color={C.green} />
          </ChartCard>
          <ChartCard title="SLA aging" subtitle="Days in queue" className="lg:col-span-3">
            <BarChartCard data={d.slaAging} x="bucket" y="count" color={C.saffron} height={170} />
          </ChartCard>
        </div>
      );

    case 'CASE_OFFICER':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Inspection schedule heatmap" subtitle="Visits per day" className="lg:col-span-2">
            <HeatmapGrid rows={d.scheduleHeat} cols={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} color={C.royal} />
          </ChartCard>
          <ChartCard title="Assessor availability">
            <DonutChartCard data={d.assessorAvail} />
          </ChartCard>
          <ChartCard title="Scheduling funnel" subtitle="To-schedule → visit done">
            <WorkflowFunnel data={d.funnel} height={170} />
          </ChartCard>
          <ChartCard title="COI conflict trend" subtitle="Flagged per month" className="lg:col-span-2">
            <TrendLineChart data={d.coiTrend} x="month" y="coi" color={C.saffron} />
          </ChartCard>
          <ChartCard title="National inspection load" subtitle="Live coverage" className="lg:col-span-3">
            <RealInspectionMap height={320} showHeat />
          </ChartCard>
        </div>
      );

    case 'ASSESSOR':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Assigned by status">
            <BarChartCard data={d.byStatus} x="status" y="value" color={C.teal} />
          </ChartCard>
          <ChartCard title="Evidence captured by section" subtitle="Verified vs flagged" className="lg:col-span-2">
            <StackedBarChart data={d.evidenceBySection} x="section" bars={[{ key: 'verified', color: C.green }, { key: 'flagged', color: C.saffron }]} />
          </ChartCard>
          <ChartCard title="AI confidence distribution" subtitle="Reviewed findings" className="lg:col-span-2">
            <BarChartCard data={d.confidence} x="band" y="count" color={C.royal} />
          </ChartCard>
          <ChartCard title="Override reasons">
            <DonutChartCard data={d.overrideReasons} />
          </ChartCard>
          <ChartCard title="Report submission SLA" subtitle="Avg days" className="lg:col-span-3">
            <TrendLineChart data={d.slaTrend} x="month" y="days" color={C.maroon} height={170} />
          </ChartCard>
        </div>
      );

    case 'OBSERVER':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="AI finding status">
            <DonutChartCard data={d.statusDonut} />
          </ChartCard>
          <ChartCard title="Exception categories" subtitle="Flagged reasons" className="lg:col-span-2">
            <BarChartCard data={d.exceptions} x="category" y="count" color={C.saffron} />
          </ChartCard>
          <ChartCard title="Confidence distribution" subtitle="All findings" className="lg:col-span-2">
            <AreaChartCard data={d.confidence} x="band" y="count" color={C.royal} />
          </ChartCard>
          <ChartCard title="Observer workload" subtitle="Findings reviewed">
            <TrendLineChart data={d.workload} x="month" y="reviewed" color={C.teal} />
          </ChartCard>
        </div>
      );

    case 'EC_MEMBER':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Risk score distribution">
            <BarChartCard data={d.riskDist} x="band" y="count" color={C.risk} />
          </ChartCard>
          <ChartCard title="Deficiency by category" subtitle="Curable vs gross" className="lg:col-span-2">
            <StackedBarChart data={d.deficiencyStack} x="category" bars={[{ key: 'curable', color: C.gold }, { key: 'gross', color: C.risk }]} />
          </ChartCard>
          <ChartCard title="EC decision outcomes">
            <DonutChartCard data={d.outcome} />
          </ChartCard>
          <ChartCard title="Queue by workflow" className="lg:col-span-2">
            <BarChartCard data={d.queueByWorkflow} x="workflow" y="count" color={C.teal} />
          </ChartCard>
          <ChartCard title="Section compliance radar" subtitle="Aggregate" className="lg:col-span-3">
            <RadarChartCard data={COMPLIANCE_RADAR} />
          </ChartCard>
        </div>
      );

    case 'COMPLIANCE_OFFICER':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Resolved vs outstanding" subtitle="Monthly" className="lg:col-span-2">
            <StackedBarChart data={d.resolvedVsOutstanding} x="month" bars={[{ key: 'resolved', color: C.green }, { key: 'outstanding', color: C.saffron }]} />
          </ChartCard>
          <ChartCard title="Severity distribution">
            <DonutChartCard data={d.severityDonut} />
          </ChartCard>
          <ChartCard title="Compliance submissions" subtitle="Applicant replies" className="lg:col-span-2">
            <AreaChartCard data={d.submissionTrend} x="month" y="replies" color={C.teal} />
          </ChartCard>
          <ChartCard title="Re-verification by state">
            <BarChartCard data={d.reverifyByState} x="state" y="count" color={C.royal} />
          </ChartCard>
          <ChartCard title="Deficiency aging" subtitle="Days outstanding" className="lg:col-span-3">
            <BarChartCard data={d.aging} x="bucket" y="count" color={C.saffron} height={170} />
          </ChartCard>
        </div>
      );

    case 'GOVERNMENT_AUTHORITY':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Decision pipeline" subtitle="Govt → recognition">
            <WorkflowFunnel data={d.pipeline} height={200} />
          </ChartCard>
          <ChartCard title="LOI → LOP trend" subtitle="Conversions" className="lg:col-span-2">
            <MultiLineChart data={d.loiLopTrend} x="month" lines={[{ key: 'loi', color: C.royal }, { key: 'lop', color: C.green }]} />
          </ChartCard>
          <ChartCard title="Approval outcomes" className="lg:col-span-1">
            <DonutChartCard data={d.outcome} />
          </ChartCard>
          <ChartCard title="Bank guarantee aging" subtitle="Pending verification">
            <BarChartCard data={d.bgAging} x="bucket" y="count" color={C.gold} />
          </ChartCard>
          <ChartCard title="State-wise approvals" subtitle="National map">
            <RealInspectionMap height={240} markers={MAP_MARKERS.filter((m) => m.status === 'approved' || m.status === 'highRisk')} />
          </ChartCard>
        </div>
      );

    case 'DCI_ADMIN':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="National application pipeline" className="lg:col-span-1">
            <WorkflowFunnel data={d.pipeline} height={220} />
          </ChartCard>
          <ChartCard title="National inspection map" subtitle="Live coverage & risk" className="lg:col-span-2">
            <RealInspectionMap height={320} showHeat showRoute />
          </ChartCard>
          <ChartCard title="SLA breach trend" subtitle="Monthly" className="lg:col-span-1">
            <TrendLineChart data={d.slaBreach} x="month" y="breaches" color={C.risk} />
          </ChartCard>
          <ChartCard title="AI evidence volume" subtitle="Clips captured" className="lg:col-span-2">
            <AreaChartCard data={d.evidenceVolume} x="month" y="clips" color={C.royal} />
          </ChartCard>
        </div>
      );

    case 'SUPER_ADMIN':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Users by role" className="lg:col-span-2">
            <BarChartCard data={d.usersByRole} x="role" y="value" color={C.teal} />
          </ChartCard>
          <ChartCard title="System health" subtitle="Uptime %">
            <TrendLineChart data={d.health} x="month" y="uptime" color={C.green} />
          </ChartCard>
          <ChartCard title="API error rate" subtitle="Errors/day" className="lg:col-span-2">
            <AreaChartCard data={d.apiErrors} x="month" y="errors" color={C.risk} />
          </ChartCard>
          <ChartCard title="Audit event volume">
            <TrendLineChart data={d.audit} x="month" y="events" color={C.royal} />
          </ChartCard>
          <ChartCard title="Integration status" subtitle="External services" className="lg:col-span-3">
            <StatusMatrix items={d.integrations} />
          </ChartCard>
        </div>
      );

    case 'SYSTEM_ADMINISTRATOR':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="API latency" subtitle="ms (p95)" className="lg:col-span-2">
            <TrendLineChart data={d.latency} x="month" y="ms" color={C.royal} />
          </ChartCard>
          <ChartCard title="Service health">
            <StatusMatrix items={d.services} compact />
          </ChartCard>
          <ChartCard title="Storage usage" subtitle="GB" className="lg:col-span-2">
            <AreaChartCard data={d.storage} x="month" y="gb" color={C.teal} />
          </ChartCard>
          <ChartCard title="Job queue backlog">
            <TrendLineChart data={d.queue} x="month" y="jobs" color={C.saffron} />
          </ChartCard>
          <ChartCard title="Error rate by service" className="lg:col-span-3">
            <BarChartCard data={d.errorRate} x="svc" y="errors" color={C.risk} height={170} />
          </ChartCard>
        </div>
      );

    default:
      return (
        <ChartCard title="Workflow pipeline" subtitle="Across your scope">
          <WorkflowFunnel data={ROLE_DASHBOARDS.DCI_ADMIN.series.pipeline} />
        </ChartCard>
      );
  }
}

function StatusMatrix({ items, compact }: { items: { name: string; status: string }[]; compact?: boolean }) {
  const color = (s: string) => (s === 'ok' ? '#15803d' : s === 'degraded' ? '#ea7317' : '#dc2626');
  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {items.map((it) => (
        <div key={it.name} className="flex items-center justify-between rounded-lg border border-teal/10 bg-ivory-50 px-3 py-2">
          <span className="text-[12.5px] text-ink">{it.name}</span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: color(it.status) }}>
            <span className="h-2 w-2 rounded-full" style={{ background: color(it.status) }} />
            {it.status === 'ok' ? 'Healthy' : it.status === 'degraded' ? 'Degraded' : 'Down'}
          </span>
        </div>
      ))}
    </div>
  );
}
