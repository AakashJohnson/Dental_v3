import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ScanEye,
  ShieldCheck,
  Workflow,
  MapPinned,
  FileLock2,
  Cpu,
  Camera,
  Users,
  ArrowRight,
  Gavel,
} from 'lucide-react';
import { AuroraBackground } from '../design-system/components/AuroraBackground';
import { GlassPanel, GlowButton, MotionCard } from '../design-system/components';
import { fadeUp, stagger } from '../design-system/motion';
import { workflowOrder, stateLabels, stateColors, roleLabels } from '../design-system/tokens';

const kpis = [
  { label: 'Workflow types', value: '7', icon: <Workflow size={16} />, sub: 'Draft → Approved', accent: '#22d3ee' },
  { label: 'Canonical states', value: '13+', icon: <ScanEye size={16} />, sub: 'governed transitions', accent: '#a78bfa' },
  { label: 'AI detectors', value: '16', icon: <Cpu size={16} />, sub: 'chairs · beds · faculty', accent: '#34d399' },
  { label: 'EC decisions', value: '7', icon: <Gavel size={16} />, sub: 'fixed vocabulary', accent: '#fbbf24' },
];

const aiCards = [
  { icon: <Camera size={18} />, title: 'Geo-tagged evidence', desc: 'Every capture carries lat/long, timestamp and hash integrity.' },
  { icon: <Cpu size={18} />, title: 'Chair & bed counting', desc: 'AI counts dental chairs, beds, OPD census and equipment.' },
  { icon: <Users size={18} />, title: 'Faculty attendance', desc: 'Face/biometric verification flags ghost & duplicate faculty.' },
  { icon: <MapPinned size={18} />, title: 'Geo-distance checks', desc: 'Validates distance to attached hospital & satellite centres.' },
];

const roles = Object.keys(roleLabels).slice(0, 8);

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraBackground />

      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan to-violet text-base-900">
            <ScanEye size={22} />
          </div>
          <div>
            <div className="font-display text-lg font-bold text-white">DantaDrishti</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">Inspection Automation</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-slate-300 hover:text-white">
            Track Application
          </Link>
          <Link to="/login">
            <GlowButton variant="ghost">Regulator Login</GlowButton>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-10">
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl">
          <motion.div variants={fadeUp} className="mb-5 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-cyan">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-cyan" />
            DantaDrishti AI · Verified evidence · EC-ready packets
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-5xl font-bold leading-tight text-white md:text-6xl">
            Dental college approval, <span className="text-gradient">inspected by AI</span>, decided by humans.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg text-slate-300">
            One governed pipeline from <strong className="text-white">Draft</strong> to{' '}
            <strong className="text-white">Approved</strong>. AI captures verifiable evidence, observers verify every
            finding, the compliance engine scores risk, and the Expert Committee decides — all on an immutable audit trail.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link to="/login">
              <GlowButton variant="primary">
                Apply now <ArrowRight size={16} />
              </GlowButton>
            </Link>
            <Link to="/login">
              <GlowButton variant="ghost">Track application</GlowButton>
            </Link>
          </motion.div>
        </motion.div>

        {/* KPI cards */}
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((k, i) => (
            <MotionCard key={k.label} index={i}>
              <GlassPanel luminous className="group relative h-full overflow-hidden p-5">
                {/* accent glow + top hairline */}
                <span className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-70" style={{ background: k.accent }} />
                <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${k.accent}, transparent)` }} />
                <div className="relative mb-3 grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${k.accent}1f`, color: k.accent }}>
                  {k.icon}
                </div>
                <div className="relative font-display text-4xl font-bold leading-none text-white">{k.value}</div>
                <div className="relative mt-2 text-xs font-semibold uppercase tracking-wider text-slate-300">{k.label}</div>
                <div className="relative mt-0.5 text-[11px] text-slate-500">{k.sub}</div>
              </GlassPanel>
            </MotionCard>
          ))}
        </div>
      </section>

      {/* AI Video Inspection */}
      <Section title="AI Video Inspection" subtitle="Camera → Evidence → Observer → Assessor pipeline">
        <div className="grid gap-4 md:grid-cols-4">
          {aiCards.map((c, i) => (
            <MotionCard key={c.title} index={i}>
              <GlassPanel className="group relative h-full overflow-hidden p-5">
                <span className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-cyan/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 h-px w-0 bg-gradient-to-r from-cyan to-transparent transition-all duration-500 group-hover:w-full" />
                <div className="relative mb-3 grid h-11 w-11 place-items-center rounded-xl bg-cyan/15 text-cyan ring-1 ring-cyan/20 transition group-hover:scale-105 group-hover:bg-cyan/25">{c.icon}</div>
                <div className="relative font-semibold text-white">{c.title}</div>
                <p className="relative mt-1 text-sm text-slate-400">{c.desc}</p>
              </GlassPanel>
            </MotionCard>
          ))}
        </div>
      </Section>

      {/* Workflow State Machine */}
      <Section title="Workflow State Machine" subtitle="Draft → Approved, with a deficiency & re-verification loop">
        <GlassPanel className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            {workflowOrder.map((s, i) => (
              <motion.div
                key={s}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="flex items-center gap-2"
              >
                <span
                  className="rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{
                    color: stateColors[s],
                    background: `${stateColors[s]}15`,
                    border: `1px solid ${stateColors[s]}40`,
                  }}
                >
                  {stateLabels[s]}
                </span>
                {i < workflowOrder.length - 1 && <span className="text-slate-600">→</span>}
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-400">
            <span className="text-amber-300">Deficiency</span> loops back to{' '}
            <span className="text-white">Inspection Scheduled</span> via system-generated Workflow 7 (Compliance
            Verification), re-checking only outstanding items.
          </p>
        </GlassPanel>
      </Section>

      {/* Role-based governance */}
      <Section title="Role-Based Governance" subtitle="Every role sees only what its task requires">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {roles.map((r, i) => (
            <MotionCard key={r} index={i}>
              <GlassPanel className="group relative overflow-hidden p-4 text-center">
                <span className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-20 w-20 rounded-full bg-violet/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-violet/15 text-violet-glow ring-1 ring-violet/20 transition group-hover:scale-105">
                  <Workflow size={18} />
                </div>
                <div className="relative text-sm font-semibold text-white">{roleLabels[r]}</div>
              </GlassPanel>
            </MotionCard>
          ))}
        </div>
      </Section>

      {/* Trust & Audit */}
      <Section title="Trust & Audit" subtitle="Immutable, traceable, EC-ready">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: <FileLock2 size={18} />, t: 'Immutable audit logs', d: 'Append-only events with before/after state, actor and reason.' },
            { icon: <ShieldCheck size={18} />, t: 'Evidence custody', d: 'Geo, timestamp and hash integrity on every captured artefact.' },
            { icon: <Gavel18 />, t: 'Decision traceability', d: 'EC decisions are restricted to a fixed vocabulary, never free text.' },
          ].map((c, i) => (
            <MotionCard key={c.t} index={i}>
              <GlassPanel luminous className="group relative h-full overflow-hidden p-5">
                <span className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald/50 to-transparent" />
                <div className="relative mb-3 grid h-11 w-11 place-items-center rounded-xl bg-emerald/15 text-emerald-glow ring-1 ring-emerald/20 transition group-hover:scale-105">
                  {c.icon}
                </div>
                <div className="relative font-semibold text-white">{c.t}</div>
                <p className="relative mt-1 text-sm text-slate-400">{c.d}</p>
              </GlassPanel>
            </MotionCard>
          ))}
        </div>
      </Section>

      <footer className="mx-auto mt-8 max-w-7xl px-6 py-12 text-sm text-slate-500">
        <div className="grid gap-10 border-t border-white/5 pt-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan to-violet text-base-900">
                <ScanEye size={22} />
              </div>
              <div>
                <div className="font-display text-lg font-bold text-white">DantaDrishti</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">Inspection Automation</div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              One governed pipeline from Draft to Approved — AI-captured evidence, observer verification and EC-ready
              decision packets on an immutable audit trail.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['DCI Reg. 2006', 'Geo-sealed evidence', 'Immutable audit'].map((b) => (
                <span key={b} className="rounded-full border border-white/10 glass px-3 py-1 text-[11px] text-slate-300">{b}</span>
              ))}
            </div>
          </div>
          {[
            { h: 'Platform', items: ['AI Inspection', 'Workflows', 'Compliance engine', 'Audit trail'] },
            { h: 'Resources', items: ['Regulations', 'Support', 'Verification', 'Contact'] },
          ].map((col) => (
            <div key={col.h}>
              <div className="text-xs font-semibold uppercase tracking-wider text-white">{col.h}</div>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((it) => (
                  <li key={it}><span className="cursor-pointer text-slate-400 transition hover:text-cyan">{it}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs">
          <div>© {new Date().getFullYear()} DantaDrishti · Dental College Approval & Inspection Automation</div>
          <div className="text-slate-600">Ministry of Ayush · Government of India · Powered by Anuvadini AI</div>
        </div>
      </footer>
    </div>
  );
}

function Gavel18() {
  return <Gavel size={18} />;
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <MotionCard>
        <h2 className="font-display text-3xl font-bold text-white">{title}</h2>
        <p className="mb-7 mt-1 text-slate-400">{subtitle}</p>
      </MotionCard>
      {children}
    </section>
  );
}
