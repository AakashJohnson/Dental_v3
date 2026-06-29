import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTilt3D } from '../../design-system/effects/card3d';
import { reveal3D } from '../../design-system/motion/threeDVariants';

/**
 * Tilt3DCard — a reusable floating 3D card that tilts toward the pointer,
 * lifts with a layered depth shadow, and reveals on scroll. GPU-friendly and
 * reduced-motion safe (tilt is disabled by the hook when the user opts out).
 */
export function Tilt3DCard({
  children,
  className = '',
  max = 8,
  index = 0,
  glow = true,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  index?: number;
  glow?: boolean;
  as?: 'div' | 'article' | 'li';
}) {
  const t = useTilt3D(max);
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      ref={t.ref}
      onMouseMove={t.onMouseMove}
      onMouseLeave={t.onMouseLeave}
      style={t.style}
      variants={reveal3D}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      custom={index}
      className={`depth-shadow ${glow ? 'hover-glow' : ''} ${className}`}
    >
      <div style={{ transform: 'translateZ(40px)' }}>{children}</div>
    </MotionTag>
  );
}
