import { ReactNode, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Filter, ArrowLeft, TrendingUp, Map as MapIcon, FileBarChart } from 'lucide-react';
import {
  ChartCard,
  BarChartCard,
  StackedBarChart,
  DonutChartCard,
  MultiLineChart,
  AreaChartCard,
  TrendLineChart,
  WorkflowFunnel,
  C,
} from '../../components/charts';
import { RealInspectionMap } from '../../components/maps/RealInspectionMap';
import { MapFilterPanel, DEFAULT_FILTERS, applyMapFilters } from '../../components/maps/MapFilterPanel';
import { MAP_MARKERS } from '../../data/demoMapData';
import {
  REPORT_INDEX,
  DEFICIENCY_BY_CATEGORY,
  DEFICIENCY_BY_SEVERITY,
  DEFICIENCY_TREND,
  AI_DETECTION_VOLUME,
  AI_ACCEPTED_FLAGGED,
  GOV_DECISIONS,
  LOI_LOP_TREND,
  SLA_COMPLIANCE,
} from '../../data/demoReportsData';
import { WORKFLOW_FUNNEL, SLA_AGING } from '../../data/demoWorkflowStats';
import { STATE_APPLICATIONS } from '../../data/demoMapData';

/* ------------------------------- report kit ------------------------------- */
export function ReportFilterBar() {
  const [active, setActive] = useState('All workflows');
  const opts = ['All workflows', 'New College', 'Increase Seats', 'Renewal', 'Recognition', 'Periodic'];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-xs font-semibold text-ink-muted"><Filter size={13} /> Filters</span>
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => setActive(o)}
          className={`rounded-full border px-3 py-1 text-[11px] transition ${active === o ? 'border-teal bg-teal text-white' : 'border-teal/20 bg-white text-ink-soft hover:bg-teal-soft'}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function ExportReportButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-teal/20 bg-white px-3 py-1.5 text-xs font-semibold text-teal-dark hover:bg-teal-soft"
    >
      <Download size={14} /> Export
    </button>
  );
}

export function ReportMetricStrip({ items }: { items: { label: string; value: string | number; tone?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((m) => (
        <div key={m.label} className="gov-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-ink-muted">{m.label}</div>
          <div className="mt-1 font-display text-2xl font-bold" style={{ color: m.tone ?? C.ink }}>{m.value}</div>
        </div>
      ))}
    </div>
  );
}

export function ReportInsightCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-royal/15 bg-royal-soft px-4 py-3 text-[12.5px] text-ink-soft">
      <span className="font-semibold text-royal-dark">Insight: </span>
      {children}
    </div>
  );
}

function ReportShell({ title, desc, icon, children }: { title: string; desc: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <Link to="/app/reports" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:underline"><ArrowLeft size={13} /> All reports</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">{icon} {title}</h1>
          <p className="text-sm text-ink-soft">{desc}</p>
        </div>
        <ExportReportButton />
      </div>
      <ReportFilterBar />
      {children}
    </div>
  );
}

/* ------------------------------ reports home ------------------------------ */
export function ReportsHome() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink"><FileBarChart className="text-teal" size={24} /> Statutory Reports</h1>
          <p className="text-sm text-ink-soft">National inspection analytics · maps, pipelines, deficiencies, AI findings & decisions.</p>
        </div>
        <ExportReportButton />
      </div>

      <ReportMetricStrip
        items={[
          { label: 'Applications', value: 138, tone: C.teal },
          { label: 'Approvals issued', value: 27, tone: C.green },
          { label: 'Active deficiencies', value: 36, tone: C.saffron },
          { label: 'High-risk cases', value: 9, tone: C.risk },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_INDEX.map((r) => (
          <Link key={r.slug} to={`/app/reports/${r.slug}`} className="gov-card group p-5 transition hover:-translate-y-0.5 hover:shadow-glow">
            <span className="inline-block h-1.5 w-10 rounded-full" style={{ background: r.accent }} />
            <h3 className="mt-3 font-display text-base font-bold text-ink group-hover:text-teal-dark">{r.title}</h3>
            <p className="mt-1 text-[12.5px] text-ink-soft">{r.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-dark">Open report →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ report pages ------------------------------ */
function PipelineReport() {
  return (
    <ReportShell title="Pipeline Report" desc="Workflow funnel, stage aging & role-wise queue." icon={<TrendingUp className="text-royal" size={22} />}>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Workflow funnel" subtitle="Draft → Approved" className="lg:col-span-1"><WorkflowFunnel data={WORKFLOW_FUNNEL} /></ChartCard>
        <ChartCard title="SLA aging by stage" subtitle="On-time / at-risk / breached" className="lg:col-span-2">
          <StackedBarChart data={SLA_AGING} x="stage" bars={[{ key: 'onTime', color: C.green }, { key: 'atRisk', color: C.saffron }, { key: 'breached', color: C.risk }]} />
        </ChartCard>
        <ChartCard title="Applications by state" className="lg:col-span-3"><BarChartCard data={STATE_APPLICATIONS} x="state" y="value" color={C.teal} /></ChartCard>
      </div>
      <ReportInsightCard>Government decision stage shows the longest aging — 3 cases breached SLA this month.</ReportInsightCard>
    </ReportShell>
  );
}

function InspectionMapReport() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const markers = applyMapFilters(MAP_MARKERS, filters);
  return (
    <ReportShell title="National Inspection Map" desc="State clusters, live markers, risk heat & routes." icon={<MapIcon className="text-teal" size={22} />}>
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="gov-card p-3 lg:col-span-3">
          <RealInspectionMap markers={markers} height={480} showHeat showRoute />
        </div>
        <MapFilterPanel markers={MAP_MARKERS} filters={filters} onChange={setFilters} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Applications by state"><BarChartCard data={STATE_APPLICATIONS} x="state" y="value" color={C.royal} horizontal /></ChartCard>
        <ChartCard title="Deficiency categories"><BarChartCard data={DEFICIENCY_BY_CATEGORY} x="category" y="count" color={C.saffron} horizontal /></ChartCard>
      </div>
    </ReportShell>
  );
}

function DeficiencyReport() {
  return (
    <ReportShell title="Deficiency Report" desc="By category, severity, recurrence & resolution." icon={<FileBarChart className="text-saffron" size={22} />}>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="By category" className="lg:col-span-2"><BarChartCard data={DEFICIENCY_BY_CATEGORY} x="category" y="count" color={C.saffron} horizontal height={240} /></ChartCard>
        <ChartCard title="By severity"><DonutChartCard data={DEFICIENCY_BY_SEVERITY} /></ChartCard>
        <ChartCard title="Resolved vs outstanding" subtitle="Monthly trend" className="lg:col-span-3">
          <StackedBarChart data={DEFICIENCY_TREND} x="month" bars={[{ key: 'resolved', color: C.green }, { key: 'outstanding', color: C.saffron }]} />
        </ChartCard>
      </div>
      <ReportInsightCard>Faculty shortfall is the top recurring deficiency category (34 open cases).</ReportInsightCard>
    </ReportShell>
  );
}

function AIFindingsReport() {
  return (
    <ReportShell title="AI Findings Report" desc="Detection volume, confidence & accept/flag rates." icon={<TrendingUp className="text-maroon" size={22} />}>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Detection volume" subtitle="Evidence clips/month" className="lg:col-span-2"><AreaChartCard data={AI_DETECTION_VOLUME} x="month" y="clips" color={C.royal} /></ChartCard>
        <ChartCard title="Accepted vs flagged" subtitle="By detection type" className="lg:col-span-3">
          <StackedBarChart data={AI_ACCEPTED_FLAGGED} x="type" bars={[{ key: 'accepted', color: C.green }, { key: 'flagged', color: C.saffron }]} />
        </ChartCard>
      </div>
      <ReportInsightCard>Safety/statutory evidence has the highest flag rate (36%) — prioritise observer review.</ReportInsightCard>
    </ReportShell>
  );
}

function SLAReport() {
  return (
    <ReportShell title="SLA Report" desc="Deadline compliance, delayed stages & bottlenecks." icon={<TrendingUp className="text-gold" size={22} />}>
      <ChartCard title="Average days vs target" subtitle="By stage">
        <MultiLineChart data={SLA_COMPLIANCE.map((s) => ({ stage: s.stage, avgDays: s.avgDays, target: s.target }))} x="stage" lines={[{ key: 'avgDays', color: C.royal }, { key: 'target', color: C.green }]} />
      </ChartCard>
      <ChartCard title="Stage aging" subtitle="On-time / at-risk / breached">
        <StackedBarChart data={SLA_AGING} x="stage" bars={[{ key: 'onTime', color: C.green }, { key: 'atRisk', color: C.saffron }, { key: 'breached', color: C.risk }]} />
      </ChartCard>
    </ReportShell>
  );
}

function ComplianceReport() {
  return (
    <ReportShell title="Compliance Report" desc="Applicant replies, resolved deltas & re-verification." icon={<FileBarChart className="text-compliance" size={22} />}>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Resolved vs outstanding"><StackedBarChart data={DEFICIENCY_TREND} x="month" bars={[{ key: 'resolved', color: C.green }, { key: 'outstanding', color: C.saffron }]} /></ChartCard>
        <ChartCard title="Severity mix"><DonutChartCard data={DEFICIENCY_BY_SEVERITY} /></ChartCard>
      </div>
      <ReportInsightCard>Resolution rate overtook new deficiencies in May — net backlog is shrinking.</ReportInsightCard>
    </ReportShell>
  );
}

function GovernmentDecisionReport() {
  return (
    <ReportShell title="Government Decision Report" desc="LOI/LOP, bank guarantee & approval trends." icon={<FileBarChart className="text-maroon" size={22} />}>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Decision outcomes"><DonutChartCard data={GOV_DECISIONS} /></ChartCard>
        <ChartCard title="LOI → LOP trend" className="lg:col-span-2"><MultiLineChart data={LOI_LOP_TREND} x="month" lines={[{ key: 'loi', color: C.royal }, { key: 'lop', color: C.green }]} /></ChartCard>
        <ChartCard title="Approvals by state" className="lg:col-span-3"><BarChartCard data={STATE_APPLICATIONS} x="state" y="value" color={C.green} /></ChartCard>
      </div>
    </ReportShell>
  );
}

const PAGES: Record<string, () => JSX.Element> = {
  pipeline: PipelineReport,
  'inspection-map': InspectionMapReport,
  deficiencies: DeficiencyReport,
  'ai-findings': AIFindingsReport,
  sla: SLAReport,
  compliance: ComplianceReport,
  'government-decisions': GovernmentDecisionReport,
};

/** Routed report detail page (reads :slug). */
export function ReportDetail() {
  const { slug } = useParams();
  const Page = slug ? PAGES[slug] : undefined;
  if (!Page) return <ReportsHome />;
  return <Page />;
}
