import { motion } from 'framer-motion';

/**
 * SoftHeroGlow — one or two very soft, slowly drifting glow blobs used only in
 * hero / dashboard header areas. Elegant, low-opacity, never distracting.
 */
export function SoftHeroGlow({ className = '', tone = 'blue' }: { className?: string; tone?: 'blue' | 'teal' | 'mixed' }) {
  const a = tone === 'teal' ? 'rgba(20,184,166,0.10)' : 'rgba(37,99,235,0.10)';
  const b = tone === 'mixed' ? 'rgba(20,184,166,0.08)' : 'rgba(37,99,235,0.07)';
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <motion.div
        className="absolute -left-24 -top-24 h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ background: a }}
        animate={{ x: [0, 26, 0], y: [0, 18, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-8rem] top-[-6rem] h-[30rem] w-[30rem] rounded-full blur-3xl"
        style={{ background: b }}
        animate={{ x: [0, -22, 0], y: [0, 24, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
