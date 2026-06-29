import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { riskColors, roleColors, roleLabels, severityColors, stateColors, stateLabels } from '../tokens';
import { fadeUp } from '../motion';

function cx(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

/** Premium institutional card (light glass on paper). */
export function GlassPanel({
  children,
  className,
  luminous,
}: {
  children: ReactNode;
  className?: string;
  luminous?: boolean;
}) {
  return <div className={cx('gov-card', luminous && 'seal-ring', className)}>{children}</div>;
}

export function GlowButton({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'saffron';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-teal text-white shadow-glow hover:bg-teal-dark',
    saffron: 'bg-saffron text-white shadow-card hover:bg-saffron-deep',
    success: 'bg-compliance text-white shadow-card hover:brightness-110',
    danger: 'bg-risk-high text-white hover:brightness-110',
    ghost: 'border border-teal/20 bg-white text-teal-dark hover:bg-teal-soft',
  };
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40',
        styles[variant],
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function MotionCard({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StatusPill({ state }: { state: string }) {
  const color = stateColors[state] ?? '#64748b';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{ color, borderColor: `${color}40`, background: `${color}12` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {stateLabels[state] ?? state}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const color = roleColors[role] ?? '#475569';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ color, background: `${color}14`, border: `1px solid ${color}33` }}
    >
      {roleLabels[role] ?? role}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const color = severityColors[severity] ?? '#475569';
  return (
    <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color, background: `${color}16` }}>
      {severity}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  accent = '#0d5c5c',
  hint,
  icon,
  index = 0,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
  hint?: string;
  icon?: ReactNode;
  index?: number;
}) {
  return (
    <MotionCard index={index}>
      <div className="gov-card-solid group relative overflow-hidden p-5">
        <div className="absolute right-0 top-0 h-full w-1" style={{ background: accent }} />
        <span
          className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
          style={{ background: accent }}
        />
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
        />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="font-display text-3xl font-bold tracking-tight text-ink">{value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</div>
          </div>
          {icon && (
            <div
              className="grid h-10 w-10 place-items-center rounded-xl ring-1 transition group-hover:scale-105"
              style={{ background: `${accent}16`, color: accent, borderColor: `${accent}22` }}
            >
              {icon}
            </div>
          )}
        </div>
        {hint && <div className="relative mt-2 text-[11px] text-ink-muted">{hint}</div>}
      </div>
    </MotionCard>
  );
}

export function RiskGauge({ score, level }: { score: number; level: string }) {
  const color = riskColors[level] ?? '#64748b';
  const pct = Math.min(100, score * 8);
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(13,92,92,0.10)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink">
          {score}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-ink-muted">Risk</div>
        <div className="text-lg font-semibold" style={{ color }}>
          {level}
        </div>
      </div>
    </div>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#15803d' : pct >= 70 ? '#d97706' : '#dc2626';
  return (
    <div className="w-28">
      <div className="flex justify-between text-[11px] text-ink-muted">
        <span>confidence</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-teal/10">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/** Section heading used on public pages. */
export function SectionHead({
  eyebrow,
  title,
  subtitle,
  center,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('max-w-2xl', center && 'mx-auto text-center', className)}>
      {eyebrow && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-dark">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-3xl font-bold text-ink">{title}</h2>
      {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
    </div>
  );
}

export { cx };
