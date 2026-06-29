import { motion } from 'framer-motion';
import { Globe2, Video, ClipboardCheck, Cpu } from 'lucide-react';
import { Counter } from './InspectionVisuals';

const KPIS = [
  { icon: <Globe2 size={16} />, label: 'States Covered', value: 36, suffix: '' },
  { icon: <Cpu size={16} />, label: 'AI Models', value: 18, suffix: '+' },
  { icon: <Video size={16} />, label: 'Videos Processed', display: '2.4M+' },
  { icon: <ClipboardCheck size={16} />, label: 'Inspections / Year', value: 6000, suffix: '+' },
];

/** Glowing AI brain graphic (decorative) — cyan circuit brain with pulsing nodes. */
function AIBrain() {
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-2xl" />
      <motion.span
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity }}
        className="absolute inset-2 rounded-full border-2 border-cyan-300/40"
      />
      <svg viewBox="0 0 120 122" className="relative h-24 w-24 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">
        <defs>
          <linearGradient id="brainGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d="M60 22c-10-8-26-6-30 6-10 1-16 9-14 18-7 5-8 15-1 21-2 9 4 17 13 18 3 8 13 12 22 8 9 4 19 0 22-8 9-1 15-9 13-18 7-6 6-16-1-21 2-9-4-17-14-18-4-12-20-14-30-6z"
          fill="none"
          stroke="url(#brainGrad)"
          strokeWidth="2.2"
        />
        <line x1="60" y1="22" x2="60" y2="100" stroke="url(#brainGrad)" strokeWidth="1.6" opacity="0.6" />
        {['M60 40 H44 M44 40 V54', 'M60 56 H78 M78 56 V70', 'M60 72 H46 M46 72 V84'].map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#a5f3fc" strokeWidth="1.4" opacity="0.7" />
        ))}
        {[[44, 54], [78, 70], [46, 84], [60, 40], [60, 72]].map(([cx, cy], i) => (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r="2.6"
            fill="#67e8f9"
            animate={{ r: [2, 3.4, 2], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
        <text x="60" y="116" textAnchor="middle" className="fill-cyan-200" fontSize="11" fontWeight="700">AI</text>
      </svg>
    </div>
  );
}

/** Institutional government building (Rashtrapati Bhavan style) silhouette with lit windows. */
function GovernmentBuilding() {
  const windows: [number, number][] = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 14; c++) windows.push([72 + c * 24, 150 + r * 22]);
  return (
    <svg viewBox="0 0 480 230" className="h-full w-auto" preserveAspectRatio="xMaxYMax meet" aria-hidden>
      <defs>
        <linearGradient id="bldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#33497a" />
          <stop offset="100%" stopColor="#16264d" />
        </linearGradient>
      </defs>
      <line x1="240" y1="16" x2="240" y2="44" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M240 18 h22 l-5 5 5 5 h-22 z" fill="#f59e0b" />
      <ellipse cx="240" cy="92" rx="46" ry="40" fill="url(#bldg)" />
      <rect x="206" y="86" width="68" height="20" fill="url(#bldg)" />
      <circle cx="240" cy="54" r="6" fill="#33497a" />
      <rect x="196" y="106" width="88" height="14" fill="#27396a" />
      <rect x="60" y="120" width="360" height="90" fill="url(#bldg)" />
      <rect x="20" y="150" width="60" height="60" fill="#1d2f58" />
      <rect x="400" y="150" width="60" height="60" fill="#1d2f58" />
      {Array.from({ length: 13 }).map((_, i) => (
        <rect key={i} x={78 + i * 27} y="128" width="7" height="82" fill="#27396a" />
      ))}
      {windows.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="7" height="9" rx="1" fill="#fcd34d" opacity={i % 3 === 0 ? 0.9 : 0.45} />
      ))}
      <rect x="40" y="210" width="400" height="6" fill="#16264d" />
    </svg>
  );
}

/**
 * AnuvadiniBanner — rich dark-navy government/AI banner with a glowing AI brain
 * (left), central branding + KPI counters, and an institutional building
 * silhouette (right), matching the reference design.
 */
export function AnuvadiniBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#081539] via-[#0d2360] to-[#0a1f4d] text-white">
      {/* Circuit texture overlay (decorative). */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden>
        <defs>
          <pattern id="bannerCircuit" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M0 24 H18 M24 0 V18 M24 30 V48 M30 24 H48" stroke="#67e8f9" strokeWidth="1" fill="none" />
            <circle cx="24" cy="24" r="2" fill="#67e8f9" />
            <circle cx="0" cy="24" r="1.4" fill="#67e8f9" />
            <circle cx="48" cy="24" r="1.4" fill="#67e8f9" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bannerCircuit)" />
      </svg>

      {/* Institutional building on the right (decorative). */}
      <div className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[42%] max-w-2xl opacity-70 md:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent to-[#0a1f4d]" />
        <GovernmentBuilding />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-9 lg:flex-row lg:items-center">
        {/* Left AI brain */}
        <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="shrink-0">
          <AIBrain />
        </motion.div>

        {/* Center branding + KPIs */}
        <div className="flex-1 text-center lg:text-left">
          <h3 className="font-display text-2xl font-bold">
            DantaDrishti <span className="text-cyan-300">— Powered by Anuvadini AI</span>
          </h3>
          <p className="mx-auto mt-1 max-w-xl text-sm text-ivory-200/85 lg:mx-0">
            Transforming dental college inspections with Artificial Intelligence — ensuring quality, safety and compliance across India.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl">
            {KPIS.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2.5 backdrop-blur"
              >
                <div className="flex items-center gap-1.5 text-cyan-300">{k.icon}</div>
                <div className="mt-1 font-display text-xl font-bold">
                  {k.display ? k.display : <Counter to={k.value!} suffix={k.suffix} />}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-ivory-200/75">{k.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
