import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ListChecks, FolderOpen, LayoutDashboard, BarChart3, FilePlus2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { RoleBadge, StatusPill } from '../design-system/components';
import { roleColors, roleLabels, stateLabels } from '../design-system/tokens';
import { ROLE_DASHBOARDS, ROLE_ACTIVITY, Kpi } from '../data/demoDashboardData';
import { RoleCharts } from './dashboards/RoleCharts';
import { RoleStatsGrid, ResponsibilityCard, RoleTaskQueue, ActivityTimeline, SectionTitle } from '../components/dashboard/primitives';

interface Guide { responsibility: string; can: string[]; cannot: string[]; }
interface DashboardData {
  role: string;
  guide: Guide;
  counts: { total: number; byState: Record<string, number> };
  widgets: { key: string; label: string; value: number }[];
  tasks: { applicationId: string; code: string; state: string; guidance: any }[];
  recentAudit: { action: string; toState: string | null; actorRole: string; timestamp: string }[];
}

export function Dashboard() {
  const { user } = useAuth();
  const role = user?.role ?? '';
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<DashboardData>('/dashboard') });
  const apps = useQuery({ queryKey: ['applications'], queryFn: () => api.get<any[]>('/applications') });
  const accent = roleColors[role] ?? '#0d5c5c';

  const demo = ROLE_DASHBOARDS[role];
  // Prefer rich role demo KPIs (more cards + tones); supplement with live counts.
  const kpis: Kpi[] = demo?.kpis ?? (data?.widgets ?? []).map((w) => ({ label: w.label, value: w.value, tone: 'teal' as const }));

  const activity = (data?.recentAudit ?? []).length
    ? data!.recentAudit.map((a) => ({
        actor: roleLabels[a.actorRole] ?? a.actorRole,
        action: a.action + (a.toState ? ` → ${stateLabels[a.toState] ?? a.toState}` : ''),
        time: new Date(a.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }))
    : ROLE_ACTIVITY;

  return (
    <div className="relative space-y-6">
      {/* Background is provided by DashboardShell for all authenticated pages. */}

      {/* Role command header */}
      <div className="gov-card-solid relative overflow-hidden p-6 tex-proforma">
        <div className="absolute left-0 top-0 h-full w-1.5" style={{ background: accent }} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <LayoutDashboard size={22} className="text-teal" />
              <h1 className="font-display text-2xl font-bold text-ink">{user?.name}</h1>
              <RoleBadge role={role} />
            </div>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              <span className="font-semibold text-ink">Command centre:</span>{' '}
              {data?.guide?.responsibility ?? 'Role workspace with live metrics, charts and tasks.'}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-teal-soft px-4 py-3 text-center">
              <div className="font-display text-2xl font-bold text-teal-dark">{data?.counts?.total ?? apps.data?.length ?? 0}</div>
              <div className="text-[11px] uppercase tracking-wide text-teal-dark/80">In your scope</div>
            </div>
            {(role === 'APPLICANT' || role === 'CONSULTANT') && (
              <Link to="/app/applications/new" className="flex items-center gap-1.5 self-stretch rounded-xl bg-saffron px-4 text-sm font-semibold text-white shadow-card hover:bg-saffron-deep">
                <FilePlus2 size={16} /> New Application
              </Link>
            )}
            <Link to="/app/reports" className="hidden items-center gap-1.5 self-stretch rounded-xl bg-royal px-4 text-sm font-semibold text-white hover:bg-royal-dark sm:flex">
              <BarChart3 size={16} /> Reports
            </Link>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <RoleStatsGrid kpis={kpis} />

      {/* Role-specific charts */}
      <div>
        <SectionTitle icon={<BarChart3 size={16} />}>Analytics · {roleLabels[role] ?? role}</SectionTitle>
        <RoleCharts role={role} />
      </div>

      {/* Responsibility + tasks + activity */}
      <ResponsibilityCard responsibility={data?.guide?.responsibility} can={data?.guide?.can} cannot={data?.guide?.cannot} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle icon={<ListChecks size={16} />}>Active tasks & next actions</SectionTitle>
          <RoleTaskQueue tasks={data?.tasks ?? []} />
        </div>
        <div className="space-y-6">
          <div>
            <SectionTitle icon={<FolderOpen size={16} />}>Applications</SectionTitle>
            <div className="gov-card divide-y divide-teal/8">
              {(apps.data ?? []).slice(0, 6).map((a) => (
                <Link key={a.id} to={`/app/application/${a.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-teal-soft/40">
                  <div className="text-sm font-medium text-ink">{a.code}</div>
                  <StatusPill state={a.state} />
                </Link>
              ))}
              {(apps.data ?? []).length === 0 && <div className="px-4 py-6 text-sm text-ink-muted">No applications in scope.</div>}
            </div>
          </div>
          <ActivityTimeline items={activity} />
        </div>
      </div>
    </div>
  );
}
