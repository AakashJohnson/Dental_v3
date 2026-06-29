import { motion } from 'framer-motion';
import { ShieldCheck, ScanEye, FileCheck2, Gavel, Landmark, Languages } from 'lucide-react';
import { SectionHead } from '../../design-system/components';
import { GovEmblems, AnuvadiniBadge } from '../../components/Branding';
import { PageBackground } from '../../components/visuals/AnimatedBackgrounds';

const PILLARS = [
  { icon: <ScanEye size={18} />, t: 'AI-assisted inspection', d: 'DantaDrishti captures geo-tagged, timestamped, hash-sealed evidence and auto-scores it against norms.' },
  { icon: <ShieldCheck size={18} />, t: 'Evidence & integrity', d: 'Chain-of-custody on every artefact; low-confidence detections always go to a human.' },
  { icon: <FileCheck2 size={18} />, t: 'Compliance engine', d: 'Every proforma row evaluated as a rule producing Compliant / Deficient verdicts and a risk score.' },
  { icon: <Gavel size={18} />, t: 'Decision traceability', d: 'EC decisions use a fixed vocabulary; AI never approves or rejects on its own.' },
];

export function About() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-12">
      <PageBackground variant="about" />
      <div className="gov-card-solid relative overflow-hidden p-8 tex-proforma">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GovEmblems size={48} />
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">About DantaDrishti</h1>
              <p className="text-sm text-ink-muted">Ministry of Ayush · Government of India · NDC / DARB</p>
            </div>
          </div>
          <AnuvadiniBadge />
        </div>
        <p className="mt-4 max-w-3xl text-ink-soft">
          DantaDrishti is the digital approval, inspection and recognition platform for dental education in India. It
          replaces a paper- and meeting-driven process with a governed state machine, an AI video-inspection layer, and a
          compliance rule engine — applying the <b className="text-ink">DCI Regulations 2006</b> while operating under the{' '}
          <b className="text-ink">National Dental Commission / Dental Assessment & Rating Board</b>.
        </p>
      </div>

      <SectionHead className="mt-10" center eyebrow="What we stand for" title="Trust · Compliance · Evidence · Decision" />
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {PILLARS.map((p, i) => (
          <motion.div key={p.t} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="gov-card-solid p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-teal-soft text-teal-dark">{p.icon}</div>
            <h3 className="font-display text-base font-bold text-ink">{p.t}</h3>
            <p className="mt-1 text-sm text-ink-soft">{p.d}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="gov-card-solid p-5">
          <Landmark className="text-royal" size={20} />
          <h3 className="mt-2 font-display text-base font-bold text-ink">Governance & auditability</h3>
          <p className="mt-1 text-sm text-ink-soft">Every state transition is append-only and attributable — actor, role, from/to state, reason and timestamp — for full transparency and §16A defensibility.</p>
        </div>
        <div className="gov-card-solid p-5">
          <Languages className="text-saffron-deep" size={20} />
          <h3 className="mt-2 font-display text-base font-bold text-ink">Anuvadini AI · language access</h3>
          <p className="mt-1 text-sm text-ink-soft">Anuvadini AI partners the platform to widen language accessibility for applicants and officers across India.</p>
        </div>
      </div>
    </div>
  );
}
