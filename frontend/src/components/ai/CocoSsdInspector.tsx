import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Square, ScanLine, Cctv, Loader2, Upload } from 'lucide-react';

/** Minimal COCO-SSD detection shape (loaded from CDN at runtime). */
interface DetectedObject {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}
interface CocoModel {
  detect: (input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => Promise<DetectedObject[]>;
}

// TensorFlow.js + COCO-SSD are loaded as UMD globals from the app's own
// /vendor/ folder (self-hosted) so they never go through the bundler — which
// avoids CJS/ESM transform issues and keeps everything offline-friendly.
const TFJS_SRC = '/vendor/tf.min.js';
const COCO_SRC = '/vendor/coco-ssd.min.js';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = 'true';
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

/** One COCO class aggregated across the analysed video. */
export interface DetectionAggregate {
  label: string;
  peakCount: number; // max simultaneous detections in a single frame
  bestScore: number; // best confidence observed (0–1)
  frames: number; // frames the class appeared in
}

export interface DetectionSummary {
  source: string;
  framesAnalyzed: number;
  durationMs: number;
  aggregates: DetectionAggregate[];
}

const DEMO_VIDEOS = [1, 2, 3, 4, 5].map((n) => ({
  name: `dental_clinic_${n}.mp4`,
  src: `/demo/dental_clinic_${n}.mp4`,
}));

// COCO classes worth surfacing for a dental-clinic walkthrough.
const TRACKED = new Set([
  'person',
  'chair',
  'bed',
  'tv',
  'laptop',
  'keyboard',
  'mouse',
  'cell phone',
  'book',
  'bottle',
  'sink',
  'potted plant',
]);

const BOX_COLORS: Record<string, string> = {
  person: '#16a34a',
  chair: '#2563eb',
  bed: '#9333ea',
  default: '#f59e0b',
};

/**
 * CocoSsdInspector — runs the COCO-SSD object-detection model fully in the
 * browser (TensorFlow.js / WebGL) over a demo or uploaded dental-clinic video,
 * draws live bounding boxes, and aggregates detections into a structured
 * summary that the AI inspection then turns into findings.
 */
export function CocoSsdInspector({
  busy,
  onComplete,
}: {
  busy?: boolean;
  onComplete: (summary: DetectionSummary) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<CocoModel | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRunRef = useRef(0);
  const startedAtRef = useRef(0);
  const aggRef = useRef<Map<string, DetectionAggregate>>(new Map());
  const framesRef = useRef(0);

  const [modelReady, setModelReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [minScore, setMinScore] = useState(0.5);
  const minScoreRef = useRef(0.5);
  const [source, setSource] = useState(DEMO_VIDEOS[0].src);
  const [sourceName, setSourceName] = useState(DEMO_VIDEOS[0].name);
  const [live, setLive] = useState<{ label: string; score: number }[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load TensorFlow.js + COCO-SSD from CDN (UMD globals) so a heavy/CJS bundle
  // can never block or break the app; only this stage pays the cost.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScript(TFJS_SRC);
        await loadScript(COCO_SRC);
        const cocoSsd = (window as unknown as { cocoSsd?: { load: (cfg?: unknown) => Promise<CocoModel> } }).cocoSsd;
        if (!cocoSsd) throw new Error('COCO-SSD global not available');
        const m = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (cancelled) return;
        modelRef.current = m;
        setModelReady(true);
      } catch (e) {
        if (!cancelled) setError(`Model load failed: ${(e as Error).message}`);
      }
    })();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const resetAggregates = useCallback(() => {
    aggRef.current = new Map();
    framesRef.current = 0;
    setAnalyzed(false);
  }, []);

  const draw = useCallback((preds: DetectedObject[]) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || canvas.clientWidth;
    canvas.height = video.videoHeight || canvas.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.font = '14px sans-serif';
    ctx.textBaseline = 'top';
    for (const p of preds) {
      if (!TRACKED.has(p.class) || p.score < minScoreRef.current) continue;
      const [x, y, w, h] = p.bbox;
      const color = BOX_COLORS[p.class] ?? BOX_COLORS.default;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.strokeRect(x, y, w, h);
      const label = `${p.class} ${(p.score * 100).toFixed(0)}%`;
      const tw = ctx.measureText(label).width + 8;
      ctx.fillRect(x, Math.max(0, y - 18), tw, 18);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + 4, Math.max(0, y - 17));
    }
  }, []);

  const aggregate = useCallback((preds: DetectedObject[]) => {
    const counts = new Map<string, { count: number; best: number }>();
    for (const p of preds) {
      if (!TRACKED.has(p.class) || p.score < minScoreRef.current) continue;
      const c = counts.get(p.class) ?? { count: 0, best: 0 };
      c.count += 1;
      c.best = Math.max(c.best, p.score);
      counts.set(p.class, c);
    }
    for (const [label, c] of counts) {
      const a = aggRef.current.get(label) ?? { label, peakCount: 0, bestScore: 0, frames: 0 };
      a.peakCount = Math.max(a.peakCount, c.count);
      a.bestScore = Math.max(a.bestScore, c.best);
      a.frames += 1;
      aggRef.current.set(label, a);
    }
    framesRef.current += 1;
    setLive(
      [...counts.entries()]
        .map(([label, c]) => ({ label, score: c.best }))
        .sort((x, y) => y.score - x.score),
    );
  }, []);

  const loop = useCallback(async () => {
    const video = videoRef.current;
    const model = modelRef.current;
    if (!video || !model || video.paused || video.ended) {
      setRunning(false);
      setAnalyzed(framesRef.current > 0);
      return;
    }
    const now = performance.now();
    // Throttle inference to ~6 fps to keep the UI responsive.
    if (now - lastRunRef.current > 160) {
      lastRunRef.current = now;
      try {
        const preds = await model.detect(video);
        draw(preds);
        aggregate(preds);
      } catch {
        /* transient detect error — keep looping */
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, aggregate]);

  const start = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !modelRef.current) return;
    setError(null);
    resetAggregates();
    try {
      await video.play();
      setRunning(true);
      startedAtRef.current = performance.now();
      lastRunRef.current = 0;
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      setError(`Could not play video: ${(e as Error).message}. Ensure the file exists under /public/demo/.`);
    }
  }, [loop, resetAggregates]);

  const stop = useCallback(() => {
    videoRef.current?.pause();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRunning(false);
    setAnalyzed(framesRef.current > 0);
  }, []);

  function pickDemo(src: string, name: string) {
    stop();
    setSource(src);
    setSourceName(name);
    resetAggregates();
    setLive([]);
  }

  function pickFile(file?: File) {
    if (!file) return;
    stop();
    const url = URL.createObjectURL(file);
    setSource(url);
    setSourceName(file.name);
    resetAggregates();
    setLive([]);
  }

  function finish() {
    const summary: DetectionSummary = {
      source: sourceName,
      framesAnalyzed: framesRef.current,
      durationMs: Math.round(performance.now() - startedAtRef.current),
      aggregates: [...aggRef.current.values()].sort((a, b) => b.peakCount - a.peakCount),
    };
    onComplete(summary);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <Cctv size={14} />
        <span>In-browser AI detection · COCO-SSD (TensorFlow.js)</span>
        {modelReady ? (
          <span className="ml-auto rounded-full bg-compliance-soft px-2 py-0.5 font-semibold text-compliance">Model ready</span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1 text-ink-muted">
            <Loader2 size={12} className="animate-spin" /> Loading model…
          </span>
        )}
      </div>

      {/* Source picker */}
      <div className="flex flex-wrap items-center gap-1.5">
        {DEMO_VIDEOS.map((v) => (
          <button
            key={v.src}
            type="button"
            onClick={() => pickDemo(v.src, v.name)}
            className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
              source === v.src ? 'border-teal bg-teal-soft text-teal-dark' : 'border-teal/20 bg-white text-ink-soft hover:bg-teal-soft/60'
            }`}
          >
            {v.name.replace('dental_clinic_', 'Clip ').replace('.mp4', '')}
          </button>
        ))}
        <label className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-teal/30 bg-white px-2 py-1 text-[11px] font-semibold text-teal-dark hover:bg-teal-soft">
          <Upload size={12} /> Upload clip
          <input type="file" accept="video/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        </label>
      </div>

      {/* Confidence threshold */}
      <div className="flex items-center gap-2 text-[11px] text-ink-muted">
        <span className="font-semibold uppercase tracking-wide">Min confidence</span>
        <input
          type="range"
          min={0.2}
          max={0.9}
          step={0.05}
          value={minScore}
          onChange={(e) => {
            const v = Number(e.target.value);
            setMinScore(v);
            minScoreRef.current = v;
          }}
          className="h-1 flex-1 accent-teal"
        />
        <span className="w-9 text-right font-semibold text-ink">{Math.round(minScore * 100)}%</span>
      </div>

      {/* Video + detection overlay */}
      <div className="relative overflow-hidden rounded-xl border border-teal/15 bg-black">
        <video
          ref={videoRef}
          src={source}
          className="block max-h-72 w-full object-contain"
          muted
          playsInline
          onEnded={stop}
          crossOrigin="anonymous"
        />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        {running && (
          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            <ScanLine size={12} className="animate-pulse" /> Detecting…
          </div>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-risk-high">{error}</div>}

      {/* Live detections */}
      {live.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {live.map((d) => (
            <span key={d.label} className="rounded-full bg-ivory-200/70 px-2 py-0.5 text-[11px] text-ink-soft">
              {d.label} · {(d.score * 100).toFixed(0)}%
            </span>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!running ? (
          <button
            type="button"
            disabled={!modelReady}
            onClick={start}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal-soft px-3 py-1.5 text-xs font-semibold text-teal-dark hover:bg-teal/10 disabled:opacity-50"
          >
            <Play size={13} /> Run detection
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1.5 rounded-lg border border-risk-high/30 bg-red-50 px-3 py-1.5 text-xs font-semibold text-risk-high hover:bg-red-100"
          >
            <Square size={13} /> Stop
          </button>
        )}
        <span className="text-[11px] text-ink-muted">{framesRef.current} frames analysed</span>
        <button
          type="button"
          disabled={!analyzed || busy}
          onClick={finish}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal to-teal-dark px-3 py-1.5 text-xs font-semibold text-white shadow disabled:opacity-50"
        >
          {busy ? 'Generating…' : 'Finish inspection & generate AI report'}
        </button>
      </div>
    </div>
  );
}
