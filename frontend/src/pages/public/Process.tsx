import { motion } from 'framer-motion';
import { User2, Building2, ShieldCheck, RotateCcw } from 'lucide-react';
import { SectionHead } from '../../design-system/components';
import { PROCESS_STAGES } from '../../data/content';
import { stateColors } from '../../design-system/tokens';
import { ChartCard, StackedBarChart, C } from '../../components/charts';
import { SLA_AGING } from '../../data/demoWorkflowStats';
import { PhotoImage } from '../../components/visuals/PhotoImage';
import { PageBackground } from '../../components/visuals/AnimatedBackgrounds';
import { hx } from '../../design-system/effects/hoverEffects';

export function Process() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-12">
      <PageBackground variant="process" />
      <SectionHead center eyebrow="Draft → Approved" title="The inspection & approval process" subtitle="Strictly ordered statutory gates. The deficiency stage loops back through a system-generated Workflow 7 re-verification." />

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className={`${hx.card} hover-image-zoom rounded-2xl`}>
          <PhotoImage photo="fieldInspection" alt="Assessor and observer conducting a dental college field inspection" className="aspect-[16/10] shadow-card-lg">
            <div className="text-sm font-bold text-white">Field inspection & evidence capture</div>
          </PhotoImage>
        </div>
        <div className={`${hx.card} hover-image-zoom rounded-2xl`}>
          <PhotoImage photo="govDoc" alt="Government approval document workflow with LOI and LOP papers" className="aspect-[16/10] shadow-card-lg">
            <div className="text-sm font-bold text-white">LOI · LOP government decision</div>
          </PhotoImage>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        <ChartCard title="SLA performance by stage" subtitle="On-time vs at-risk vs breached cases"><StackedBarChart data={SLA_AGING} x="stage" bars={[{ key: 'onTime', color: C.green }, { key: 'atRisk', color: C.saffron }, { key: 'breached', color: C.maroon }]} height={260} /></ChartCard>
      </div>

      <div className="relative mt-10">
        <div className="absolute bottom-0 left-[19px] top-0 w-0.5 bg-teal/15 md:left-1/2" />
        <div className="space-y-5">
          {PROCESS_STAGES.map((s, i) => {
            const color = stateColors[s.state] ?? '#0d5c5c';
            const left = i % 2 === 0;
            const isLoop = s.state === 'DEFICIENCY';
            return (
              <motion.div
                key={s.state}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className={`relative md:grid md:grid-cols-2 md:gap-8 ${left ? '' : 'md:[direction:rtl]'}`}
              >
                <div className={`relative pl-12 md:pl-0 ${left ? 'md:pr-10 md:text-right' : 'md:pl-10 md:[direction:ltr]'}`}>
                  <span
                    className="absolute left-2 top-1.5 z-10 grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white md:left-auto md:right-[-14px]"
                    style={{ background: color, boxShadow: `0 0 0 4px ${color}22` }}
                  >
                    {i + 1}
                  </span>
                  {!left && <span className="absolute left-[-14px] top-1.5 z-10 hidden h-7 w-7 md:block" />}
                  <div className="gov-card-solid p-4 [direction:ltr]">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold" style={{ color }}>{s.label}</h3>
                      {isLoop && <RotateCcw size={15} className="text-saffron-deep" />}
                    </div>
                    <div className="mt-2 space-y-1.5 text-[13px]">
                      <p className="flex items-start gap-1.5 text-ink-soft"><User2 size={13} className="mt-0.5 text-royal" /><span><b className="text-ink">Acts:</b> {s.actor}</span></p>
                      <p className="flex items-start gap-1.5 text-ink-soft"><Building2 size={13} className="mt-0.5 text-saffron-deep" /><span><b className="text-ink">Applicant:</b> {s.applicant}</span></p>
                      <p className="flex items-start gap-1.5 text-ink-soft"><ShieldCheck size={13} className="mt-0.5 text-compliance" /><span><b className="text-ink">Regulator:</b> {s.regulator}</span></p>
                    </div>
                  </div>
                </div>
                <div />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
