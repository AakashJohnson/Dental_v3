import { motion } from 'framer-motion';
import { MapMarker, MarkerStatus, MARKER_META } from '../../data/demoMapData';

export interface MapFilters {
  statuses: MarkerStatus[];
  state: string;
  workflow: string;
  minRisk: number;
}

export const DEFAULT_FILTERS: MapFilters = { statuses: [], state: 'all', workflow: 'all', minRisk: 0 };

/** Applies the active filters to a marker list. */
export function applyMapFilters(markers: MapMarker[], f: MapFilters): MapMarker[] {
  return markers.filter((m) => {
    if (f.statuses.length && !f.statuses.includes(m.status)) return false;
    if (f.state !== 'all' && m.state !== f.state) return false;
    if (f.workflow !== 'all' && m.workflow !== f.workflow) return false;
    if (m.risk < f.minRisk) return false;
    return true;
  });
}

const STATUS_KEYS = Object.keys(MARKER_META) as MarkerStatus[];

export function MapFilterPanel({
  markers,
  filters,
  onChange,
  className = '',
}: {
  markers: MapMarker[];
  filters: MapFilters;
  onChange: (f: MapFilters) => void;
  className?: string;
}) {
  const states = ['all', ...Array.from(new Set(markers.map((m) => m.state))).sort()];
  const workflows = ['all', ...Array.from(new Set(markers.map((m) => m.workflow))).sort()];

  const toggleStatus = (s: MarkerStatus) =>
    onChange({
      ...filters,
      statuses: filters.statuses.includes(s) ? filters.statuses.filter((x) => x !== s) : [...filters.statuses, s],
    });

  return (
    <div className={`gov-card-solid p-4 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-display text-sm font-bold text-ink">Filters</h4>
        <button onClick={() => onChange(DEFAULT_FILTERS)} className="text-[11px] font-semibold text-teal hover:underline">Reset</button>
      </div>

      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Status</div>
      <div className="flex flex-wrap gap-1.5">
        {STATUS_KEYS.map((s) => {
          const on = filters.statuses.includes(s);
          return (
            <motion.button
              key={s}
              whileTap={{ scale: 0.92 }}
              onClick={() => toggleStatus(s)}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition"
              style={{
                borderColor: MARKER_META[s].color,
                background: on ? MARKER_META[s].color : 'transparent',
                color: on ? '#fff' : MARKER_META[s].color,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? '#fff' : MARKER_META[s].color }} />
              {MARKER_META[s].label}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-muted">State</span>
          <select value={filters.state} onChange={(e) => onChange({ ...filters, state: e.target.value })}
            className="w-full rounded-lg border border-teal/20 bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-teal">
            {states.map((s) => <option key={s} value={s}>{s === 'all' ? 'All states' : s}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Workflow</span>
          <select value={filters.workflow} onChange={(e) => onChange({ ...filters, workflow: e.target.value })}
            className="w-full rounded-lg border border-teal/20 bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-teal">
            {workflows.map((w) => <option key={w} value={w}>{w === 'all' ? 'All workflows' : w}</option>)}
          </select>
        </label>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
          <span>Min risk</span><span className="text-teal-dark">{filters.minRisk}</span>
        </span>
        <input type="range" min={0} max={100} step={5} value={filters.minRisk}
          onChange={(e) => onChange({ ...filters, minRisk: Number(e.target.value) })}
          className="w-full accent-teal" />
      </label>
    </div>
  );
}
