/**
 * Tilt-effect class constants → CSS utilities in src/index.css.
 * For lightweight CSS-only 3D tilt where the JS `useTilt3D` hook is overkill.
 */
export const tilt = {
  /** 3D perspective container — required parent for `.tilt-3d` children. */
  scene: 'scene-3d',
  /** CSS-only hover tilt + lift. */
  card: 'tilt-3d',
  /** Stronger tilt for hero/feature panels. */
  feature: 'tilt-3d tilt-3d-strong',
  /** Floating idle animation (gentle vertical drift). */
  float: 'floaty',
  /** Layered depth shadow. */
  depth: 'depth-shadow',
} as const;

export type TiltKey = keyof typeof tilt;
