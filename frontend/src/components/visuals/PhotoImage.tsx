import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ImageOff, Sparkles } from 'lucide-react';

/**
 * PhotoImage — renders a PHOTOREALISTIC raster asset for major visuals.
 *
 * Drop optimized .webp files into src/assets/real/ using the file names in
 * photorealistic-image-requirements.json. They are auto-detected at build time
 * via import.meta.glob; until then a polished dev-mode placeholder is shown.
 *
 * NO vector/SVG illustration is used as the main visual content here.
 */

// Eagerly resolve any real assets that exist. Empty object if folder is empty.
const REAL = import.meta.glob('../../assets/real/*.{webp,jpg,jpeg,png}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export type PhotoKey =
  | 'commandCenter'
  | 'dentalChair'
  | 'hospitalBed'
  | 'equipment'
  | 'faculty'
  | 'opd'
  | 'ecReview'
  | 'proforma'
  | 'fieldInspection'
  | 'govDoc';

const FILES: Record<PhotoKey, string> = {
  commandCenter: 'hero-dental-ai-inspection-command-center',
  dentalChair: 'dental-chair-ai-detection',
  hospitalBed: 'hospital-bed-ai-inspection',
  equipment: 'dental-equipment-lab-inspection',
  faculty: 'faculty-attendance-ai-verification',
  opd: 'opd-census-ai-verification',
  ecReview: 'ec-risk-review-room',
  proforma: 'proforma-document-compliance',
  fieldInspection: 'assessor-observer-field-inspection',
  govDoc: 'government-approval-document',
};

const PLACEHOLDER_LABEL: Record<PhotoKey, string> = {
  commandCenter: 'AI Inspection Command Centre',
  dentalChair: 'Dental Chair AI Detection',
  hospitalBed: 'Hospital Bed AI Inspection',
  equipment: 'Dental Equipment Inspection',
  faculty: 'Faculty Attendance Verification',
  opd: 'OPD Census Verification',
  ecReview: 'Expert Committee Review',
  proforma: 'Proforma Compliance',
  fieldInspection: 'Assessor & Observer Field Inspection',
  govDoc: 'Government Approval Workflow',
};

function resolve(key: PhotoKey): string | undefined {
  const base = FILES[key];
  const hit = Object.keys(REAL).find((p) => p.includes(`/real/${base}.`));
  return hit ? REAL[hit] : undefined;
}

export function PhotoImage({
  photo,
  alt,
  className = '',
  overlay = true,
  rounded = 'rounded-2xl',
  badges,
  children,
  priority = false,
}: {
  photo: PhotoKey;
  alt: string;
  className?: string;
  overlay?: boolean;
  rounded?: string;
  badges?: ReactNode;
  children?: ReactNode;
  priority?: boolean;
}) {
  const src = resolve(photo);

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="hx-img absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // Polished dev-mode placeholder (NOT a vector hero illustration).
        <div className="photo-pending absolute inset-0 grid place-items-center" role="img" aria-label={alt}>
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
              <ImageOff size={12} /> Photorealistic asset pending
            </span>
            <span className="font-display text-base font-bold text-white/95 drop-shadow">{PLACEHOLDER_LABEL[photo]}</span>
            <span className="flex items-center gap-1 text-[10px] text-white/70">
              <Sparkles size={11} /> Drop .webp into src/assets/real/
            </span>
          </div>
        </div>
      )}

      {overlay && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
      )}

      {badges && <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">{badges}</div>}
      {children && <div className="absolute inset-x-0 bottom-0 z-10 p-4">{children}</div>}

      {/* Subtle animated AI scan line over every major visual. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-10 h-1/3 bg-gradient-to-b from-transparent via-white/15 to-transparent mix-blend-overlay"
        initial={{ y: '-120%' }}
        animate={{ y: ['-120%', '220%'] }}
        transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
      />
    </div>
  );
}
