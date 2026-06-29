import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  FileSearch,
  CalendarClock,
  ScanEye,
  ClipboardCheck,
  Gavel,
  Landmark,
  FolderCheck,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { RoleBadge } from '../design-system/components';
import { GovPartnerEmblems, TricolourRule } from '../components/Branding';
import { roleColors } from '../design-system/tokens';
import { PageBackground } from '../components/visuals/AnimatedBackgrounds';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: string[];
}

const NAV: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['*'] },
  { to: '/app/applications', label: 'My Applications', icon: <FolderCheck size={18} />, roles: ['APPLICANT', 'CONSULTANT'] },
  { to: '/app/scrutiny', label: 'Scrutiny Queue', icon: <FileSearch size={18} />, roles: ['SCRUTINY_OFFICER', 'DCI_ADMIN', 'SUPER_ADMIN'] },
  { to: '/app/scheduling', label: 'Scheduling', icon: <CalendarClock size={18} />, roles: ['CASE_OFFICER', 'DCI_ADMIN', 'SUPER_ADMIN'] },
  { to: '/app/inspection', label: 'AI Inspection', icon: <ScanEye size={18} />, roles: ['ASSESSOR', 'DCI_ADMIN', 'SUPER_ADMIN'] },
  { to: '/app/observer', label: 'Observer Review', icon: <ShieldCheck size={18} />, roles: ['OBSERVER', 'DCI_ADMIN', 'SUPER_ADMIN'] },
  { to: '/app/ec', label: 'EC Review', icon: <Gavel size={18} />, roles: ['EC_MEMBER', 'DCI_ADMIN', 'SUPER_ADMIN'] },
  { to: '/app/compliance', label: 'Compliance', icon: <ClipboardCheck size={18} />, roles: ['COMPLIANCE_OFFICER', 'DCI_ADMIN', 'SUPER_ADMIN'] },
  { to: '/app/government', label: 'Government', icon: <Landmark size={18} />, roles: ['GOVERNMENT_AUTHORITY', 'DCI_ADMIN', 'SUPER_ADMIN'] },
  { to: '/app/reports', label: 'Reports', icon: <BarChart3 size={18} />, roles: ['CASE_OFFICER', 'GOVERNMENT_AUTHORITY', 'DCI_ADMIN', 'SUPER_ADMIN'] },
];

export function DashboardShell({ children, notifications = 0 }: { children: ReactNode; notifications?: number }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes('*') || n.roles.includes(user.role));
  const accent = roleColors[user.role] ?? '#0d5c5c';

  return (
    <div className="relative min-h-screen">
      <PageBackground variant="dashboard" />
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-teal/10 bg-white/85 backdrop-blur-md md:flex">
          <TricolourRule />
          <Link to="/app" className="block px-4 py-4">
            <GovPartnerEmblems size={30} />
            <div className="mt-2">
              <div className="font-display text-sm font-bold text-teal-dark">DantaDrishti</div>
              <div className="text-[9px] uppercase tracking-wide text-ink-muted">Ministry of Ayush · GoI</div>
            </div>
          </Link>

          <div className="mx-3 mb-3 rounded-xl border border-teal/10 bg-ivory-50 p-3">
            <div className="text-[10px] uppercase tracking-wide text-ink-muted">Signed in as</div>
            <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
            <div className="mt-1.5"><RoleBadge role={user.role} /></div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3">
            {items.map((n) => {
              const active = loc.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? 'bg-teal-soft text-teal-dark shadow-card' : 'text-ink-soft hover:bg-teal-soft/50 hover:text-teal-dark'
                  }`}
                  style={active ? { boxShadow: `inset 3px 0 0 ${accent}` } : undefined}
                >
                  <span className="shrink-0">{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-teal/10 p-4">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-ink-soft hover:bg-red-50 hover:text-risk-high"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-teal/10 bg-ivory-50/90 px-6 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="hidden text-xs uppercase tracking-wider text-ink-muted sm:inline">Role context</span>
              <RoleBadge role={user.role} />
            </div>
            <div className="flex items-center gap-3">
              <Link to="/app" className="relative rounded-lg p-2 text-ink-soft hover:bg-teal-soft">
                <Bell size={18} />
                {notifications > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-saffron text-[10px] font-bold text-white">
                    {notifications}
                  </span>
                )}
              </Link>
            </div>
          </header>
          <motion.main
            key={loc.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-7xl px-6 py-8"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
