import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, KeyRound, User2, ArrowLeft, Fingerprint, Code2 } from 'lucide-react';
import { useAuth, AuthUser } from '../store/auth';
import { BrandLockup, GovPartnerEmblems, TricolourRule } from '../components/Branding';
import { PhotoImage } from '../components/visuals/PhotoImage';
import { PageBackground } from '../components/visuals/AnimatedBackgrounds';
import { hx } from '../design-system/effects/hoverEffects';
import { roleLabels } from '../design-system/tokens';

/** Role → representative demo username (seeded). */
const ROLE_USER: { role: string; user: string; group: 'College' | 'Regulator' | 'Decision' | 'Admin' }[] = [
  { role: 'APPLICANT', user: 'applicant_new_college', group: 'College' },
  { role: 'CONSULTANT', user: 'consultant', group: 'College' },
  { role: 'SCRUTINY_OFFICER', user: 'scrutiny_officer', group: 'Regulator' },
  { role: 'CASE_OFFICER', user: 'case_officer', group: 'Regulator' },
  { role: 'ASSESSOR', user: 'assessor_1', group: 'Regulator' },
  { role: 'OBSERVER', user: 'observer', group: 'Regulator' },
  { role: 'EC_MEMBER', user: 'ec_member', group: 'Decision' },
  { role: 'COMPLIANCE_OFFICER', user: 'compliance_officer', group: 'Decision' },
  { role: 'GOVERNMENT_AUTHORITY', user: 'government_authority', group: 'Decision' },
  { role: 'DCI_ADMIN', user: 'dci_admin', group: 'Admin' },
  { role: 'SUPER_ADMIN', user: 'super_admin', group: 'Admin' },
  { role: 'SYSTEM_ADMINISTRATOR', user: 'system_admin', group: 'Admin' },
];

const GROUPS = ['College', 'Regulator', 'Decision', 'Admin'] as const;

export function Login() {
  const { login, devLogin, loading, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('applicant_new_college');
  const [password, setPassword] = useState('Passw0rd!');
  const [tab, setTab] = useState<(typeof GROUPS)[number]>('College');
  const [localErr, setLocalErr] = useState('');
  const [devMode, setDevMode] = useState(false);

  /** Build a client-only demo user from the selected username (no backend). */
  function makeDevUser(): AuthUser {
    const entry = ROLE_USER.find((r) => r.user === username) ?? ROLE_USER[0];
    return {
      id: `dev-${entry.role.toLowerCase()}`,
      name: roleLabels[entry.role] ?? entry.role,
      role: entry.role,
      username: entry.user,
    };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalErr('');
    if (devMode) {
      devLogin(makeDevUser());
      navigate('/app');
      return;
    }
    if (!username.trim()) return setLocalErr('Enter your username.');
    if (!password) return setLocalErr('Enter your password.');
    try {
      await login(username, password);
      navigate('/app');
    } catch {
      /* surfaced via store error */
    }
  }

  return (
    <div className="relative min-h-screen">
      <PageBackground variant="login" />
      <TricolourRule />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <BrandLockup withPartner />
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-dark hover:underline">
          <ArrowLeft size={15} /> Back to site
        </Link>
      </div>

      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-8 lg:grid-cols-2">
        {/* Left — identity & trust */}
        <div className="hidden lg:block">
          <div className="gov-card-solid relative overflow-hidden p-8 tex-proforma">
            <div className="mb-6 overflow-hidden rounded-xl border border-teal/15 shadow-card-lg hover-image-zoom">
              <PhotoImage photo="commandCenter" priority alt="Government dental inspection AI command centre" className="aspect-[16/9]">
                <div className="text-xs font-bold text-white">DantaDrishti · AI inspection command centre</div>
              </PhotoImage>
            </div>
            <GovPartnerEmblems size={52} />
            <h1 className="mt-5 font-display text-3xl font-bold text-ink">Secure regulator & applicant access</h1>
            <p className="mt-3 max-w-md text-ink-soft">
              Sign in to the National Dental Commission / DARB approval and AI-inspection platform. Access is role-based and
              every action is recorded on an immutable audit trail.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-soft">
              <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-compliance" /> Least-privilege, backend-enforced permissions</li>
              <li className="flex items-center gap-2"><Fingerprint size={16} className="text-royal" /> MFA for officer, EC, government & admin roles</li>
              <li className="flex items-center gap-2"><KeyRound size={16} className="text-saffron-deep" /> Single sign-on to your role dashboard</li>
            </ul>
          </div>
        </div>

        {/* Right — login form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="gov-card-solid seal-ring p-6 sm:p-8">
            <div className="mb-1 font-display text-xl font-bold text-ink">Sign in</div>
            <p className="mb-5 text-sm text-ink-muted">Choose your role group and continue.</p>

            <button
              type="button"
              onClick={() => setDevMode((v) => !v)}
              className={`mb-4 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition hover-lift ${
                devMode ? 'border-royal bg-royal/5' : 'border-teal/15 bg-white'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Code2 size={15} className={devMode ? 'text-royal' : 'text-ink-muted'} />
                Dev mode (no backend)
              </span>
              <span
                className={`relative h-5 w-9 rounded-full transition ${devMode ? 'bg-royal' : 'bg-ivory-300'}`}
                aria-hidden
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${devMode ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
            </button>

            <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl bg-ivory-200 p-1">
              {GROUPS.map((g) => (
                <button key={g} onClick={() => setTab(g)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${tab === g ? 'bg-white text-teal-dark shadow-card' : 'text-ink-muted'}`}>
                  {g}
                </button>
              ))}
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
              {ROLE_USER.filter((r) => r.group === tab).map((r) => (
                <button
                  key={r.user}
                  onClick={() => setUsername(r.user)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs transition hover-lift hover-border-scan ${
                    username === r.user ? 'border-teal bg-teal-soft text-teal-dark' : 'border-teal/15 bg-white text-ink-soft hover:bg-teal-soft/50'
                  }`}
                >
                  <div className="font-semibold">{roleLabels[r.role]}</div>
                  <div className="text-[10px] text-ink-muted">{r.user}</div>
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-soft">Username</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-teal/20 bg-ivory-50 px-3 py-2.5">
                  <User2 size={15} className="text-ink-muted" />
                  <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent text-sm text-ink outline-none" />
                </div>
              </div>
              {!devMode && (
                <div>
                  <label className="text-xs font-medium text-ink-soft">Password</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-teal/20 bg-ivory-50 px-3 py-2.5">
                    <KeyRound size={15} className="text-ink-muted" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-sm text-ink outline-none" />
                  </div>
                </div>
              )}

              {(localErr || (!devMode && error)) && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-risk-high">{localErr || error}</div>}

              <button type="submit" disabled={loading && !devMode} className={`btn-glow w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50 ${devMode ? 'bg-royal hover:bg-royal-dark' : 'bg-teal hover:bg-teal-dark'}`}>
                {devMode ? 'Enter demo as selected role' : loading ? 'Signing in…' : 'Sign in to dashboard'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs">
              <button className="text-ink-muted hover:text-teal-dark">Forgot password?</button>
              <span className="rounded-md bg-ivory-200 px-2 py-1 text-[10px] font-medium text-ink-muted">MFA · placeholder</span>
            </div>

            <div className={`mt-5 rounded-lg border px-3 py-2 text-[11px] ${devMode ? 'border-royal/20 bg-royal-soft/60 text-royal-dark' : 'border-saffron/20 bg-saffron-soft/60 text-saffron-deep'}`}>
              {devMode
                ? 'Dev mode · client-only demo, no backend. Pick a role above and enter — pages show bundled demo data.'
                : <>Development demo mode · all seeded users share password <b>Passw0rd!</b></>}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
