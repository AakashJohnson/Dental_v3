/**
 * Glow-effect class constants → CSS utilities in src/index.css.
 * Compose onto cards/buttons for premium edge glow and shine.
 */
export const glow = {
  edge: 'glow-edge',
  edgeTeal: 'glow-edge-teal',
  edgeRoyal: 'glow-edge-royal',
  edgeRisk: 'glow-edge-risk',
  pulse: 'glow-pulse',
  shimmerBorder: 'shimmer-border',
} as const;

export type GlowKey = keyof typeof glow;
