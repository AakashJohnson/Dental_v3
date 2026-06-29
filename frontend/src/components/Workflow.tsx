import { motion } from 'framer-motion';
import { workflowOrder, stateColors, stateLabels } from '../design-system/tokens';
import { GlassPanel } from '../design-system/components';

/** Compact horizontal stepper showing the pipeline + deficiency loop. */
export function WorkflowStepper({ current }: { current: string }) {
  const idx = workflowOrder.indexOf(current);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {workflowOrder.map((s, i) => {
        const done = idx >= 0 && i < idx;
        const active = s === current;
        const color = stateColors[s];
        return (
          <div key={s} className="flex items-center gap-1.5">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                color: active || done ? color : '#64748b',
                background: active ? `${color}1f` : 'transparent',
                border: `1px solid ${active ? color + '66' : 'rgba(13,92,92,0.12)'}`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: active || done ? color : '#94a3b8' }}
              />
              {stateLabels[s]}
            </motion.div>
            {i < workflowOrder.length - 1 && (
              <span className="text-teal/30">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** NextActionCard — always tells the user what to do next + who is responsible. */
export function NextActionCard({
  guidance,
}: {
  guidance?: {
    state: string;
    responsibleRole: string;
    message: string;
    nextActions: { action: string; to: string; description: string }[];
  };
}) {
  if (!guidance) return null;
  return (
    <GlassPanel luminous className="p-5">
      <div className="text-xs uppercase tracking-wider text-teal-dark">Next action</div>
      <p className="mt-2 text-sm text-ink">{guidance.message}</p>
      <div className="mt-3 text-xs text-ink-muted">
        Currently responsible:{' '}
        <span className="font-semibold text-teal-dark">{guidance.responsibleRole}</span>
      </div>
      {guidance.nextActions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {guidance.nextActions.map((a) => (
            <li key={a.action + a.to} className="rounded-lg bg-ivory-200/70 px-3 py-2 text-xs text-ink-soft">
              <span className="font-semibold text-ink">{a.action}</span> → {a.to}
              <div className="text-ink-muted">{a.description}</div>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}

export function BlockedReasonAlert({ reason }: { reason: string }) {
  return (
    <div className="rounded-xl border border-saffron/30 bg-saffron-soft px-4 py-3 text-sm text-saffron-deep">
      <span className="font-semibold">Blocked:</span> {reason}
    </div>
  );
}
