import type { Variants } from 'framer-motion';
import { DURATION, EASE, SPRING } from './motionTokens';

/**
 * Framer Motion hover/tap variants. Pair with the CSS hover utility classes
 * in index.css (hover-lift, hover-glow, hover-shine, …) for layered effects.
 */

export const hoverLift = {
  rest: { y: 0, scale: 1, transition: { duration: DURATION.fast, ease: EASE.out } },
  hover: { y: -8, scale: 1.012, transition: { duration: DURATION.base, ease: EASE.out } },
  tap: { scale: 0.985, transition: SPRING.press },
};

export const hoverPop = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: SPRING.pop },
  tap: { scale: 0.96, transition: SPRING.press },
};

export const hoverGlowCard: Variants = {
  rest: { boxShadow: '0 1px 2px rgba(16,40,40,0.04), 0 12px 32px -16px rgba(13,92,92,0.22)' },
  hover: { boxShadow: '0 0 0 1px rgba(13,92,92,0.18), 0 22px 60px -22px rgba(13,92,92,0.45)' },
};

export const riskPulse: Variants = {
  rest: { boxShadow: '0 0 0 0 rgba(220,38,38,0)' },
  pulse: {
    boxShadow: ['0 0 0 0 rgba(220,38,38,0.45)', '0 0 0 10px rgba(220,38,38,0)', '0 0 0 0 rgba(220,38,38,0)'],
    transition: { duration: 2.2, ease: EASE.inOut, repeat: Infinity },
  },
};

/** Magnetic button: combine with onMouseMove offset for stronger effect. */
export const magneticButton = {
  rest: { scale: 1, transition: SPRING.gentle },
  hover: { scale: 1.04, transition: SPRING.pop },
  tap: { scale: 0.95, transition: SPRING.press },
};

/** Arrow that slides on parent hover (use whileHover on the parent). */
export const arrowSlide: Variants = {
  rest: { x: 0 },
  hover: { x: 5, transition: { duration: DURATION.fast, ease: EASE.out } },
};

/** Image zoom for image-backed cards. */
export const imageZoom: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.06, transition: { duration: DURATION.slow, ease: EASE.out } },
};
