import type { Variants } from 'framer-motion';
import { EASE } from './motionTokens';

/**
 * 3D entrance/idle variants. Used for cinematic, depth-aware reveals.
 * All transforms are GPU-friendly (rotate/translate/opacity only).
 */

/** Card flips up from a slight backward 3D tilt into place. */
export const reveal3D: Variants = {
  hidden: { opacity: 0, y: 28, rotateX: -12, transformPerspective: 900 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: EASE.out },
  }),
};

/** Staggered container for 3D card grids. */
export const stagger3D: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** Hero panel rises with depth + subtle rotateY. */
export const heroDepth: Variants = {
  hidden: { opacity: 0, y: 36, rotateY: -8, transformPerspective: 1200 },
  show: { opacity: 1, y: 0, rotateY: 0, transition: { duration: 0.9, ease: EASE.out } },
};

/** Slow idle float for floating panels/badges. */
export const floatIdle: Variants = {
  show: {
    y: [0, -8, 0],
    transition: { duration: 5.5, repeat: Infinity, ease: EASE.inOut },
  },
};

/** Soft 3D pop on hover (for buttons/icons). */
export const pop3D = {
  rest: { scale: 1, rotateX: 0, rotateY: 0 },
  hover: { scale: 1.04, transition: { duration: 0.25, ease: EASE.snappy } },
  tap: { scale: 0.97 },
} as const;
