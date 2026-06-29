import { useRef } from 'react';
import { useMotionValue, useSpring, useTransform, type MotionStyle } from 'framer-motion';
import { prefersReducedMotion } from '../motion/motionTokens';

/**
 * useTilt3D — pointer-driven 3D tilt for cards. Returns a ref, mouse handlers,
 * and a Framer Motion `style` (rotateX/rotateY + perspective). GPU-friendly
 * (transform only) and disabled when the user prefers reduced motion.
 *
 *   const t = useTilt3D(8);
 *   <motion.div ref={t.ref} onMouseMove={t.onMouseMove} onMouseLeave={t.onMouseLeave} style={t.style} />
 */
export function useTilt3D(max = 8, lift = 6) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const z = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18, mass: 0.6 });
  const sz = useSpring(z, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(srx, (v) => `${v}deg`);
  const rotateY = useTransform(sry, (v) => `${v}deg`);

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
    z.set(lift);
  };
  const onMouseLeave = () => {
    rx.set(0);
    ry.set(0);
    z.set(0);
  };

  const style: MotionStyle = {
    rotateX,
    rotateY,
    translateZ: sz,
    transformPerspective: 900,
    transformStyle: 'preserve-3d',
  };

  return { ref, onMouseMove, onMouseLeave, style };
}
