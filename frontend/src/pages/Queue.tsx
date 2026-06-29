import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FilePlus2 } from 'lucide-react';
import { api } from '../lib/api';
import { GlassPanel, StatusPill } from '../design-system/components';
import { workflowLabels } from '../design-system/tokens';

export interface QueueConfig {
  title: string;
  subtitle: string;
  endpoint: string;
  createPath?: string;
  createLabel?: string;
}

/** Generic role queue — lists applications at the role's active stage. */
export function Queue({ config }: { config: QueueConfig }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['queue', config.endpoint],
    queryFn: () => api.get<any[]>(config.endpoint),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{config.title}</h1>
          <p className="mt-1 text-ink-soft">{config.subtitle}</p>
        </div>
        {config.createPath && (
          <Link
            to={config.createPath}
            className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-teal-dark"
          >
            <FilePlus2 size={16} /> {config.createLabel ?? 'New'}
          </Link>
        )}
      </div>

      {isLoading && <div className="text-ink-muted">Loading…</div>}
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-risk-high">{(error as Error).message}</div>}

      <GlassPanel className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-teal-soft text-xs uppercase tracking-wider text-teal-dark">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-teal/8">
            {(data ?? []).map((a) => (
              <tr key={a.id} className="hover:bg-teal-soft/40">
                <td className="px-4 py-3 font-medium text-ink">{a.code}</td>
                <td className="px-4 py-3 text-ink-soft">{workflowLabels[a.workflowType] ?? a.workflowType}</td>
                <td className="px-4 py-3">
                  <StatusPill state={a.state} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/app/application/${a.id}`} className="font-semibold text-teal-dark hover:underline">
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                  Queue is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}
