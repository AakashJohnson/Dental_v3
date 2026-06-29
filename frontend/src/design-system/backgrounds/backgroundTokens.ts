/**
 * Background design tokens — the shared palette, opacities, blur radii and
 * timing used by the layered animated background system. Kept calm and
 * government-grade (blue / teal / saffron only; no neon).
 */
export const BG_COLORS = {
  auroraTeal: 'rgba(13,92,92,0.30)',
  auroraRoyal: 'rgba(29,78,216,0.26)',
  auroraSaffron: 'rgba(234,115,23,0.16)',
  gridLine: 'rgba(13,92,92,0.09)',
  node: 'rgba(13,92,92,0.5)',
  nodeRoyal: 'rgba(29,78,216,0.5)',
  scan: 'rgba(34,211,238,0.22)',
  paper: 'rgba(28,39,51,0.04)',
  statusLow: 'rgba(21,128,61,0.5)',
  statusMed: 'rgba(234,115,23,0.5)',
  statusHigh: 'rgba(220,38,38,0.5)',
} as const;

export const BG_OPACITY = {
  texture: 0.5,
  watermark: 0.06,
  grid: 0.7,
  nodes: 1,
  aurora: 1,
} as const;

export const BG_BLUR = {
  aurora: 64,
  soft: 24,
} as const;

export const BG_DURATION = {
  aurora: 20,
  grid: 6,
  scan: 4.5,
  pulse: 3.6,
  float: 6.5,
} as const;
