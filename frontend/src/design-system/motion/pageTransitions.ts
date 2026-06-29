import type { Variants } from 'framer-motion';
import { DURATION, EASE } from './motionTokens';

/** Route-level page transition: fade + subtle upward motion. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 14, filter: 'blur(4px)' },
  enter: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: DURATION.slow, ease: EASE.out, when: 'beforeChildren', staggerChildren: 0.06 },
  },
  exit: { opacity: 0, y: -10, filter: 'blur(3px)', transition: { duration: DURATION.fast, ease: EASE.out } },
};

/** Generic section container that staggers its children in. */
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Child item for staggered grids/lists. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
};

/** Hero headline word/line reveal. */
export const heroReveal: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: DURATION.slower, ease: EASE.out } },
};
