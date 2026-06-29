import { motion } from 'framer-motion';
import { CleanGovernmentBackground } from '../backgrounds/CleanGovernmentBackground';
import { SubtleMapWatermark } from '../backgrounds/SubtleMapWatermark';
import { SoftDashboardDepth } from '../backgrounds/SoftDashboardDepth';
import { MinimalPaperTexture } from '../backgrounds/MinimalPaperTexture';
import { ShimmerParticles } from '../backgrounds/ShimmerParticles';
import { TopographicContours, RadarScanRings, ClinicalDotHalftone } from '../backgrounds/ThemeMotifs';

/**
 * Reusable animated background primitives. All are pointer-events:none,
 * fixed/absolute layers meant to sit behind content. CSS/SVG/Framer only —
 * no WebGL. The global prefers-reduced-motion rule in index.css freezes them.
 */

const layer = 'pointer-events-none absolute inset-0 overflow-hidden';

export function AnimatedGovernmentAurora({ className = '' }: { className?: string }) {
  // CSS-keyframe driven (compositor thread) so the drift never stutters on scroll.
  return (
    <div className={`${layer} ${className}`} aria-hidden>
      <div
        className="bg-aurora-blob bg-aurora-a absolute -left-1/4 -top-1/3 h-[60vh] w-[60vh] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(13,92,92,0.09), transparent 68%)' }}
      />
      <div
        className="bg-aurora-blob bg-aurora-b absolute right-[-15%] top-[-10%] h-[55vh] w-[55vh] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.08), transparent 68%)' }}
      />
      <div
        className="bg-aurora-blob bg-aurora-c absolute bottom-[-20%] left-1/3 h-[50vh] w-[50vh] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(234,115,23,0.06), transparent 68%)' }}
      />
    </div>
  );
}

export function MovingInspectionGrid({ className = '', opacity = 1 }: { className?: string; opacity?: number }) {
  return <div className={`${layer} bg-moving-grid ${className}`} style={{ opacity }} aria-hidden />;
}

/** Slow-rotating conic gradient — bold ambient color sweep. Oversized so its
 *  corners never enter the viewport while spinning. */
export function ConicRotateGlow({ className = '', opacity = 1 }: { className?: string; opacity?: number }) {
  return (
    <div className={`${layer} ${className}`} aria-hidden>
      <div
        className="bg-conic-rotate absolute left-1/2 top-1/2 h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ opacity }}
      />
    </div>
  );
}

export function ProformaPaperMotionTexture({ className = '' }: { className?: string }) {
  return <div className={`${layer} bg-paper-motion ${className}`} aria-hidden />;
}

export function FloatingDentalParticles({ count = 14, className = '' }: { count?: number; className?: string }) {
  const items = Array.from({ length: count });
  return (
    <div className={`${layer} ${className}`} aria-hidden>
      {items.map((_, i) => {
        const left = (i * 137.5) % 100;
        const size = 4 + ((i * 7) % 10);
        const delay = (i % 6) * 0.7;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${(i * 53) % 100}%`,
              width: size,
              height: size,
              background: i % 3 === 0 ? 'rgba(29,78,216,0.35)' : i % 3 === 1 ? 'rgba(13,92,92,0.3)' : 'rgba(234,115,23,0.3)',
            }}
            animate={{ y: [0, -28, 0], opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 8 + (i % 5), ease: 'easeInOut', repeat: Infinity, delay }}
          />
        );
      })}
    </div>
  );
}

export function MapPulseBackground({ className = '' }: { className?: string }) {
  const pts = [
    { x: 22, y: 30 }, { x: 70, y: 24 }, { x: 48, y: 52 }, { x: 30, y: 70 }, { x: 78, y: 66 }, { x: 60, y: 82 },
  ];
  return (
    <div className={`${layer} ${className}`} aria-hidden>
      {pts.map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-3 w-3 rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, background: 'rgba(13,92,92,0.5)' }}
          animate={{ scale: [1, 2.6, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
    </div>
  );
}

export function AIScanlineBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`${layer} ${className}`} aria-hidden>
      <motion.div
        className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-teal/15 to-transparent"
        initial={{ y: '-100%' }}
        animate={{ y: ['-100%', '420%'] }}
        transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity }}
      />
    </div>
  );
}

export function EvidenceNodeNetwork({ className = '' }: { className?: string }) {
  const nodes = [
    { x: 12, y: 20 }, { x: 38, y: 14 }, { x: 66, y: 28 }, { x: 88, y: 18 },
    { x: 24, y: 56 }, { x: 54, y: 48 }, { x: 80, y: 60 }, { x: 40, y: 80 }, { x: 70, y: 86 },
  ];
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 2], [5, 6], [4, 7], [7, 8], [8, 6]];
  return (
    <svg className={`${layer} ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(13,92,92,0.18)" strokeWidth="0.2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.6, 0.2] }}
          transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse', delay: i * 0.25 }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x} cy={n.y} r="0.7" fill="rgba(29,78,216,0.5)"
          animate={{ r: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </svg>
  );
}

export function DentalChairSilhouetteParallax({ className = '' }: { className?: string }) {
  return (
    <div className={`${layer} ${className}`} aria-hidden>
      <motion.svg
        viewBox="0 0 200 120"
        className="absolute bottom-0 left-0 h-40 w-auto opacity-[0.06]"
        animate={{ x: [0, -16, 0] }}
        transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }}
      >
        <path d="M20 100 Q24 60 50 58 L90 56 Q104 56 104 70 L104 92 Q104 100 96 100 Z" fill="#0d5c5c" />
        <rect x="40" y="40" width="10" height="40" rx="4" fill="#0d5c5c" />
        <circle cx="120" cy="40" r="10" fill="#0d5c5c" />
        <rect x="116" y="48" width="3" height="50" fill="#0d5c5c" />
      </motion.svg>
      <motion.svg
        viewBox="0 0 200 120"
        className="absolute bottom-0 right-0 h-56 w-auto opacity-[0.05]"
        animate={{ x: [0, 18, 0] }}
        transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity }}
      >
        <path d="M20 100 Q24 60 50 58 L90 56 Q104 56 104 70 L104 92 Q104 100 96 100 Z" fill="#1d4ed8" />
        <circle cx="120" cy="40" r="10" fill="#1d4ed8" />
      </motion.svg>
    </div>
  );
}

/**
 * PageBackground — a premium government backdrop. Bold base (rotating conic
 * sweep + drifting aurora glows) plus ONE theme motif chosen by page archetype
 * so motifs never overlap or feel jumbled:
 *   • clinical dots    → brand / marketing / dashboard / login / paperwork
 *   • topo contours    → colleges / reports (geo-evidence)
 *   • radar scan rings → AI inspection
 * Sits fixed behind everything (-z-10). Honours prefers-reduced-motion.
 */
type Variant =
  | 'public' | 'ai' | 'colleges' | 'workflows' | 'dashboard' | 'login'
  | 'reports' | 'process' | 'documents' | 'regulations' | 'about';

/** Exactly one themed motif per page — keeps each backdrop clean and on-theme. */
function ThemeMotif({ variant }: { variant: Variant }) {
  if (variant === 'ai') return <RadarScanRings />;
  if (variant === 'colleges' || variant === 'reports') return <TopographicContours />;
  return <ClinicalDotHalftone />; // public, about, workflows, process, dashboard, login
}

export function PageBackground({ variant = 'public' }: { variant?: Variant }) {
  const isPaper = variant === 'documents' || variant === 'regulations';
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Static base (deepest layer — no parallax). */}
      {isPaper ? <MinimalPaperTexture /> : <CleanGovernmentBackground />}

      {/* Paper pages stay calm: just the clinical dot motif over the paper texture. */}
      {isPaper && <ClinicalDotHalftone />}

      {/* Non-paper pages: clean base + their single theme motif (no color blobs). */}
      {!isPaper && <ThemeMotif variant={variant} />}

      {variant === 'dashboard' && <SoftDashboardDepth />}

      {(variant === 'reports' || variant === 'colleges') && <SubtleMapWatermark opacity={0.04} />}

      {/* Shimmering particle field on top of every non-paper backdrop. */}
      {!isPaper && <ShimmerParticles count={variant === 'dashboard' ? 34 : 46} tone="light" />}
    </div>
  );
}
