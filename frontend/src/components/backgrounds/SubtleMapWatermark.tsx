/**
 * SubtleMapWatermark — a whisper-faint India outline used behind map/stat
 * sections only. Static, no markers, no pulses. Default opacity 0.05.
 */
const INDIA_PATH =
  'M50 6 C57 5 60 10 59 16 L66 17 C73 16 76 22 71 26 L77 30 C82 33 80 40 74 41 L79 50 C82 58 78 66 71 70 L66 82 C62 92 56 104 52 116 L49 110 C45 98 42 90 41 80 L33 76 C26 73 27 64 34 63 L28 55 C23 49 27 42 34 43 L31 34 C30 27 36 23 42 26 L43 16 C44 9 46 7 50 6 Z';

export function SubtleMapWatermark({ className = '', opacity = 0.05 }: { className?: string; opacity?: number }) {
  return (
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden ${className}`} aria-hidden>
      <svg viewBox="0 0 100 122" className="h-[115%] w-auto" style={{ opacity }}>
        <path d={INDIA_PATH} fill="none" stroke="#2563eb" strokeWidth="0.6" />
      </svg>
    </div>
  );
}
