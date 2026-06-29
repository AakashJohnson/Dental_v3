import { MapMarker, MARKER_META } from '../../data/demoMapData';

const RISK_TONE = (r: number) => (r >= 70 ? '#dc2626' : r >= 45 ? '#ea7317' : '#15803d');

/**
 * MapPopupCard — rich popup body for an inspection marker. Rendered both as a
 * React node (inside react-leaflet <Popup>) and as static HTML (for clustered
 * markers via renderToStaticMarkup).
 */
export function MapPopupCard({ m }: { m: MapMarker }) {
  const meta = MARKER_META[m.status];
  return (
    <div className="w-full font-sans">
      <div className="px-3.5 pb-2 pt-3" style={{ background: 'linear-gradient(135deg,#0d5c5c,#0a4747)' }}>
        <div className="text-[13px] font-bold leading-tight text-white">{m.name}</div>
        <div className="mt-0.5 text-[11px] text-white/75">{m.city}, {m.state}</div>
      </div>
      <div className="space-y-1.5 px-3.5 py-2.5 text-[11px] text-ink">
        <div className="flex items-center justify-between gap-3">
          <span className="text-ink-muted">Status</span>
          <span className="inline-flex items-center gap-1 font-semibold" style={{ color: meta.color }}>
            <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />{meta.label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-ink-muted">Workflow</span><span className="font-medium">{m.workflow}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-ink-muted">Risk score</span>
          <span className="font-bold" style={{ color: RISK_TONE(m.risk) }}>{m.risk}/100</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-ink-muted">Intake</span><span className="font-medium">{m.intake} seats</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-ink-muted">Last inspection</span><span className="font-medium">{m.lastInspection}</span>
        </div>
        <div className="mt-1.5 rounded-lg bg-teal-soft px-2.5 py-1.5">
          <div className="text-[9px] font-semibold uppercase tracking-wide text-teal-dark">Next action</div>
          <div className="text-[11px] font-semibold text-ink">{m.nextAction}</div>
        </div>
      </div>
    </div>
  );
}
