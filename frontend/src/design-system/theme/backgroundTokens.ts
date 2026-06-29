/**
 * Background theme tokens — the single source of truth for the clean, premium
 * government background system. Soft white/blue base, gentle radial glows, and
 * a barely-there paper texture. No noisy patterns, particles or scanlines.
 */
export const backgroundTokens = {
  /** Page base gradient (white → pale blue). */
  page: 'bg-gradient-to-b from-white via-[#f7faff] to-[#eef5ff]',
  /** Warm paper base for document/archive pages. */
  paper: 'bg-[#fffdf8]',
  /** Premium floating card surface. */
  card: 'bg-white/95 border border-slate-200/70 shadow-[0_18px_50px_rgba(15,23,42,0.08)]',
  /** Soft radial glows (use as background-image on an absolutely positioned div). */
  glowBlue: 'radial-gradient(circle, rgba(37,99,235,0.10), transparent 60%)',
  glowTeal: 'radial-gradient(circle, rgba(20,184,166,0.08), transparent 60%)',
  glowSaffron: 'radial-gradient(circle, rgba(245,158,11,0.07), transparent 60%)',
  /** Texture opacity cap — keep textures whisper-faint. */
  textureOpacity: '0.04',
} as const;

export type BackgroundTokens = typeof backgroundTokens;
