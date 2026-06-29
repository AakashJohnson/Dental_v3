import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { GlassPanel, MetricCard } from '../design-system/components';
import { stateLabels, stateColors } from '../design-system/tokens';

export function Reports() {
  const pipeline = useQuery({ queryKey: ['rpt-pipeline'], queryFn: () => api.get<any>('/reports/pipeline') });
  const risk = useQuery({ queryKey: ['rpt-risk'], queryFn: () => api.get<any[]>('/reports/risk') });
  const def = useQuery({ queryKey: ['rpt-def'], queryFn: () => api.get<any>('/reports/deficiencies') });
  const sla = useQuery({ queryKey: ['rpt-sla'], queryFn: () => api.get<any[]>('/reports/sla') });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Reports & Analytics</h1>
        <p className="mt-1 text-ink-soft">Pipeline, deficiencies, risk and SLA across all applications.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total applications" value={pipeline.data?.total ?? '—'} index={0} />
        <MetricCard label="Deficiencies" value={def.data?.total ?? '—'} accent="#d97706" index={1} />
        <MetricCard label="Outstanding" value={def.data?.outstanding ?? '—'} accent="#dc2626" index={2} />
        <MetricCard label="SLA breaches" value={(sla.data ?? []).filter((s) => s.breach).length} accent="#dc2626" index={3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassPanel className="p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Pipeline by state</h2>
          <div className="space-y-2">
            {Object.entries(pipeline.data?.byState ?? {}).map(([s, n]) => (
              <div key={s} className="flex items-center gap-3">
                <div className="w-44 text-xs text-ink-soft">{stateLabels[s] ?? s}</div>
                <div className="h-2 flex-1 rounded-full bg-teal/10">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${Math.min(100, (n as number) * 18)}%`, background: stateColors[s] ?? '#0d5c5c' }}
                  />
                </div>
                <div className="w-6 text-right text-xs text-ink">{n as number}</div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Risk leaderboard</h2>
          <div className="space-y-2">
            {(risk.data ?? []).slice(0, 8).map((r) => (
              <div key={r.code} className="flex items-center justify-between rounded-lg bg-ivory-200/70 px-3 py-2">
                <span className="text-sm text-ink">{r.code}</span>
                <div className="flex items-center gap-3">
                  {r.integrity && <span className="text-[10px] font-semibold text-risk-integrity">INTEGRITY</span>}
                  <span className="text-sm font-bold" style={{ color: r.riskScore > 5 ? '#dc2626' : r.riskScore > 0 ? '#d97706' : '#15803d' }}>
                    {r.riskScore}
                  </span>
                </div>
              </div>
            ))}
            {(risk.data ?? []).length === 0 && <div className="text-sm text-ink-muted">No scored applications.</div>}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
