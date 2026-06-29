import { motion } from 'framer-motion';
import { ShimmerParticles } from '../../components/backgrounds/ShimmerParticles';
import { ClinicalDotHalftone } from '../../components/backgrounds/ThemeMotifs';

/**
 * Soft institutional backdrop (light, paper-like) with drifting teal/royal/saffron
 * blobs and a dental-proforma grid texture. GPU-light, honours reduced motion.
 */
export function AuroraBackground({ subtle = false }: { subtle?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-ivory-100" />
      <div className="absolute inset-0 bg-gov-aurora" />
      <div className="bg-conic-rotate absolute left-1/2 top-1/2 h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70" />
      <ClinicalDotHalftone />
      <div className="absolute inset-0 tex-proforma opacity-60" />
      <motion.div
        className="absolute -left-40 -top-40 h-[42rem] w-[42rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(13,92,92,0.16), transparent 60%)' }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-12rem] top-10 h-[38rem] w-[38rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.14), transparent 60%)' }}
        animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      {!subtle && (
        <motion.div
          className="absolute bottom-[-14rem] left-1/3 h-[40rem] w-[40rem] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(234,115,23,0.12), transparent 60%)' }}
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <ShimmerParticles count={subtle ? 24 : 40} tone="light" />
    </div>
  );
}
