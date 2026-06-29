import { ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTilt3D } from '../../design-system/effects/card3d';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* ------------------------------- palette ---------------------------------- */
export const C = {
  teal: '#0d5c5c',
  tealL: '#0f6e6e',
  royal: '#1d4ed8',
  royalL: '#3b82f6',
  saffron: '#ea7317',
  green: '#15803d',
  greenL: '#22c55e',
  gold: '#b8860b',
  maroon: '#7c2d12',
  risk: '#dc2626',
  grid: '#e9e0cd',
  ink: '#1c2733',
  muted: '#64748b',
};

const axisProps = { stroke: '#94a3b8', fontSize: 11, tickLine: false } as const;

const tooltipStyle = {
  contentStyle: {
    borderRadius: 10,
    border: '1px solid #e9e0cd',
    background: '#fffdf8',
    fontSize: 12,
    boxShadow: '0 8px 24px rgba(28,39,51,0.12)',
  },
} as const;

/* ------------------------------ card shell -------------------------------- */
export function ChartCard({
  title,
  subtitle,
  icon,
  right,
  className = '',
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const t = useTilt3D(5);
  return (
    <motion.div
      ref={t.ref}
      onMouseMove={t.onMouseMove}
      onMouseLeave={t.onMouseLeave}
      style={t.style}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className={`gov-card p-4 depth-shadow hover-glow ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-teal">{icon}</span>}
          <div>
            <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
            {subtitle && <p className="text-[11px] text-ink-muted">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </motion.div>
  );
}

/* ------------------------------- charts ----------------------------------- */
export function TrendLineChart({ data, x, y, color = C.teal, height = 200 }: { data: any[]; x: string; y: string; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
        <XAxis dataKey={x} {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Line type="monotone" dataKey={y} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} isAnimationActive />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MultiLineChart({ data, x, lines, height = 220 }: { data: any[]; x: string; lines: { key: string; color: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
        <XAxis dataKey={x} {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2.5} dot={{ r: 2.5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaChartCard({ data, x, y, color = C.royal, height = 200 }: { data: any[]; x: string; y: string; color?: string; height?: number }) {
  const id = useMemo(() => `g-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
        <XAxis dataKey={x} {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey={y} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarChartCard({ data, x, y, color = C.teal, height = 200, horizontal = false }: { data: any[]; x: string; y: string; color?: string; height?: number; horizontal?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 6, right: 8, left: horizontal ? 8 : -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey={x} width={92} {...axisProps} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} {...axisProps} />
            <YAxis {...axisProps} />
          </>
        )}
        <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(13,92,92,0.06)' }} />
        <Bar dataKey={y} fill={color} radius={horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0]} maxBarSize={34} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StackedBarChart({ data, x, bars, height = 220, horizontal = false }: { data: any[]; x: string; bars: { key: string; color: string }[]; height?: number; horizontal?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 6, right: 8, left: horizontal ? 8 : -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey={x} width={92} {...axisProps} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} {...axisProps} />
            <YAxis {...axisProps} />
          </>
        )}
        <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(13,92,92,0.06)' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        {bars.map((b, i) => (
          <Bar key={b.key} dataKey={b.key} stackId="a" fill={b.color} radius={i === bars.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={34} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChartCard({ data, height = 200, center }: { data: { name: string; value: number; color: string }[]; height?: number; center?: ReactNode }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2} stroke="none">
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      {center && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ top: -22 }}>{center}</div>}
    </div>
  );
}

export function RadarChartCard({ data, height = 240, color = C.teal }: { data: { axis: string; score: number }[]; height?: number; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={C.grid} />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: C.muted }} />
        <Radar dataKey="score" stroke={color} fill={color} fillOpacity={0.3} strokeWidth={2} />
        <Tooltip {...tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ----------------------- funnel (pure SVG, animated) ---------------------- */
export function WorkflowFunnel({ data, height = 260 }: { data: { stage: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-1.5" style={{ minHeight: height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const hue = 200 - (i / data.length) * 60;
        return (
          <motion.div
            key={d.stage}
            initial={{ opacity: 0, scaleX: 0.6 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="origin-left"
          >
            <div className="mb-0.5 flex items-center justify-between text-[11px]">
              <span className="text-ink-soft">{d.stage}</span>
              <span className="font-semibold text-ink">{d.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-ivory-200">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `hsl(${hue} 60% 42%)` }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* --------------------------- radial gauge (SVG) --------------------------- */
export function RiskGaugeChart({ value, label = 'Risk', size = 150 }: { value: number; label?: string; size?: number }) {
  const r = size / 2 - 14;
  const circ = Math.PI * r; // half circle
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 70 ? C.risk : pct >= 45 ? C.saffron : C.green;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        <path d={`M14 ${size / 2} A ${r} ${r} 0 0 1 ${size - 14} ${size / 2}`} fill="none" stroke={C.grid} strokeWidth={12} strokeLinecap="round" />
        <motion.path
          d={`M14 ${size / 2} A ${r} ${r} 0 0 1 ${size - 14} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: circ - (pct / 100) * circ }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="-mt-7 text-center">
        <div className="font-display text-2xl font-bold" style={{ color }}>{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</div>
      </div>
    </div>
  );
}

/* --------------------------- SLA progress ring ---------------------------- */
export function SLAProgressRing({ value, label, size = 92, color = C.royal }: { value: number; label: string; size?: number; color?: string }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, value);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.grid} strokeWidth={7} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circ}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: circ - (pct / 100) * circ }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        />
        <text x="50%" y="52%" textAnchor="middle" fontSize={16} fontWeight={800} fill={C.ink}>{value}%</text>
      </svg>
      <span className="text-center text-[10px] text-ink-muted">{label}</span>
    </div>
  );
}

/* ------------------------------- heatmap ---------------------------------- */
export function HeatmapGrid({ rows, cols, color = C.teal }: { rows: { label: string; d: number[] }[]; cols: string[]; color?: string }) {
  const max = Math.max(1, ...rows.flatMap((r) => r.d));
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th />
            {cols.map((c) => (
              <th key={c} className="pb-1 text-[10px] font-medium text-ink-muted">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="pr-2 text-right text-[11px] text-ink-soft">{row.label}</td>
              {row.d.map((v, i) => (
                <td key={i}>
                  <div
                    className="h-7 w-full min-w-[26px] rounded"
                    title={`${row.label} · ${cols[i] ?? ''}: ${v}`}
                    style={{ background: v === 0 ? '#f3ede0' : color, opacity: v === 0 ? 1 : 0.25 + (v / max) * 0.75 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
