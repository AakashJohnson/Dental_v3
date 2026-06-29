import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Search, LogIn, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import { BrandLockup, GovPartnerEmblems, TricolourRule } from '../components/Branding';
import { pageVariants } from '../design-system/motion/pageTransitions';

const NAV = [
  { to: '/colleges', label: 'Colleges' },
  { to: '/workflows', label: 'Workflows' },
  { to: '/process', label: 'Process' },
  { to: '/documents', label: 'Documents' },
  { to: '/ai-inspection', label: 'AI Inspection' },
  { to: '/regulations', label: 'Regulations' },
  { to: '/about', label: 'About' },
];

export function PublicLayout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = Number(localStorage.getItem('fontScale'));
    return saved >= 90 && saved <= 130 ? saved : 100;
  });
  const location = useLocation();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // Apply the chosen accessibility font scale to the document root (scales rem-based text).
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    localStorage.setItem('fontScale', String(fontScale));
  }, [fontScale]);
  const adjustFont = (delta: number) => setFontScale((s) => Math.min(130, Math.max(90, s + delta)));
  return (
    <div className="min-h-screen bg-ivory-100 text-ink">
      <TricolourRule />
      {/* Government utility strip */}
      <div className="border-b border-teal/10 bg-white/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-[11px] text-ink-muted">
          <span className="hidden sm:inline">National Dental Commission · Dental Assessment & Rating Board (DARB)</span>
          <span className="sm:hidden">NDC · DARB</span>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 md:flex">
              <a
                href="#main-content"
                className="rounded px-1.5 py-0.5 transition hover:bg-teal-soft hover:text-teal-dark"
                title="Skip to main content"
              >
                Screen Reader
              </a>
              <span className="text-ink-muted/40">·</span>
              <button
                type="button"
                onClick={() => adjustFont(-10)}
                disabled={fontScale <= 90}
                aria-label="Decrease text size"
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold transition hover:bg-teal-soft hover:text-teal-dark disabled:opacity-40"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontScale(100)}
                aria-label="Reset text size"
                className={`rounded px-1.5 py-0.5 text-[12px] font-semibold transition hover:bg-teal-soft hover:text-teal-dark ${fontScale === 100 ? 'text-teal-dark' : ''}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => adjustFont(10)}
                disabled={fontScale >= 130}
                aria-label="Increase text size"
                className="rounded px-1.5 py-0.5 text-[14px] font-semibold transition hover:bg-teal-soft hover:text-teal-dark disabled:opacity-40"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary navbar */}
      <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${scrolled ? 'border-teal/15 bg-ivory-50/80 shadow-card backdrop-blur-xl' : 'border-teal/10 bg-ivory-50/90 backdrop-blur'}`}>
        <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
          <BrandLockup withPartner />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `hover-nav-item whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-teal-soft text-teal-dark' : 'text-ink-soft hover:text-teal-dark'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/track-application"
              title="Track / Search application"
              className="grid h-9 w-9 place-items-center rounded-full border border-teal/20 bg-white text-teal-dark shadow-card transition hover:scale-105 hover:bg-teal-soft"
            >
              <Search size={16} />
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/login"
                className="btn-glow inline-flex items-center gap-1.5 rounded-full bg-royal px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-royal-dark"
              >
                <LogIn size={15} /> Login
              </Link>
            </motion.div>
            <button className="rounded-lg p-2 text-teal-dark lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-teal/10 bg-ivory-50 px-4 py-2 lg:hidden">
            {NAV.concat({ to: '/track-application', label: 'Track Application' }, { to: '/support', label: 'Support' }).map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={(n as { end?: boolean }).end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-teal-soft text-teal-dark' : 'text-ink-soft'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main id="main-content" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="enter" exit="exit">
            {children ?? <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative mt-16 overflow-hidden border-t border-teal/10 bg-teal-dark text-ivory-100">
        {/* decorative glow accents */}
        <span className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-teal/30 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-royal/20 blur-3xl" />

        {/* Helpline / CTA strip */}
        <div className="relative border-b border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
            <div>
              <div className="font-display text-lg font-bold text-white">Need help with an application?</div>
              <div className="text-sm text-ivory-200/90">Our support desk assists applicants and regulators on working days, 9 AM – 6 PM.</div>
            </div>
            <Link
              to="/support"
              className="btn-glow inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-teal-dark shadow-card transition hover:scale-105"
            >
              Contact Support <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <GovPartnerEmblems size={40} dark />
              <div>
                <div className="font-display text-lg font-bold text-white">DantaDrishti</div>
                <div className="text-[11px] uppercase tracking-wide text-ivory-200">Ministry of Ayush · Government of India</div>
              </div>
            </div>
            <p className="mt-3 max-w-md text-sm text-ivory-200/90">
              AI-assisted dental college approval, inspection and recognition platform operated under the National Dental
              Commission / DARB, applying DCI Regulations 2006.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Platform</div>
            <ul className="mt-3 space-y-2 text-sm text-ivory-200/90">
              {NAV.slice(1, 6).map((n) => (
                <li key={n.to}><Link to={n.to} className="inline-flex items-center gap-1 transition hover:text-white hover:translate-x-0.5">{n.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Services</div>
            <ul className="mt-3 space-y-2 text-sm text-ivory-200/90">
              <li><Link to="/track-application" className="transition hover:text-white">Track Application</Link></li>
              <li><Link to="/support" className="transition hover:text-white">Help & Support</Link></li>
              <li><Link to="/regulations" className="transition hover:text-white">Regulations</Link></li>
              <li><Link to="/login" className="transition hover:text-white">Regulator Login</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Contact</div>
            <ul className="mt-3 space-y-3 text-sm text-ivory-200/90">
              <li className="flex items-start gap-2">
                <Phone size={15} className="mt-0.5 shrink-0 text-ivory-200" />
                <span>1800-XXX-XXXX<br /><span className="text-[11px] text-ivory-200/70">Toll-free helpline</span></span>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={15} className="mt-0.5 shrink-0 text-ivory-200" />
                <a href="mailto:support@dantadrishti.gov.in" className="break-all transition hover:text-white">support@dantadrishti.gov.in</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-ivory-200" />
                <span>National Dental Commission, New Delhi – 110001</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-ivory-200/80 sm:flex-row">
            <span>© {new Date().getFullYear()} National Dental Commission. All rights reserved.</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="cursor-pointer transition hover:text-white">Privacy Policy</span>
              <span className="cursor-pointer transition hover:text-white">Terms of Use</span>
              <span className="cursor-pointer transition hover:text-white">Accessibility</span>
            </div>
            <span>Ministry of Ayush · Government of India · Powered by Anuvadini AI</span>
          </div>
        </div>
        <TricolourRule />
      </footer>
    </div>
  );
}
