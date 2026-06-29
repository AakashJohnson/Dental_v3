import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Clock, FileCheck2 } from 'lucide-react';
import { SectionHead } from '../../design-system/components';
import { DOCUMENT_CHECKLIST, WORKFLOWS } from '../../data/content';
import { PhotoImage } from '../../components/visuals/PhotoImage';
import { PageBackground } from '../../components/visuals/AnimatedBackgrounds';
import { hx } from '../../design-system/effects/hoverEffects';
import { ChartCard, StackedBarChart, C } from '../../components/charts';
const REQ_VS_AVL = [
  { group: 'Statutory', available: 8, gap: 0 },
  { group: 'Land/Site', available: 4, gap: 1 },
  { group: 'Hospital', available: 3, gap: 0 },
  { group: 'Faculty', available: 5, gap: 1 },
  { group: 'Equipment', available: 3, gap: 1 },
  { group: 'Safety', available: 4, gap: 1 },
];

export function Documents() {
  const [active, setActive] = useState(WORKFLOWS[0].id);
  const groups = DOCUMENT_CHECKLIST[active] ?? [];
  return (
    <div className="relative mx-auto max-w-6xl px-4 py-12">
      <PageBackground variant="documents" />
      <SectionHead eyebrow="Statutory checklist" title="Documents by workflow type" subtitle="Required annexures, gating documents and validity tracking for each workflow." />

      {/* Document compliance centre band */}
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className={`${hx.documentCard} hover-image-zoom rounded-2xl`}>
          <PhotoImage photo="proforma" alt="Official inspection proforma with a tablet showing required vs available compliance table" className="aspect-[16/10] shadow-card-lg">
            <div className="text-sm font-bold text-white">Required vs Available · proforma mapping</div>
          </PhotoImage>
        </div>
        <ChartCard title="Document health" subtitle="Available vs gaps by group"><StackedBarChart data={REQ_VS_AVL} x="group" bars={[{ key: 'available', color: C.green }, { key: 'gap', color: C.saffron }]} height={240} /></ChartCard>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {WORKFLOWS.map((w) => (
          <button
            key={w.id}
            onClick={() => setActive(w.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              active === w.id ? 'bg-teal text-white shadow-glow' : 'border border-teal/20 bg-white text-teal-dark hover:bg-teal-soft'
            }`}
          >
            {w.no}. {w.title.split(' / ')[0].split(' (')[0]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {groups.map((g, gi) => (
          <motion.div key={g.group} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: gi * 0.05 }}
            className={`gov-card-solid p-5 ${hx.documentCard}`}>
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal-soft text-teal-dark"><FileCheck2 size={16} /></div>
              <h3 className="font-display text-base font-bold text-ink">{g.group}</h3>
            </div>
            <ul className="space-y-2">
              {g.items.map((it) => (
                <li key={it.name} className="flex items-start justify-between gap-2 rounded-lg border border-teal/8 bg-ivory-50 px-3 py-2 text-sm">
                  <span className="text-ink-soft">
                    {it.name}
                    {it.note && <span className="ml-1 text-[11px] text-ink-muted">({it.note})</span>}
                  </span>
                  {it.validity ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-saffron-soft px-2 py-0.5 text-[10px] font-semibold text-saffron-deep"><Clock size={10} /> validity</span>
                  ) : (
                    <ShieldCheck size={14} className="shrink-0 text-compliance" />
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-royal/15 bg-royal-soft/50 p-4 text-sm text-royal-dark">
        <b>Upload guidance:</b> documents must be in English or accompanied by certified translation. Gating documents
        (Essentiality, Affiliation, MOU, Bank Guarantee, Fire/AERB) block progression on expiry.
      </div>
    </div>
  );
}
