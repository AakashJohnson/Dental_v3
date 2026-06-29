import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ScanEye, ShieldCheck, FileCheck2, MapPinned, Building2, Gavel, ArrowRight,
  Camera, Users, Activity, Stethoscope, ClipboardCheck, BedDouble, Microscope, UserCheck, Cctv,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { GlassPanel, SectionHead } from '../../design-system/components';
import { fadeUp } from '../../design-system/motion';
import { Counter, ProformaRows, WorkflowRail } from '../../components/InspectionVisuals';
import { PhotoImage } from '../../components/visuals/PhotoImage';
import { PageBackground } from '../../components/visuals/AnimatedBackgrounds';
import { RealInspectionMap } from '../../components/maps/RealInspectionMap';
import { MapStatsStrip } from '../../components/maps/MapStatsStrip';
import { AIActionCard } from '../../components/cards/AIActionCard';
import { ExpertReviewCard } from '../../components/cards/ExpertReviewCard';
import { KeyHighlightStrip } from '../../components/cards/KeyHighlightStrip';
import { AnuvadiniBanner } from '../../components/AnuvadiniBanner';
import { hx } from '../../design-system/effects/hoverEffects';
import { useTilt3D } from '../../design-system/effects/card3d';
import { ROLE_GUIDE } from '../../data/content';
import { roleLabels, roleColors } from '../../design-system/tokens';

const AI_ACTIONS = [
  { photo: 'dentalChair' as const, icon: <Stethoscope size={18} />, title: 'Dental Chairs', subtitle: 'Detection & Count' },
  { photo: 'hospitalBed' as const, icon: <BedDouble size={18} />, title: 'Hospital Beds', subtitle: 'Availability Check' },
  { photo: 'equipment' as const, icon: <Microscope size={18} />, title: 'Equipment', subtitle: 'Compliance Check' },
  { photo: 'faculty' as const, icon: <UserCheck size={18} />, title: 'Faculty Attendance', subtitle: 'AI Verification' },
  { photo: 'opd' as const, icon: <Users size={18} />, title: 'OPD Census', subtitle: 'People Counting' },
];

const KPIS = [
  { label: 'Applications processed', value: 1284, icon: <FileCheck2 size={18} />, accent: '#0d5c5c', soft: 'bg-teal-soft text-teal-dark', sub: 'across 28 states', trend: 12 },
  { label: 'Colleges inspected', value: 313, icon: <Building2 size={18} />, accent: '#1d4ed8', soft: 'bg-royal-soft text-royal-dark', sub: 'AI-verified visits', trend: 8 },
  { label: 'AI evidence captured', value: 48650, icon: <Camera size={18} />, accent: '#ea7317', soft: 'bg-saffron-soft text-saffron-deep', sub: 'geo + hash sealed', trend: 23 },
  { label: 'Deficiencies resolved', value: 9072, icon: <ClipboardCheck size={18} />, accent: '#15803d', soft: 'bg-compliance-soft text-compliance', sub: 'closed on re-verify', trend: 5 },
  { label: 'Avg. scrutiny (days)', value: 6, icon: <Activity size={18} />, accent: '#7c2d12', soft: 'bg-gold-soft text-maroon', sub: 'down from 21 days', trend: -64 },
];

const AI_STEPS = [
  { icon: <MapPinned size={18} />, t: 'Geo-tagged session', d: 'GPS + timestamp + hash seal on every capture.' },
  { icon: <Camera size={18} />, t: 'Video evidence', d: 'Section-by-section walk-through, integrity preserved.' },
  { icon: <ScanEye size={18} />, t: 'AI detection', d: 'Chairs, beds, equipment, area, attendance, census.' },
  { icon: <Users size={18} />, t: 'Observer verify', d: 'Every finding dispositioned; exceptions flagged.' },
  { icon: <Stethoscope size={18} />, t: 'Assessor review', d: 'Dual-signed Joint Assessment Report.' },
  { icon: <Gavel size={18} />, t: 'EC-ready packet', d: 'Deficiency list + risk score for the committee.' },
];

const roleKeys = ['APPLICANT', 'SCRUTINY_OFFICER', 'CASE_OFFICER', 'ASSESSOR', 'OBSERVER', 'EC_MEMBER', 'COMPLIANCE_OFFICER', 'GOVERNMENT_AUTHORITY'];

/** Animated AI detection bounding boxes overlaid on the hero image. */
function HeroBoundingBoxes() {
  const boxes = [
    { l: '60%', t: '16%', w: '30%', h: '24%', label: 'Dental unit', count: 12 },
    { l: '66%', t: '60%', w: '26%', h: '24%', label: 'X-ray', count: 4 },
  ];
  return (
    <>
      {boxes.map((b, i) => (
        <motion.div
          key={b.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0.4, 1, 0.4], scale: 1 }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}
          className="absolute rounded-md border-2 border-cyan-300/90"
          style={{ left: b.l, top: b.t, width: b.w, height: b.h }}
        >
          <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-cyan-400/90 px-1.5 py-0.5 text-[9px] font-bold text-ink">
            {b.label} · COUNT {String(b.count).padStart(2, '0')}
          </span>
        </motion.div>
      ))}
    </>
  );
}

export function Home() {
  const heroTilt = useTilt3D(6);
  return (
    <div>
      <PageBackground variant="public" />

      {/* HERO — image-left command centre + real satellite map right */}
      <section className="relative overflow-hidden border-b border-teal/10">
        <div className="relative mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* LEFT — photorealistic command centre with AI overlays */}
            <motion.div
              ref={heroTilt.ref}
              onMouseMove={heroTilt.onMouseMove}
              onMouseLeave={heroTilt.onMouseLeave}
              style={heroTilt.style}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="hover-image-zoom relative overflow-hidden rounded-3xl border border-teal/15 depth-shadow-lg"
            >
              <PhotoImage
                photo="commandCenter"
                priority
                overlay={false}
                rounded="rounded-none"
                alt="AI-powered dental college inspection command centre with inspectors using tablets and live AI detection feeds"
                className="h-[380px] w-full lg:h-[480px]"
              />
              {/* Cinematic gradient for legible text */}
              <div className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/55 to-ink/10" />
              {/* Moving AI scanline */}
              <motion.div
                animate={{ y: ['-120%', '220%'] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
                className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-cyan-300/0 via-cyan-300/30 to-cyan-300/0"
              />
              {/* CCTV + LIVE badge */}
              <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-md bg-ink/75 px-2 py-1 text-[10px] font-bold text-emerald-200 backdrop-blur">
                <Cctv size={13} /> AI INSPECTION · LIVE
              </div>
              <HeroBoundingBoxes />
              {/* Floating count cards */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute right-4 top-16 z-10 rounded-xl border border-white/20 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-ink shadow-card backdrop-blur">
                Evidence verified · <span className="text-compliance">96%</span>
              </motion.div>
              {/* Hero copy */}
              <div className="absolute inset-0 z-10 flex flex-col justify-center p-7">
                <span className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Danta Drishti</span>
                <h1 className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                  AI-Powered Dental College <span className="text-cyan-300">Inspection</span> &amp; <span className="text-cyan-300">Compliance</span>
                </h1>
                <p className="mt-3 max-w-md text-sm text-ivory-100/90">
                  Ensuring transparency, accountability and excellence in dental education with AI-driven inspections.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to="/ai-inspection" className="btn-glow inline-flex items-center gap-2 rounded-xl bg-royal px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-royal-dark">
                    Explore AI Inspection <ArrowRight size={15} />
                  </Link>
                  <Link to="/workflows" className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20">
                    View Workflows <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* RIGHT — real satellite tile map with bottom stats strip */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <RealInspectionMap
                height="100%"
                defaultLayer="satellite"
                showLayerToggles={false}
                statsStrip={<MapStatsStrip />}
                className="h-[380px] lg:h-[480px]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI in Action + Expert Review */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-5 text-center">
              <span className="text-sm font-bold uppercase tracking-wide text-royal">AI in Action</span>
              <span className="text-sm font-semibold text-ink-soft"> — What We Detect</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {AI_ACTIONS.map((a, i) => (
                <AIActionCard key={a.title} photo={a.photo} icon={a.icon} title={a.title} subtitle={a.subtitle} index={i} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <ExpertReviewCard />
          </div>
        </div>
      </section>

      {/* Key Highlights strip */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <KeyHighlightStrip />
      </section>

      {/* Blue Anuvadini AI banner */}
      <AnuvadiniBanner />

      {/* KPI counters */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <SectionHead eyebrow="Platform at a glance" title="Inspection outcomes, in real numbers" />
          <span className="hidden items-center gap-1.5 rounded-full bg-compliance-soft px-3 py-1 text-[11px] font-semibold text-compliance sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-compliance" /> Live · updated daily
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {KPIS.map((k, i) => {
            const up = k.trend > 0;
            return (
              <motion.div key={k.label} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                className={`gov-card-solid group relative overflow-hidden p-4 ${hx.dashboardCard}`}>
                {/* top accent + corner glow */}
                <span className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${k.accent}, ${k.accent}55)` }} />
                <span className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-80" style={{ background: k.accent }} />
                <div className="relative flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${k.accent}1a`, color: k.accent }}>{k.icon}</div>
                  <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${up ? 'bg-compliance-soft text-compliance' : 'bg-gold-soft text-maroon'}`}>
                    {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(k.trend)}%
                  </span>
                </div>
                <div className="relative mt-3 font-display text-2xl font-bold tracking-tight text-ink"><Counter to={k.value} /></div>
                <div className="relative text-[11px] font-medium uppercase tracking-wide text-ink-muted">{k.label}</div>
                <div className="relative mt-1 text-[11px] text-ink-soft/70">{k.sub}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How DantaDrishti AI works */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHead eyebrow="DantaDrishti AI" title="How AI inspection works" subtitle="Camera → Evidence → AI → Observer → Assessor → EC packet, with integrity at every step." />
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {AI_STEPS.map((c, i) => (
            <motion.div key={c.t} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
              <GlassPanel className={`group relative h-full overflow-hidden p-5 ${hx.card} hover-shine`}>
                {/* step number watermark + corner accent */}
                <span className="pointer-events-none absolute -right-3 -top-4 font-display text-6xl font-bold text-teal/5 transition-colors duration-300 group-hover:text-teal/10">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="absolute inset-x-0 top-0 h-0.5 w-0 bg-gradient-to-r from-teal to-royal transition-all duration-500 group-hover:w-full" />
                <div className="relative mb-3 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-soft to-royal-soft text-teal-dark ring-1 ring-teal/10 transition group-hover:scale-105">{c.icon}</div>
                  <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-dark">Step {i + 1}</span>
                </div>
                <div className="relative font-semibold text-ink">{c.t}</div>
                <p className="relative mt-1 text-sm text-ink-soft">{c.d}</p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Compliance proforma + map */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHead eyebrow="Compliance engine" title="Required vs Available — automated" subtitle="Every proforma row becomes a machine-evaluable rule producing Compliant / Deficient verdicts with quantified shortfalls." />
            <div className="mt-5"><ProformaRows /></div>
          </div>
          <div>
            <PhotoImage photo="ecReview" alt="Observer and assessors reviewing AI inspection evidence in an expert committee review room" className="aspect-[4/3] shadow-card-lg">
              <div className="text-sm font-bold text-white">Observer & assessor evidence review</div>
            </PhotoImage>
          </div>
        </div>
      </section>

      {/* Workflow rail */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHead center eyebrow="State machine" title="One governed approval workflow" subtitle="Strictly ordered gates with a deficiency → compliance re-verification loop." />
        <div className="mt-7 gov-card-solid p-5"><WorkflowRail active={4} /></div>
      </section>

      {/* Role-based governance */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHead eyebrow="Governance" title="Role-based, least-privilege access" subtitle="Every role sees only what its task requires — enforced in the backend, not just hidden in the UI." />
        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
          {roleKeys.map((r, i) => (
            <motion.div key={r} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
              <GlassPanel className={`group relative h-full overflow-hidden p-4 ${hx.card}`}>
                <span className="absolute left-0 top-0 h-full w-0.5 transition-all duration-300 group-hover:w-1" style={{ background: roleColors[r] ?? '#0d5c5c' }} />
                <span className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-40" style={{ background: roleColors[r] ?? '#0d5c5c' }} />
                <div className="relative mb-2 grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${roleColors[r] ?? '#0d5c5c'}14`, color: roleColors[r] ?? '#0d5c5c' }}>
                  <ShieldCheck size={17} />
                </div>
                <div className="relative text-sm font-semibold text-ink">{roleLabels[r]}</div>
                <div className="relative mt-1 line-clamp-3 text-[12px] text-ink-soft">{ROLE_GUIDE[r].responsibility}</div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="seal-ring overflow-hidden rounded-2xl bg-teal-dark px-6 py-10 text-center text-white">
          <h3 className="font-display text-2xl font-bold">Start a new approval, recognition or renewal</h3>
          <p className="mx-auto mt-2 max-w-xl text-ivory-200">Apply, track, and complete inspections on a single auditable platform.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="rounded-xl bg-saffron px-5 py-3 text-sm font-semibold text-white hover:bg-saffron-deep">Apply / Login</Link>
            <Link to="/workflows" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Explore Workflows</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
