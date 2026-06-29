import { GlassPanel, ConfidenceMeter, SeverityBadge } from '../design-system/components';

interface Finding {
  id: string;
  section: string;
  item: string;
  category: string;
  requiredValue: unknown;
  detectedValue: unknown;
  aiVerdict: string;
  confidence: number;
  severity: string;
  status: string;
  geo: { lat: number; lng: number };
}

const statusColor: Record<string, string> = {
  PENDING_OBSERVER_REVIEW: '#c2410c',
  ACCEPTED: '#15803d',
  FLAGGED: '#d97706',
  NEEDS_HUMAN_REVIEW: '#b45309',
  QUARANTINED: '#dc2626',
  OVERRIDDEN: '#6d28d9',
  FINALIZED: '#0d5c5c',
};

/** AIFindingCard — structured finding with evidence integrity + verdict. */
export function AIFindingCard({
  finding,
  onVerify,
}: {
  finding: Finding;
  onVerify?: (verdict: 'ACCEPT' | 'FLAG' | 'OVERRIDE') => void;
}) {
  const color = statusColor[finding.status] ?? '#64748b';
  const compliant = finding.aiVerdict === 'COMPLIANT';
  return (
    <GlassPanel className="group relative overflow-hidden p-4 pl-5">
      <span className="absolute left-0 top-0 h-full w-1" style={{ background: color }} />
      <span
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-50"
        style={{ background: color }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-ink-muted">{finding.section}</div>
          <div className="text-sm font-semibold text-ink">{finding.item}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">{finding.category}</div>
        </div>
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
          style={{ color, background: `${color}14`, border: `1px solid ${color}33` }}
        >
          {finding.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-ivory-200/70 px-2 py-1.5">
          <div className="text-ink-muted">Required</div>
          <div className="font-semibold text-ink">{String(finding.requiredValue)}</div>
        </div>
        <div className="rounded-lg bg-ivory-200/70 px-2 py-1.5">
          <div className="text-ink-muted">Detected</div>
          <div className="font-semibold" style={{ color: compliant ? '#15803d' : '#dc2626' }}>
            {String(finding.detectedValue)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <ConfidenceMeter value={finding.confidence} />
        <SeverityBadge severity={finding.severity} />
      </div>

      <div className="mt-2 flex items-center gap-2 text-[10px] text-ink-muted">
        <span title="geo-tagged">📍 {finding.geo.lat.toFixed(2)},{finding.geo.lng.toFixed(2)}</span>
        <span title="hash verified">🔒 hash</span>
        <span title="timestamped">⏱ stamp</span>
      </div>

      {onVerify && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onVerify('ACCEPT')}
            className="flex-1 rounded-lg bg-compliance-soft py-1.5 text-xs font-semibold text-compliance hover:brightness-95"
          >
            Accept
          </button>
          <button
            onClick={() => onVerify('FLAG')}
            className="flex-1 rounded-lg bg-saffron-soft py-1.5 text-xs font-semibold text-saffron-deep hover:brightness-95"
          >
            Flag
          </button>
          <button
            onClick={() => onVerify('OVERRIDE')}
            className="flex-1 rounded-lg bg-royal-soft py-1.5 text-xs font-semibold text-royal-dark hover:brightness-95"
          >
            Override
          </button>
        </div>
      )}
    </GlassPanel>
  );
}
