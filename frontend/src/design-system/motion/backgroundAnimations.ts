import type { Variants } from 'framer-motion';

/**
 * Looping ambient background animation variants. All are CSS-transform based
 * (no WebGL) and automatically frozen under prefers-reduced-motion via the
 * global media query in index.css.
 */

export const auroraDrift: Variants = {
  animate: {
    backgroundPosition: ['0% 0%', '100% 50%', '0% 100%', '0% 0%'],
    transition: { duration: 28, ease: 'linear', repeat: Infinity },
  },
};

export const gridScroll: Variants = {
  animate: {
    backgroundPositionY: ['0px', '38px'],
    transition: { duration: 6, ease: 'linear', repeat: Infinity },
  },
};

export const floatParticle = (delay = 0, distance = 16): Variants => ({
  animate: {
    y: [0, -distance, 0],
    x: [0, distance / 2, 0],
    opacity: [0.5, 1, 0.5],
    transition: { duration: 7 + delay, ease: 'easeInOut', repeat: Infinity, delay },
  },
});

export const scanSweep: Variants = {
  animate: {
    y: ['-120%', '120%'],
    opacity: [0, 1, 1, 0],
    transition: { duration: 3.4, ease: 'easeInOut', repeat: Infinity },
  },
};

export const nodePulse = (delay = 0): Variants => ({
  animate: {
    scale: [1, 1.4, 1],
    opacity: [0.35, 0.9, 0.35],
    transition: { duration: 2.6, ease: 'easeInOut', repeat: Infinity, delay },
  },
});

export const parallaxSilhouette: Variants = {
  animate: {
    x: [0, -18, 0],
    transition: { duration: 22, ease: 'easeInOut', repeat: Infinity },
  },
};
