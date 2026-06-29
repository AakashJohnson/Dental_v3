import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { PhotoImage } from '../visuals/PhotoImage';

const DEFICIENCY = [
  { label: 'Infrastructure', v: 0.72, color: '#38bdf8' },
  { label: 'Faculty', v: 0.54, color: '#34d399' },
  { label: 'Equipment', v: 0.83, color: '#fbbf24' },
  { label: 'Clinical', v: 0.41, color: '#fb7185' },
  { label: 'Records', v: 0.63, color: '#a78bfa' },
];

/** Animated semicircular risk gauge that fills on view. */
function RiskGauge({ score = 72 }: { score?: number }) {
  const r = 46;
  const circ = Math.PI * r; // half circle
  const pct = score / 100;
  return (
    <div className="relative h-20 w-32">
      <svg viewBox="0 0 120 64" className="h-full w-full">
        <path d="M8 60 A52 52 0 0 1 112 60" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" strokeLinecap="round" />
        <motion.path
          d="M8 60 A52 52 0 0 1 112 60"
          fill="none"
          stroke="url(#riskgrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: circ * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="riskgrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="55%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }} className="font-display text-2xl font-bold text-white">
          {score}
        </motion.div>
        <div className="text-[9px] uppercase tracking-wide text-ivory-200/80">Risk score</div>
      </div>
    </div>
  );
}

/**
 * ExpertReviewCard — large dark, image-backed card with a risk gauge and a mini
 * deficiency-by-domain chart overlay (matches the reference "Expert Review").
 */
export function ExpertReviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-ink/30 shadow-card-lg"
    >
      <PhotoImage photo="ecReview" alt="Expert committee reviewing AI-flagged dental inspection deficiencies and risk dashboards" className="absolute inset-0 h-full w-full" rounded="rounded-none" overlay={false} priority />
      <div className="absolute inset-0 bg-ink/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/92 to-ink/70" />

      <div className="relative grid gap-5 p-6 md:grid-cols-2 md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
            <ShieldAlert size={13} /> Risk-based assessment
          </div>
          <h3 className="mt-3 font-display text-2xl font-bold text-white">Expert Review &amp; Risk Assessment</h3>
          <p className="mt-2 max-w-md text-sm text-ivory-200/90">
            AI-flagged deficiencies are reviewed by the Expert Committee for accurate risk scoring and final decision-making —
            on an immutable, fully auditable evidence trail.
          </p>
          <Link to="/login" className="btn-glow mt-4 inline-flex items-center gap-2 rounded-xl bg-royal px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-royal-dark">
            View Review Dashboard <ArrowRight size={15} />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/12 bg-ink/55 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <RiskGauge score={72} />
            <div className="flex-1">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ivory-200/80">Deficiency by domain</div>
              <div className="space-y-1.5">
                {DEFICIENCY.map((d, i) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="w-20 text-[10px] text-ivory-200/80">{d.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${d.v * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
