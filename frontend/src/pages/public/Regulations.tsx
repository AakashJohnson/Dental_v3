import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Download } from 'lucide-react';
import { SectionHead } from '../../design-system/components';
import { REGULATIONS } from '../../data/content';
import { ChartCard, RadarChartCard } from '../../components/charts';
import { COMPLIANCE_RADAR } from '../../data/demoWorkflowStats';
import { PhotoImage } from '../../components/visuals/PhotoImage';
import { PageBackground } from '../../components/visuals/AnimatedBackgrounds';
import { hx } from '../../design-system/effects/hoverEffects';

export function Regulations() {
  const [q, setQ] = useState('');
  const filtered = useMemo(
    () => REGULATIONS.filter((r) => `${r.code} ${r.title} ${r.body}`.toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-12">
      <PageBackground variant="documents" />
      <SectionHead eyebrow="DCI Regulations 2006" title="Regulations & norms library" subtitle="Statutory anchors for eligibility, application, inspection, permission and recognition." />

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className={`${hx.documentCard} hover-image-zoom rounded-2xl`}>
          <PhotoImage photo="proforma" alt="Official regulations and proforma archive documents on a government desk" className="h-full min-h-[260px] shadow-card-lg">
            <div className="text-sm font-bold text-white">Official statutory archive</div>
          </PhotoImage>
        </div>
        <ChartCard title="Norm compliance coverage" subtitle="Aggregate adherence by regulatory domain"><RadarChartCard data={COMPLIANCE_RADAR} height={260} /></ChartCard>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-teal/20 bg-white px-3 py-2 shadow-card">
        <Search size={16} className="text-ink-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search regulations, forms, norms…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {filtered.map((r, i) => (
          <motion.div key={r.code} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
            className={`gov-card-solid p-5 seal-ring ${hx.documentCard} hover-shine`}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-maroon/10 px-2 py-0.5 text-[11px] font-bold text-maroon"><BookOpen size={12} /> {r.code}</span>
              <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-dark hover:underline"><Download size={12} /> PDF</button>
            </div>
            <h3 className="mt-2 font-display text-base font-bold text-ink">{r.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{r.body}</p>
          </motion.div>
        ))}
        {filtered.length === 0 && <div className="col-span-2 py-12 text-center text-ink-muted">No regulations match “{q}”.</div>}
      </div>
    </div>
  );
}
