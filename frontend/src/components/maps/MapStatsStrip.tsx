import { motion } from 'framer-motion';
import { Building2, ClipboardCheck, CheckCircle2, AlertTriangle, OctagonAlert } from 'lucide-react';
import { Counter } from '../InspectionVisuals';

export interface MapStat {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  tone: string;
}

export const DEFAULT_MAP_STATS: MapStat[] = [
  { label: 'Total Colleges', value: 1245, icon: <Building2 size={16} />, tone: 'text-sky-300' },
  { label: 'Inspections', value: 3782, icon: <ClipboardCheck size={16} />, tone: 'text-cyan-300' },
  { label: 'Compliant', value: 2856, icon: <CheckCircle2 size={16} />, tone: 'text-emerald-300' },
  { label: 'At Risk', value: 624, icon: <AlertTriangle size={16} />, tone: 'text-amber-300' },
  { label: 'Critical', value: 302, icon: <OctagonAlert size={16} />, tone: 'text-rose-300' },
];

/**
 * MapStatsStrip — dark glass stats bar that sits over the bottom of the map
 * (matches the government reference design). Counters animate in on view.
 */
export function MapStatsStrip({ stats = DEFAULT_MAP_STATS }: { stats?: MapStat[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="m-2 grid grid-cols-2 gap-x-2 gap-y-3 rounded-xl border border-white/10 bg-ink/85 px-4 py-3 text-white shadow-card-lg backdrop-blur-md sm:grid-cols-3 lg:grid-cols-5"
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 * i }}
          className="flex items-center gap-2.5"
        >
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 ${s.tone}`}>{s.icon}</span>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold">
              <Counter to={s.value} suffix={s.suffix} />
            </div>
            <div className="text-[10px] uppercase tracking-wide text-ivory-200/80">{s.label}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
