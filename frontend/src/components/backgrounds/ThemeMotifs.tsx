import { CSSProperties } from 'react';

/**
 * ThemeMotifs — themed, low-opacity background patterns for a dental college
 * inspection platform: clinical dots (paperwork/brand), topographic contours
 * (geo-evidence) and radar scan rings (AI inspection). One motif is used per
 * page archetype (see PageBackground) so they never overlap or feel jumbled.
 * All are
 * pointer-events:none, GPU-light (CSS/SVG/Framer, no WebGL), and honour the
 * global prefers-reduced-motion rule in index.css.
 */

const layer = 'pointer-events-none absolute inset-0 overflow-hidden';

/* 🗺️ Topographic contours — layered survey/elevation rings. Evokes geo-tagged
 *    evidence, mapping and site distance checks. Used on Colleges / Reports. */
export function TopographicContours({ className = '' }: { className?: string }) {
  return (
    <div className={`${layer} ${className}`} aria-hidden>
      <div
        className="absolute inset-0 motif-contour-a"
        style={{
          backgroundImage:
            'repeating-radial-gradient(circle at 22% 28%, transparent 0 24px, rgba(13,92,92,0.07) 24px 25.5px, transparent 25.5px 27px)',
        }}
      />
      <div
        className="absolute inset-0 motif-contour-b"
        style={{
          backgroundImage:
            'repeating-radial-gradient(circle at 82% 72%, transparent 0 28px, rgba(29,78,216,0.06) 28px 29.5px, transparent 29.5px 31px)',
        }}
      />
    </div>
  );
}

/* 📡 Radar scan rings — concentric rings expanding and fading like an AI
 *    inspection sweep. Used on the AI Inspection page. */
export function RadarScanRings({ className = '' }: { className?: string }) {
  const foci = [
    { x: '24%', y: '32%', color: 'rgba(13,92,92,0.5)' },
    { x: '74%', y: '60%', color: 'rgba(29,78,216,0.45)' },
    { x: '52%', y: '84%', color: 'rgba(234,115,23,0.4)' },
  ];
  // CSS-keyframe driven (compositor thread) so the sweep never stutters on scroll.
  return (
    <div className={`${layer} ${className}`} aria-hidden>
      {foci.map((f, fi) =>
        [0, 1, 2].map((r) => (
          <span
            key={`${fi}-${r}`}
            className="bg-radar-ring absolute rounded-full border"
            style={
              {
                left: f.x,
                top: f.y,
                width: 40,
                height: 40,
                marginLeft: -20,
                marginTop: -20,
                borderColor: f.color,
                '--delay': `${fi * 1.1 + r * 2}s`,
              } as CSSProperties
            }
          />
        )),
      )}
      {/* faint crosshair centres */}
      {foci.map((f, fi) => (
        <span
          key={`c-${fi}`}
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{ left: f.x, top: f.y, marginLeft: -3, marginTop: -3, background: f.color }}
        />
      ))}
    </div>
  );
}

/* ⏚ Clinical dot halftone — fine perforated dot field like a medical proforma
 *    sheet. Calm and document-like; used on Login / Documents / Regulations. */
export function ClinicalDotHalftone({ className = '' }: { className?: string }) {
  return (
    <div className={`${layer} ${className}`} aria-hidden>
      <div
        className="absolute inset-0 motif-dots"
        style={{
          backgroundImage: 'radial-gradient(rgba(13,92,92,0.11) 1.4px, transparent 1.7px)',
          backgroundSize: '18px 18px',
        }}
      />
    </div>
  );
}
