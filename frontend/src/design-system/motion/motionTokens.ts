/**
 * Central motion tokens for the DantaDrishti motion system.
 * All durations are in seconds (Framer Motion convention).
 * Keep timings calm and government-grade — visible but never frantic.
 */

export const DURATION = {
  instant: 0.12,
  fast: 0.22,
  base: 0.4,
  slow: 0.6,
  slower: 0.9,
  cinematic: 1.4,
} as const;

export const EASE = {
  /** Smooth premium ease-out for entrances. */
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  /** Gentle ease-in-out for ambient loops. */
  inOut: [0.45, 0, 0.55, 1] as [number, number, number, number],
  /** Snappy ease for hover/press feedback. */
  snappy: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
} as const;

export const SPRING = {
  soft: { type: 'spring', stiffness: 180, damping: 22, mass: 0.9 },
  pop: { type: 'spring', stiffness: 380, damping: 24 },
  gentle: { type: 'spring', stiffness: 120, damping: 18 },
  press: { type: 'spring', stiffness: 600, damping: 30 },
} as const;

/** Respects the user's reduced-motion preference at runtime. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Standard viewport config for scroll-triggered reveals. */
export const VIEWPORT = { once: true, amount: 0.25 } as const;
