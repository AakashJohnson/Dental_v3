import type { Variants } from 'framer-motion';
import { DURATION, EASE, VIEWPORT } from './motionTokens';

/**
 * Scroll-reveal helpers. Use with:
 *   <motion.div variants={revealUp} initial="hidden" whileInView="show" viewport={scrollViewport}>
 */

export const scrollViewport = VIEWPORT;

export const revealUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE.out } },
};

export const revealLeft: Variants = {
  hidden: { opacity: 0, x: -34 },
  show: { opacity: 1, x: 0, transition: { duration: DURATION.slow, ease: EASE.out } },
};

export const revealRight: Variants = {
  hidden: { opacity: 0, x: 34 },
  show: { opacity: 1, x: 0, transition: { duration: DURATION.slow, ease: EASE.out } },
};

export const revealScale: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: DURATION.base, ease: EASE.out } },
};

/** Convenience props spread onto a motion element for a one-shot reveal. */
export const reveal = (variants: Variants = revealUp) => ({
  variants,
  initial: 'hidden' as const,
  whileInView: 'show' as const,
  viewport: scrollViewport,
});
