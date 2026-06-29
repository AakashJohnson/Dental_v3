import { motion } from 'framer-motion';
import { MapPin, Clock, Hash, ScanEye, ShieldCheck, CheckCircle2, Flag, AlertTriangle, ShieldAlert } from 'lucide-react';
import { SectionHead, GlassPanel, ConfidenceMeter } from '../../design-system/components';
import { AI_DETECTIONS } from '../../data/content';
import { PhotoImage, PhotoKey } from '../../components/visuals/PhotoImage';
import { PageBackground } from '../../components/visuals/AnimatedBackgrounds';
import { hx } from '../../design-system/effects/hoverEffects';
import { DETECTION_MODULES, FINDING_META, EVIDENCE_GALLERY, OBSERVER_TIMELINE, CONFIDENCE_HISTOGRAM, FindingStatus } from '../../data/demoAIFindings';
import { ChartCard, BarChartCard, C } from '../../components/charts';

const SCENE_PHOTO: Record<string, PhotoKey> = {
  dentalChair: 'dentalChair', hospitalBed: 'hospitalBed', equipment: 'equipment',
  faculty: 'faculty', opd: 'opd', proforma: 'proforma', geo: 'fieldInspection',
};

/** Animated AI bounding boxes drawn over a photorealistic detection frame. */
function BoundingBoxes({ boxes }: { boxes: { x: number; y: number; w: number; h: number; label: string }[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {boxes.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm border-2 border-emerald-300"
          style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, boxShadow: '0 0 12px rgba(16,185,129,0.5)' }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: [0.45, 1, 0.45], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
        >
          <span className="absolute -top-4 left-0 rounded-sm bg-emerald-400 px-1 text-[8px] font-bold text-ink">{b.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

const STATUS_ICON: Record<FindingStatus, JSX.Element> = {
  verified: <CheckCircle2 size={13} />,
  flagged: <Flag size={13} />,
  lowConfidence: <AlertTriangle size={13} />,
  quarantined: <ShieldAlert size={13} />,
};

const PIPELINE = [
  'Geo-tagged inspection session',
  'Video / evidence capture',
  'AI detection',
  'Observer verification',
  'Assessor review',
  'Compliance rule engine',
  'EC-ready deficiency list',
];

export function AIInspection() {
  return (
    <div className="relative mx-auto max-w-7xl px-4 py-12">
      <PageBackground variant="ai" />
      {/* HERO with scan overlay + integrity badges */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHead eyebrow="DantaDrishti" title="AI video inspection" subtitle="One physical visit, fully instrumented — objective evidence, verified by humans, scored against norms." />
          <div className="mt-5 flex flex-wrap gap-2">
            {['Geo-tagged', 'Hash-sealed', 'Timestamped', 'Observer-verified'].map((b) => (
              <span key={b} className="rounded-full border border-teal/20 bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-dark">{b}</span>
            ))}
          </div>
        </div>
        <div className={`relative ${hx.aiCard} hover-image-zoom rounded-2xl`}>
          <PhotoImage photo="dentalChair" priority alt="AI detecting and counting dental chairs during a dental college inspection" className="aspect-[16/10] shadow-card-lg"
            badges={<>
              <span className="rounded-md bg-ink/80 px-2 py-1 text-[10px] font-semibold text-emerald-200">AI LIVE</span>
              <span className="rounded-md bg-ink/80 px-2 py-1 text-[10px] font-semibold text-white">conf 96%</span>
            </>}>
            <div className="flex items-center justify-between text-white">
              <span className="text-sm font-bold">Dental chair detection</span>
              <span className="text-xs">9 / 10 chairs</span>
            </div>
          </PhotoImage>
          <BoundingBoxes boxes={[
            { x: 10, y: 30, w: 18, h: 24, label: 'chair 96%' },
            { x: 34, y: 28, w: 18, h: 26, label: 'chair 94%' },
            { x: 58, y: 32, w: 17, h: 23, label: 'chair 92%' },
            { x: 76, y: 46, w: 16, h: 22, label: 'chair 89%' },
          ]} />
        </div>
      </div>

      {/* pipeline */}
      <div className="mt-7 gov-card-solid p-5">
        <div className="flex flex-wrap items-center gap-2">
          {PIPELINE.map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <motion.span initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-full bg-teal-soft px-3 py-1.5 text-xs font-semibold text-teal-dark">
                {i + 1}. {p}
              </motion.span>
              {i < PIPELINE.length - 1 && <span className="text-teal/40">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* live frames + evidence integrity */}
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className={`relative overflow-hidden rounded-2xl ${hx.aiCard} hover-image-zoom`}>
          <PhotoImage photo="hospitalBed" alt="AI counting attached teaching hospital beds during inspection" className="aspect-[4/3]"
            badges={<span className="rounded-md bg-ink/80 px-2 py-1 text-[10px] font-semibold text-white">beds 312/320</span>}>
            <div className="text-xs font-bold text-white">Hospital bed verification</div>
          </PhotoImage>
          <BoundingBoxes boxes={[{ x: 12, y: 40, w: 20, h: 18, label: 'bed' }, { x: 40, y: 44, w: 20, h: 18, label: 'bed' }, { x: 68, y: 48, w: 18, h: 16, label: 'bed' }]} />
        </div>
        <div className={`relative overflow-hidden rounded-2xl ${hx.aiCard} hover-image-zoom`}>
          <PhotoImage photo="opd" alt="AI people-counting for dental OPD census verification" className="aspect-[4/3]"
            badges={<span className="rounded-md bg-ink/80 px-2 py-1 text-[10px] font-semibold text-white">OPD 214/150</span>}>
            <div className="text-xs font-bold text-white">OPD census people-count</div>
          </PhotoImage>
          <BoundingBoxes boxes={[{ x: 16, y: 34, w: 12, h: 26, label: 'person' }, { x: 38, y: 40, w: 12, h: 24, label: 'person' }, { x: 60, y: 36, w: 12, h: 26, label: 'person' }, { x: 78, y: 44, w: 11, h: 22, label: 'person' }]} />
        </div>
        <GlassPanel className={`p-5 ${hx.card}`}>
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={18} className="text-compliance" />
            <h3 className="font-display text-base font-bold text-ink">Evidence integrity</h3>
          </div>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2 text-ink-soft"><MapPin size={14} className="text-royal" /> Geo: 12.2958, 76.6394 <span className="ml-auto text-[11px] font-semibold text-compliance">valid</span></li>
            <li className="flex items-center gap-2 text-ink-soft"><Clock size={14} className="text-saffron-deep" /> 2026-04-24 10:42 IST <span className="ml-auto text-[11px] font-semibold text-compliance">valid</span></li>
            <li className="flex items-center gap-2 text-ink-soft"><Hash size={14} className="text-teal" /> sha256:9f2a… <span className="ml-auto text-[11px] font-semibold text-compliance">sealed</span></li>
          </ul>
          <div className="mt-4"><ConfidenceMeter value={0.92} /></div>
          <div className="mt-2 text-[11px] text-ink-muted">Low-confidence detections (&lt; 0.70) are always routed to a human.</div>
        </GlassPanel>
      </div>

      {/* detection grid */}
      <SectionHead className="mt-12" eyebrow="Detectors" title="What DantaDrishti detects" subtitle="Sixteen detection categories mapped 1:1 to the inspection proforma." />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AI_DETECTIONS.map((d, i) => (
          <motion.div key={d.category} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
            className={`gov-card-solid p-4 ${hx.card}`}>
            <div className="flex items-center justify-between">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal-soft text-teal-dark"><ScanEye size={15} /></div>
              <span className="rounded-md bg-ivory-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-muted">{d.ruleType}</span>
            </div>
            <h3 className="mt-2 font-semibold text-ink">{d.label}</h3>
            <p className="mt-0.5 text-[12px] text-ink-soft">{d.metric}</p>
          </motion.div>
        ))}
      </div>

      {/* Rich detection modules with images + confidence + status */}
      <SectionHead className="mt-12" eyebrow="Detection modules" title="AI dental inspection in action" subtitle="Detected vs required, confidence and evidence count — mapped to the proforma." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DETECTION_MODULES.map((m, i) => {
          const meta = FINDING_META[m.status];
          return (
            <motion.div key={m.key} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              className={`gov-card overflow-hidden ${hx.aiCard} hover-image-zoom`}>
              <PhotoImage photo={SCENE_PHOTO[m.scene] ?? 'dentalChair'} alt={m.label} className="aspect-[16/9]" rounded="rounded-none" overlay={false} />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">{m.label}</h3>
                  <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ background: meta.soft, color: meta.color }}>
                    {STATUS_ICON[m.status]} {meta.label}
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <span className="font-display text-2xl font-bold text-ink">{m.detected}</span>
                    <span className="text-sm text-ink-muted"> / {m.required} {m.unit}</span>
                  </div>
                  <span className="text-[11px] text-ink-muted">{m.evidence} clips</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ivory-200">
                  <div className="h-full rounded-full" style={{ width: `${m.confidence}%`, background: meta.color }} />
                </div>
                <div className="mt-1 text-[10px] text-ink-muted">Confidence {m.confidence}%</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Observer verification timeline + confidence histogram */}
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <GlassPanel className="p-5 lg:col-span-1">
          <h3 className="font-display text-base font-bold text-ink">Verification chain</h3>
          <ol className="mt-3 space-y-3">
            {OBSERVER_TIMELINE.map((s) => (
              <li key={s.step} className="flex items-start gap-3">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${s.state === 'done' ? 'bg-compliance' : s.state === 'active' ? 'bg-saffron animate-pulse' : 'bg-ink-muted/40'}`} />
                <div>
                  <div className="text-sm font-medium text-ink">{s.step}</div>
                  <div className="text-[11px] text-ink-muted">{s.actor}</div>
                </div>
              </li>
            ))}
          </ol>
        </GlassPanel>
        <ChartCard title="AI confidence distribution" subtitle="All findings this visit" className="lg:col-span-2">
          <BarChartCard data={CONFIDENCE_HISTOGRAM} x="band" y="count" color={C.royal} height={220} />
        </ChartCard>
      </div>

      {/* Evidence gallery */}
      <SectionHead className="mt-12" eyebrow="Custody" title="Evidence gallery" subtitle="Every clip carries geo, time and a tamper-evident hash." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EVIDENCE_GALLERY.map((e) => {
          const meta = FINDING_META[e.status];
          return (
            <div key={e.id} className={`gov-card overflow-hidden ${hx.card} hover-image-zoom`}>
              <div className="relative">
                <PhotoImage photo={SCENE_PHOTO[e.scene] ?? 'dentalChair'} alt={e.module} className="aspect-video" rounded="rounded-none" overlay={false} />
                <span className="absolute right-2 top-2 z-10 rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ background: meta.soft, color: meta.color }}>{meta.label}</span>
                <span className="absolute left-2 top-2 z-10 rounded-md bg-ink/75 px-2 py-0.5 text-[10px] font-semibold text-white">{e.id}</span>
              </div>
              <div className="p-3 text-[11px] text-ink-muted">
                <div className="font-semibold text-ink">{e.module}</div>
                <div className="mt-1 flex items-center gap-2"><MapPin size={11} className="text-royal" /> {e.geo}</div>
                <div className="mt-0.5 flex items-center gap-2"><Clock size={11} className="text-saffron-deep" /> {e.time} · <Hash size={11} className="text-teal" /> {e.hash}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
