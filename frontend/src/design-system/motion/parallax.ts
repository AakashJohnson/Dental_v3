import { useEffect } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { prefersReducedMotion } from './motionTokens';

/**
 * useMouseParallax — tracks pointer position over an element and returns
 * spring-smoothed offset motion values for layered depth. Multiply by a depth
 * factor via useTransform at the call site for each layer.
 *
 *   const p = useMouseParallax(20);
 *   <div onMouseMove={p.onMouseMove} onMouseLeave={p.onMouseLeave}>
 *     <motion.img style={{ x: p.x, y: p.y }} />
 *   </div>
 */
export function useMouseParallax(strength = 18) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 120, damping: 20, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 20, mass: 0.6 });

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * strength * 2);
    y.set(((e.clientY - r.top) / r.height - 0.5) * strength * 2);
  };
  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { onMouseMove, onMouseLeave, x: sx, y: sy };
}

/** Hook variant: subtle global device/scroll parallax for ambient backgrounds. */
export function useScrollParallax(distance = 60) {
  const y = useMotionValue(0);
  const sy = useSpring(y, { stiffness: 60, damping: 20 });
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const onScroll = () => y.set((window.scrollY % 600) / 600 * distance);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [y, distance]);
  return sy;
}
