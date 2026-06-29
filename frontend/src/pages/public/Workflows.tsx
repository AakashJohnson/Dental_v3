import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { SectionHead, GlassPanel } from '../../design-system/components';
import { WORKFLOWS } from '../../data/content';
import { fadeUp } from '../../design-system/motion';
import { ChartCard, WorkflowFunnel, DonutChartCard } from '../../components/charts';
import { WORKFLOW_FUNNEL, WORKFLOW_DISTRIBUTION } from '../../data/demoWorkflowStats';
import { PhotoImage } from '../../components/visuals/PhotoImage';
import { PageBackground } from '../../components/visuals/AnimatedBackgrounds';
import { hx } from '../../design-system/effects/hoverEffects';

export function Workflows() {
  return (
    <div className="relative mx-auto max-w-7xl px-4 py-12">
      <PageBackground variant="workflows" />
      <SectionHead eyebrow="7 inspection types" title="Approval & inspection workflows" subtitle="One state machine serves all seven workflow types, with per-workflow eligibility, forms, focus and outcomes." />

      {/* Field-inspection hero band */}
      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        <div className={`lg:col-span-1 ${hx.card} hover-image-zoom rounded-2xl`}>
          <PhotoImage photo="fieldInspection" alt="Assessor and observer conducting a dental college field inspection with AI evidence capture" className="h-full min-h-[220px] shadow-card-lg">
            <div className="text-sm font-bold text-white">Assessor & observer field inspection</div>
          </PhotoImage>
        </div>
        <ChartCard title="Live pipeline funnel" subtitle="Draft → Approved across all workflows"><WorkflowFunnel data={WORKFLOW_FUNNEL} /></ChartCard>
        <ChartCard title="Workflow distribution" subtitle="Active applications by type"><DonutChartCard data={WORKFLOW_DISTRIBUTION} height={240} /></ChartCard>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {WORKFLOWS.map((w, i) => (
          <motion.div key={w.id} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
            <GlassPanel className={`h-full p-6 ${hx.card} hover-shine`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal text-lg font-bold text-white">{w.no}</div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">{w.title}</h3>
                    <div className="text-xs text-ink-muted">{w.anchor}</div>
                  </div>
                </div>
                {w.no === 7 && <span className="rounded-md bg-saffron-soft px-2 py-1 text-[10px] font-bold text-saffron-deep">SYSTEM ONLY</span>}
              </div>
              <p className="mt-3 text-sm text-ink-soft"><span className="font-semibold text-ink">Eligibility:</span> {w.eligibility}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-teal-dark">Forms</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {w.forms.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 rounded-md bg-royal-soft px-2 py-0.5 text-[11px] font-medium text-royal-dark"><FileText size={11} />{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-teal-dark">Responsible roles</div>
                  <div className="mt-1 text-[12px] text-ink-soft">{w.roles.join(' · ')}</div>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-ivory-200/60 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-teal-dark">Inspection focus</div>
                <p className="mt-1 text-[13px] text-ink-soft">{w.inspectionFocus}</p>
              </div>
              <div className="mt-3 flex items-start gap-2 text-sm">
                <CheckCircle2 size={16} className="mt-0.5 text-compliance" />
                <span className="text-ink-soft"><span className="font-semibold text-ink">Outcome:</span> {w.outcome}</span>
              </div>
              {w.bankGuarantee && <div className="mt-2 text-[12px] text-maroon"><span className="font-semibold">Bank guarantee:</span> {w.bankGuarantee}</div>}
            </GlassPanel>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Link to="/process" className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-white hover:bg-teal-dark">
          See the full process timeline <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
