/**
 * Hover-effect class library. These string constants map to CSS utility
 * classes defined in src/index.css. Import and compose them on any element
 * so no major card/button/row ever feels static.
 *
 *   import { hx } from '../design-system/effects/hoverEffects';
 *   <div className={`gov-card-solid ${hx.card}`}>…</div>
 */

export const hx = {
  /** Lift + shadow expansion on hover. */
  lift: 'hover-lift',
  /** Soft teal border + glow halo on hover. */
  glow: 'hover-glow',
  /** Diagonal shine sweep across the surface on hover. */
  shine: 'hover-shine',
  /** Zooms a child <img>/bg with class `hx-img` on hover. */
  imageZoom: 'hover-image-zoom',
  /** Animated scanning border on hover. */
  borderScan: 'hover-border-scan',
  /** Subtle 3D tilt on hover. */
  softTilt: 'hover-soft-tilt',
  /** Stat number pop on hover. */
  statPop: 'hover-stat-pop',

  // Domain-specific composites (each bundles a base + accent).
  card: 'hover-lift hover-glow',
  mapCard: 'hover-map-card',
  dashboardCard: 'hover-dashboard-card',
  documentCard: 'hover-document-card hover-shine',
  riskCard: 'hover-risk-card',
  aiCard: 'hover-ai-card hover-border-scan',
  reportCard: 'hover-lift hover-glow hover-shine',
  navItem: 'hover-nav-item',
  row: 'hover-row',
  roleCard: 'hover-lift hover-glow hover-border-scan',
} as const;

export type HoverKey = keyof typeof hx;
