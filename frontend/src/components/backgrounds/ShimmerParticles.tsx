import { useMemo, CSSProperties } from 'react';

/**
 * ShimmerParticles — a premium, GPU-light particle field.
 *
 * A scattered field of fine particles that twinkle (opacity + scale) and drift
 * slowly upward, each with a soft glow.
 *
 * Animated with pure CSS keyframes (compositor thread) — NOT framer/rAF — so the
 * field never stutters while the page is scrolling. pointer-events:none, and the
 * global prefers-reduced-motion rule in index.css freezes it.
 */

type Tone = 'light' | 'dark';

const PALETTES: Record<Tone, string[]> = {
  // Institutional teal / royal / saffron / gold on light paper.
  light: ['rgba(13,92,92,0.55)', 'rgba(29,78,216,0.5)', 'rgba(234,115,23,0.45)', 'rgba(184,134,11,0.5)'],
  // Brighter cyan / violet / emerald on dark hero.
  dark: ['rgba(34,211,238,0.7)', 'rgba(167,139,250,0.65)', 'rgba(52,211,153,0.6)', 'rgba(255,255,255,0.55)'],
};

/** Deterministic pseudo-random in [0,1) so SSR/CSR and re-renders stay stable. */
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function ShimmerParticles({
  count = 36,
  tone = 'light',
  className = '',
}: {
  count?: number;
  tone?: Tone;
  className?: string;
}) {
  const palette = PALETTES[tone];
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const color = palette[i % palette.length];
        const size = 2.5 + rand(i + 1) * 5; // 2.5–7.5px
        return {
          left: rand(i + 11) * 100,
          top: rand(i + 23) * 100,
          size,
          color,
          drift: 24 + rand(i + 31) * 46, // px of upward drift
          dur: 4.5 + rand(i + 47) * 6, // 4.5–10.5s twinkle cycle
          delay: rand(i + 59) * 6,
          maxOpacity: 0.65 + rand(i + 67) * 0.35,
        };
      }),
    [count, palette],
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {particles.map((p, i) => (
        <span
          key={i}
          className="bg-particle absolute rounded-full"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 3.5}px ${p.color}`,
              '--op': p.maxOpacity,
              '--drift': `${-p.drift}px`,
              '--dur': `${p.dur}s`,
              '--delay': `${p.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
