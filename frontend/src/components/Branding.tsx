import { Link } from 'react-router-dom';
import ayushLogo from '../assets/logos/ministry-ayush.webp';
import anuvadiniLogo from '../assets/logos/anuvadini-ai.webp';

const LOGO = {
  ayush: ayushLogo,
  anuvadini: anuvadiniLogo,
};

/** Government emblem: Ministry of Ayush / Government of India (national emblem). */
export function GovEmblems({ size = 36 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center rounded-md bg-white px-2 py-1 shadow-card ring-1 ring-ink/5"
      title="Ministry of Ayush, Government of India"
    >
      <img src={LOGO.ayush} alt="Ministry of Ayush, Government of India" style={{ height: size }} className="w-auto object-contain" />
    </span>
  );
}

/** Ministry of Ayush emblem + Anuvadini AI logo at matching size, divider between.
 *  `dark` lightens the divider for use on dark backgrounds (e.g. footer). */
export function GovPartnerEmblems({ size = 36, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <GovEmblems size={size} />
      <span className={`w-px ${dark ? 'bg-white/25' : 'bg-ink/15'}`} style={{ height: size }} aria-hidden />
      <span
        className="inline-flex items-center rounded-md bg-white px-2 py-1 shadow-card ring-1 ring-ink/5"
        title="Anuvadini AI — Language Accessibility Partner"
      >
        <img src={LOGO.anuvadini} alt="Anuvadini AI" style={{ height: size }} className="w-auto object-contain" />
      </span>
    </span>
  );
}

/** Anuvadini AI partner identity (language accessibility). */
export function AnuvadiniBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-royal/15 bg-royal-soft/60 px-2 py-1"
      title="Anuvadini AI — Language Accessibility Partner"
    >
      <img src={LOGO.anuvadini} alt="Anuvadini AI" className="h-5 w-auto" />
      {!compact && <span className="text-[10px] font-semibold uppercase tracking-wide text-royal-dark">AI Language Access</span>}
    </div>
  );
}

/** Primary platform lockup: emblems + DantaDrishti wordmark + ministry line.
 *  `withPartner` shows the Anuvadini AI logo alongside the Ministry of Ayush emblem. */
export function BrandLockup({ to = '/', dark = false, withPartner = false }: { to?: string; dark?: boolean; withPartner?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-3">
      {withPartner ? <GovPartnerEmblems /> : <GovEmblems />}
      <div className="hidden sm:block">
        <div className={`font-display text-lg font-bold leading-none ${dark ? 'text-white' : 'text-teal-dark'}`}>
          Danta<span className="text-saffron">Drishti</span>
        </div>
        <div className={`text-[10px] font-medium uppercase tracking-[0.14em] ${dark ? 'text-ivory-200' : 'text-ink-muted'}`}>
          Government of India · Dental Assessment & Rating Board
        </div>
      </div>
    </Link>
  );
}

/** Thin tricolour rule used at the very top of public + auth chrome. */
export function TricolourRule() {
  return <div className="h-1 w-full tricolour" />;
}
