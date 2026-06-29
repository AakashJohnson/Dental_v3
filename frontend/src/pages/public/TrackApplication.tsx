import { useEffect, useState } from 'react';
import { Search, FileSearch, AlertCircle } from 'lucide-react';
import { SectionHead, StatusPill, GlassPanel } from '../../design-system/components';
import { WorkflowRail } from '../../components/InspectionVisuals';
import { workflowLabels, stateLabels } from '../../design-system/tokens';
import { api } from '../../lib/api';
import { workflowOrder } from '../../design-system/tokens';

interface TrackResult {
  code: string;
  college: string;
  state?: string;
  workflowType: string;
  currentState: string;
  course: string;
  intake: number;
  history: { action: string; toState: string | null; timestamp: string }[];
}

export function TrackApplication() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState<string[]>([]);

  useEffect(() => {
    api
      .get<{ sampleCodes?: string[] }>('/public/stats')
      .then((s) => setSamples(s.sampleCodes ?? []))
      .catch(() => setSamples([]));
  }, []);

  async function runTrack(value: string) {
    if (!value.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await api.get<TrackResult>(`/public/track/${encodeURIComponent(value.trim())}`);
      setResult(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function track(e: React.FormEvent) {
    e.preventDefault();
    await runTrack(code);
  }

  const activeIdx = result ? workflowOrder.indexOf(result.currentState) : -1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <SectionHead center eyebrow="Public tracking" title="Track your application" subtitle="Enter your application reference code to see its current stage and history." />

      <form onSubmit={track} className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-xl border border-teal/20 bg-white p-2 shadow-card">
        <Search size={18} className="ml-2 text-ink-muted" />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. DD-481072" className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted" />
        <button type="submit" disabled={loading} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dark disabled:opacity-50">
          {loading ? 'Searching…' : 'Track'}
        </button>
      </form>

      {samples.length > 0 && (
        <div className="mx-auto mt-3 flex max-w-xl flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-ink-muted">Try a live demo code:</span>
          {samples.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setCode(s);
                void runTrack(s);
              }}
              className="rounded-full border border-teal/20 bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-dark transition hover:bg-teal hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-auto mt-4 flex max-w-xl items-center gap-2 rounded-xl border border-risk-high/20 bg-red-50 px-4 py-3 text-sm text-risk-high">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {result && (
        <GlassPanel className="mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-ink-muted"><FileSearch size={16} /><span className="text-sm font-semibold text-ink">{result.code}</span></div>
              <h3 className="mt-1 font-display text-lg font-bold text-ink">{result.college}</h3>
              <p className="text-sm text-ink-soft">{workflowLabels[result.workflowType] ?? result.workflowType} · {result.course} · {result.intake} seats · {result.state}</p>
            </div>
            <StatusPill state={result.currentState} />
          </div>

          <div className="mt-5 overflow-x-auto"><WorkflowRail active={activeIdx >= 0 ? Math.min(activeIdx, 9) : 0} /></div>

          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-teal-dark">History</div>
            <ol className="mt-2 space-y-2">
              {result.history.length === 0 && <li className="text-sm text-ink-muted">No transitions recorded yet.</li>}
              {result.history.map((h, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-teal/8 bg-ivory-50 px-3 py-2 text-sm">
                  <span className="text-ink">{h.toState ? stateLabels[h.toState] ?? h.toState : h.action}</span>
                  <span className="text-[11px] text-ink-muted">{new Date(h.timestamp).toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ol>
          </div>
        </GlassPanel>
      )}

      <p className="mt-6 text-center text-xs text-ink-muted">Tip: applicants see their reference code on the dashboard after login. Codes follow the pattern DD-XXXXXX.</p>
    </div>
  );
}
