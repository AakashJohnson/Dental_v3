import { motion } from 'framer-motion';
import { ScanEye, FileCheck2, ShieldAlert, Workflow, Lock, BadgeCheck } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: <ScanEye size={18} />, label: 'Real-time AI Inspection' },
  { icon: <FileCheck2 size={18} />, label: 'Evidence Based Availability' },
  { icon: <ShieldAlert size={18} />, label: 'Risk Based Assessment' },
  { icon: <Workflow size={18} />, label: 'End-to-End Digital Workflow' },
  { icon: <Lock size={18} />, label: 'Secure & Transparent' },
  { icon: <BadgeCheck size={18} />, label: 'Government Approved Process' },
];

/** KeyHighlightStrip — light horizontal strip with line-style icons + hover glow. */
export function KeyHighlightStrip() {
  return (
    <div className="rounded-2xl border border-teal/12 bg-white/80 p-3 shadow-card backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <span className="shrink-0 rounded-lg bg-teal-soft px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-teal-dark">
          Key Highlights
        </span>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {HIGHLIGHTS.map((h, i) => (
            <motion.div
              key={h.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="group flex items-center gap-2 rounded-xl px-2.5 py-2 transition hover:bg-teal-soft/60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-teal/20 text-teal-dark transition group-hover:border-royal group-hover:text-royal group-hover:shadow-glow">
                {h.icon}
              </span>
              <span className="text-[11px] font-semibold leading-tight text-ink-soft transition group-hover:text-ink">{h.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
