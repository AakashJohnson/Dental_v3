import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { Kpi } from '../../data/demoDashboardData';
import { StatusPill } from '../../design-system/components';
import { roleColors, roleLabels } from '../../design-system/tokens';
import { useTilt3D } from '../../design-system/effects/card3d';

const TONE: Record<string, { bar: string; soft: string; text: string }> = {
  teal: { bar: '#0d5c5c', soft: 'bg-teal-soft', text: 'text-teal-dark' },
  royal: { bar: '#1d4ed8', soft: 'bg-royal-soft', text: 'text-royal-dark' },
  saffron: { bar: '#ea7317', soft: 'bg-saffron-soft', text: 'text-saffron-deep' },
  green: { bar: '#15803d', soft: 'bg-compliance-soft', text: 'text-compliance' },
  maroon: { bar: '#7c2d12', soft: 'bg-gold-soft', text: 'text-maroon' },
  risk: { bar: '#dc2626', soft: 'bg-red-50', text: 'text-risk-high' },
};

export function KpiCard({ kpi, index = 0 }: { kpi: Kpi; index?: number }) {
  const tone = TONE[kpi.tone ?? 'teal'] ?? TONE.teal;
  const t = useTilt3D(7);
  const up = typeof kpi.trend === 'number' && kpi.trend > 0;
  return (
    <motion.div
      ref={t.ref}
      onMouseMove={t.onMouseMove}
      onMouseLeave={t.onMouseLeave}
      style={t.style}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="gov-card group relative overflow-hidden p-4 depth-shadow hover-stat-pop"
    >
      {/* tone wash + corner glow */}
      <span className="absolute left-0 top-0 h-full w-1" style={{ background: tone.bar }} />
      <span
        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-90"
        style={{ background: tone.bar }}
      />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${tone.bar}66, transparent)` }}
      />
      <div className="relative flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{kpi.label}</div>
        <span className={`h-2 w-2 shrink-0 rounded-full ring-2 ring-white/70`} style={{ background: tone.bar }} />
      </div>
      <div className="relative mt-1.5 flex items-end justify-between">
        <span className="font-display text-2xl font-bold tracking-tight text-ink">{kpi.value}</span>
        {typeof kpi.trend === 'number' && kpi.trend !== 0 && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${
              up ? 'bg-compliance-soft text-compliance' : 'bg-red-50 text-risk-high'
            }`}
          >
            {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(kpi.trend)}%
          </span>
        )}
      </div>
      {kpi.sub && <div className="relative mt-0.5 text-[11px] text-ink-muted">{kpi.sub}</div>}
    </motion.div>
  );
}

export function RoleStatsGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((k, i) => (
        <KpiCard key={k.label} kpi={k} index={i} />
      ))}
    </div>
  );
}

export function SectionTitle({ icon, children, right }: { icon?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
        {icon && <span className="text-teal">{icon}</span>}
        {children}
      </h2>
      {right}
    </div>
  );
}

export function ResponsibilityCard({ responsibility, can, cannot }: { responsibility?: string; can?: string[]; cannot?: string[] }) {
  return (
    <div className="gov-card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Your mandate</div>
      <p className="mt-1 text-sm text-ink-soft">{responsibility ?? '—'}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-compliance"><CheckCircle2 size={15} /><span className="text-xs font-bold text-ink">Can do</span></div>
          <ul className="space-y-1.5">
            {(can ?? []).map((c) => (
              <li key={c} className="flex items-start gap-2 text-[12.5px] text-ink-soft"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-compliance" />{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-risk-high"><XCircle size={15} /><span className="text-xs font-bold text-ink">Restricted</span></div>
          <ul className="space-y-1.5">
            {(cannot ?? []).map((c) => (
              <li key={c} className="flex items-start gap-2 text-[12.5px] text-ink-soft"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-risk-high" />{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function RoleTaskQueue({ tasks }: { tasks: { applicationId: string; code: string; state: string; guidance: any }[] }) {
  return (
    <div className="space-y-3">
      {tasks.length === 0 && <div className="gov-card p-6 text-sm text-ink-muted">No active tasks in your queue right now.</div>}
      {tasks.map((t, i) => (
        <motion.div key={t.applicationId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="gov-card p-4">
          <div className="flex items-center justify-between">
            <Link to={`/app/application/${t.applicationId}`} className="font-semibold text-teal-dark hover:underline">{t.code}</Link>
            <StatusPill state={t.state} />
          </div>
          <p className="mt-2 text-sm text-ink-soft">{t.guidance?.message}</p>
          {t.guidance?.responsibleRole && (
            <div className="mt-1 text-[11px] text-ink-muted">
              Responsible: <span className="font-semibold" style={{ color: roleColors[t.guidance.responsibleRole] ?? '#0d5c5c' }}>{roleLabels[t.guidance.responsibleRole] ?? t.guidance.responsibleRole}</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function ActivityTimeline({ items }: { items: { actor: string; action: string; time: string }[] }) {
  return (
    <div className="gov-card p-5">
      <SectionTitle icon={<Activity size={16} />}>Activity</SectionTitle>
      <ol className="relative space-y-4 border-l border-teal/15 pl-4">
        {items.map((it, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal" />
            <div className="text-[12.5px] text-ink">{it.action}</div>
            <div className="text-[11px] text-ink-muted">{it.actor} · {it.time}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RoleRestrictionNotice({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-[12.5px] text-maroon">
      <span className="mt-0.5">🔒</span>
      <span>{text}</span>
    </div>
  );
}

export function NextActionPanel({ title, desc, to, cta }: { title: string; desc: string; to?: string; cta?: string }) {
  return (
    <div className="gov-card-solid relative overflow-hidden p-5 tex-proforma">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-saffron" />
      <div className="text-[11px] font-semibold uppercase tracking-wide text-saffron-deep">Next action</div>
      <h3 className="mt-1 font-display text-base font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{desc}</p>
      {to && cta && (
        <Link to={to} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark">
          {cta} <ArrowUpRight size={13} />
        </Link>
      )}
    </div>
  );
}
