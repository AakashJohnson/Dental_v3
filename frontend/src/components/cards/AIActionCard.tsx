import { motion } from 'framer-motion';
import { PhotoImage, PhotoKey } from '../visuals/PhotoImage';
import { useTilt3D } from '../../design-system/effects/card3d';

export interface AIActionCardProps {
  photo: PhotoKey;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  index?: number;
}

/**
 * AIActionCard — photorealistic image-top card with an overlapping circular
 * icon badge, white body, animated blue underline, and rich hover motion
 * (lift, image zoom, glow, shine sweep). Matches the "AI in Action" reference.
 */
export function AIActionCard({ photo, icon, title, subtitle, index = 0 }: AIActionCardProps) {
  const t = useTilt3D(9);
  return (
    <motion.div
      ref={t.ref}
      onMouseMove={t.onMouseMove}
      onMouseLeave={t.onMouseLeave}
      style={t.style}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
      className="group relative overflow-hidden rounded-2xl border border-teal/12 bg-white depth-shadow hover-glow hover-shine"
    >
      {/* Image top */}
      <div className="relative h-32 overflow-hidden">
        <PhotoImage
          photo={photo}
          alt={title}
          className="h-full w-full transition-transform duration-500 group-hover:scale-110"
          rounded="rounded-none"
          overlay={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-transparent" />
      </div>

      {/* Overlapping circular icon badge */}
      <div className="relative -mt-6 flex justify-center">
        <motion.span
          whileHover={{ scale: 1.1 }}
          className="grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-royal to-teal text-white shadow-card"
        >
          {icon}
        </motion.span>
      </div>

      {/* Body */}
      <div className="px-3 pb-5 pt-2 text-center">
        <div className="text-sm font-bold text-ink">{title}</div>
        <div className="mt-0.5 text-[11px] text-ink-muted">{subtitle}</div>
        {/* Animated blue underline */}
        <div className="mx-auto mt-2 h-0.5 w-8 rounded-full bg-royal transition-all duration-300 group-hover:w-16" />
      </div>
    </motion.div>
  );
}
