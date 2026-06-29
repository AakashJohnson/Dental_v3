import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

/** Animated count-up KPI number. */
export function Counter({ to, suffix = '', duration = 1.4 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>;
}

/** Dental chair silhouette under an AI scan frame. */
export function DentalChairScan({ label = 'Dental chairs detected', count = 17, required = 17 }: { label?: string; count?: number; required?: number }) {
  return (
    <div className="scan-frame gov-card-solid relative overflow-hidden p-4">
      <div className="absolute right-3 top-3 z-10 rounded-md bg-teal px-2 py-0.5 text-[10px] font-semibold text-white">AI · LIVE</div>
      <svg viewBox="0 0 200 130" className="h-32 w-full">
        <rect x="0" y="0" width="200" height="130" rx="10" fill="#e3f0ef" />
        {/* chair */}
        <g fill="#0d5c5c">
          <rect x="60" y="40" width="46" height="58" rx="8" />
          <rect x="58" y="86" width="50" height="16" rx="6" />
          <rect x="76" y="100" width="14" height="22" rx="3" />
          <circle cx="83" cy="124" r="6" />
        </g>
        {/* lamp arm */}
        <g stroke="#1d4ed8" strokeWidth="3" fill="none">
          <path d="M110 50 q34 -8 40 18" />
          <circle cx="150" cy="70" r="8" fill="#f59e0b" stroke="none" />
        </g>
        {/* spittoon */}
        <circle cx="40" cy="64" r="10" fill="#1d4ed8" opacity="0.7" />
        {/* detection box */}
        <rect x="52" y="34" width="62" height="72" fill="none" stroke="#ea7317" strokeWidth="2" strokeDasharray="5 4" />
      </svg>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-soft">{label}</span>
        <span className={`text-sm font-bold ${count >= required ? 'text-compliance' : 'text-risk-high'}`}>
          {count}/{required}
        </span>
      </div>
    </div>
  );
}

/** Dental college building illustration with scan overlay. */
export function CollegeBuildingScan() {
  return (
    <div className="scan-frame gov-card-solid relative overflow-hidden p-4">
      <div className="absolute right-3 top-3 z-10 rounded-md bg-royal px-2 py-0.5 text-[10px] font-semibold text-white">GEO ✓</div>
      <svg viewBox="0 0 240 140" className="h-36 w-full">
        <rect width="240" height="140" rx="10" fill="#e6edfb" />
        <g fill="#1e3a8a">
          <rect x="40" y="50" width="160" height="80" rx="4" />
          <polygon points="40,50 120,20 200,50" fill="#0d5c5c" />
        </g>
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={52 + (i % 6) * 24} y={62 + Math.floor(i / 6) * 30} width="14" height="18" fill="#faf7ef" opacity="0.92" />
        ))}
        <rect x="112" y="104" width="18" height="26" fill="#ea7317" />
        {/* under-construction marker */}
        <g opacity="0.85">
          <rect x="168" y="34" width="30" height="16" fill="#f59e0b" stroke="#c2410c" strokeWidth="1" />
          <text x="183" y="46" textAnchor="middle" fontSize="7" fill="#7c2d12" fontWeight="700">WIP</text>
        </g>
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-ink-soft">Building completion · floors</span>
        <span className="font-bold text-saffron-deep">3rd/4th under construction</span>
      </div>
    </div>
  );
}

/** Animated inspection coverage map with pulsing markers. */
export function InspectionMap({ markers }: { markers?: { x: number; y: number; risk: 'low' | 'medium' | 'high' }[] }) {
  const pts = markers ?? [
    { x: 28, y: 30, risk: 'low' as const },
    { x: 52, y: 22, risk: 'medium' as const },
    { x: 70, y: 48, risk: 'high' as const },
    { x: 40, y: 60, risk: 'low' as const },
    { x: 62, y: 70, risk: 'medium' as const },
    { x: 80, y: 34, risk: 'low' as const },
  ];
  const colors = { low: '#15803d', medium: '#d97706', high: '#dc2626' };
  return (
    <div className="gov-card-solid relative overflow-hidden p-4 tex-ashoka">
      <svg viewBox="0 0 100 90" className="h-full min-h-[220px] w-full">
        {/* stylised India landmass */}
        <path
          d="M30 12 L60 10 L72 22 L80 30 L70 46 L66 62 L54 80 L46 70 L40 60 L30 52 L24 38 L26 22 Z"
          fill="#e3f0ef"
          stroke="#0d5c5c"
          strokeOpacity="0.35"
          strokeWidth="0.8"
        />
        {/* animated inspection route */}
        <motion.path
          d="M28 30 L52 22 L70 48 L40 60 L62 70"
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="0.8"
          strokeDasharray="2 2"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
        />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="2.4" fill={colors[p.risk]} className="animate-marker" style={{ transformOrigin: `${p.x}px ${p.y}px` }} />
            <circle cx={p.x} cy={p.y} r="1.1" fill="#fff" />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-risk-low" /> Compliant</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-risk-medium" /> Deficiency</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-risk-high" /> High risk</span>
      </div>
    </div>
  );
}

/** Auto-filling Required-vs-Available proforma rows. */
export function ProformaRows({ rows }: { rows?: { item: string; required: string; available: string; ok: boolean }[] }) {
  const data = rows ?? [
    { item: 'Dental chairs (Prosthodontics)', required: '17', available: '17', ok: true },
    { item: 'Lecture halls area', required: '6400 sq ft', available: '3200 sq ft', ok: false },
    { item: 'OPD new patients/day', required: '150', available: '162', ok: true },
    { item: 'Non-teaching: DSA', required: '20', available: '18', ok: false },
    { item: 'Hospital beds', required: '100', available: '100', ok: true },
  ];
  return (
    <div className="gov-card-solid overflow-hidden">
      <div className="grid grid-cols-12 gap-2 border-b border-teal/10 bg-teal-soft px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-teal-dark">
        <span className="col-span-6">Requirement</span>
        <span className="col-span-2">Required</span>
        <span className="col-span-2">Available</span>
        <span className="col-span-2 text-right">Verdict</span>
      </div>
      {data.map((r, i) => (
        <motion.div
          key={r.item}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12 }}
          className="grid grid-cols-12 items-center gap-2 border-b border-teal/5 px-4 py-2.5 text-sm"
        >
          <span className="col-span-6 text-ink">{r.item}</span>
          <span className="col-span-2 text-ink-soft">{r.required}</span>
          <span className="col-span-2 font-medium text-ink">{r.available}</span>
          <span className="col-span-2 text-right">
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${r.ok ? 'bg-compliance-soft text-compliance' : 'bg-saffron-soft text-saffron-deep'}`}>
              {r.ok ? 'Compliant' : 'Deficient'}
            </span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/** Compact animated workflow stage rail. */
export function WorkflowRail({ active = 4 }: { active?: number }) {
  const stages = ['Draft', 'Submitted', 'Scrutiny', 'Inspection', 'AI Scan', 'Observer', 'Assessor', 'EC', 'Govt', 'Approved'];
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {stages.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              i <= active ? 'bg-teal text-white' : 'bg-teal-soft text-teal-dark'
            } ${i === active ? 'animate-stagepulse' : ''}`}
          >
            {s}
          </motion.div>
          {i < stages.length - 1 && <span className="text-teal/40">→</span>}
        </div>
      ))}
    </div>
  );
}
