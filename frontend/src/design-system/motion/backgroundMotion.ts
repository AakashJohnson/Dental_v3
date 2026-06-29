import type { Variants, Transition } from 'framer-motion';

/**
 * Shared Framer Motion presets for background layers. All transforms are
 * GPU-friendly (x/y/scale/opacity/rotate only). Reduced motion is handled
 * globally by the prefers-reduced-motion rule in index.css.
 */

export const auroraDrift = (dur = 20): Variants => ({
  animate: {
    x: [0, 30, -20, 0],
    y: [0, -24, 18, 0],
    scale: [1, 1.08, 0.96, 1],
    transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' },
  },
});

export const scanSweep = (dur = 4.5, delay = 0): Transition => ({
  duration: dur,
  delay,
  repeat: Infinity,
  ease: 'linear',
});

export const pulseRing = (dur = 3.6, delay = 0): Transition => ({
  duration: dur,
  delay,
  repeat: Infinity,
  ease: 'easeOut',
});

export const floatNode = (dur = 6.5, delay = 0): Transition => ({
  duration: dur,
  delay,
  repeat: Infinity,
  ease: 'easeInOut',
});

export const drawLine: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i = 0) => ({
    pathLength: 1,
    opacity: [0, 0.6, 0.3],
    transition: { duration: 3, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse', delay: i * 0.25 },
  }),
};
