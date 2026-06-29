import { ReactNode, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './store/auth';
import { getToken, api } from './lib/api';
import { DashboardShell } from './layouts/DashboardShell';
import { PublicLayout } from './layouts/PublicLayout';
import { Home } from './pages/public/Home';
import { Colleges } from './pages/public/Colleges';
import { Workflows } from './pages/public/Workflows';
import { Process } from './pages/public/Process';
import { Documents } from './pages/public/Documents';
import { AIInspection } from './pages/public/AIInspection';
import { Regulations } from './pages/public/Regulations';
import { About } from './pages/public/About';
import { TrackApplication } from './pages/public/TrackApplication';
import { Support } from './pages/public/Support';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { NewApplication } from './pages/NewApplication';
import { Queue } from './pages/Queue';
import { ReportsHome, ReportDetail } from './pages/reports/Reports';

/** Guards a route: requires auth, and optionally a set of roles. */
function Protected({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />;
  return <Shell>{children}</Shell>;
}

function Shell({ children }: { children: ReactNode }) {
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<any[]>('/notifications'),
    refetchInterval: 20000,
  });
  const unread = (notifications.data ?? []).filter((n) => !n.read).length;
  return <DashboardShell notifications={unread}>{children}</DashboardShell>;
}

export function App() {
  const { restore } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (getToken()) await restore();
      setReady(true);
    })();
  }, [restore]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-ink-muted">Loading DantaDrishti…</div>;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public site */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/colleges" element={<Colleges />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/process" element={<Process />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/ai-inspection" element={<AIInspection />} />
          <Route path="/regulations" element={<Regulations />} />
          <Route path="/about" element={<About />} />
          <Route path="/track-application" element={<TrackApplication />} />
          <Route path="/support" element={<Support />} />
        </Route>
        <Route path="/login" element={<Login />} />

        <Route path="/app" element={<Protected><Dashboard /></Protected>} />
        <Route path="/app/application/:id" element={<Protected><ApplicationDetail /></Protected>} />
        <Route path="/app/applications" element={<Protected roles={['APPLICANT', 'CONSULTANT']}><Queue config={{ title: 'My Applications', subtitle: 'Applications you own or are delegated for', endpoint: '/applications', createPath: '/app/applications/new', createLabel: 'New Application' }} /></Protected>} />
        <Route path="/app/applications/new" element={<Protected roles={['APPLICANT', 'CONSULTANT']}><NewApplication /></Protected>} />

        <Route path="/app/scrutiny" element={<Protected roles={['SCRUTINY_OFFICER', 'DCI_ADMIN', 'SUPER_ADMIN']}><Queue config={{ title: 'Scrutiny Queue', subtitle: 'Completeness & eligibility review', endpoint: '/scrutiny/queue' }} /></Protected>} />
        <Route path="/app/scheduling" element={<Protected roles={['CASE_OFFICER', 'DCI_ADMIN', 'SUPER_ADMIN']}><Queue config={{ title: 'Inspection Scheduling', subtitle: 'Assign assessors & observers', endpoint: '/applications' }} /></Protected>} />
        <Route path="/app/inspection" element={<Protected roles={['ASSESSOR', 'DCI_ADMIN', 'SUPER_ADMIN']}><Queue config={{ title: 'Assigned Inspections', subtitle: 'AI capture & joint report', endpoint: '/assessor/assigned' }} /></Protected>} />
        <Route path="/app/observer" element={<Protected roles={['OBSERVER', 'DCI_ADMIN', 'SUPER_ADMIN']}><Queue config={{ title: 'Observer Review', subtitle: 'Verify every AI finding', endpoint: '/applications' }} /></Protected>} />
        <Route path="/app/ec" element={<Protected roles={['EC_MEMBER', 'DCI_ADMIN', 'SUPER_ADMIN']}><Queue config={{ title: 'EC Agenda', subtitle: 'Deficiencies, risk & evidence', endpoint: '/ec/queue' }} /></Protected>} />
        <Route path="/app/compliance" element={<Protected roles={['COMPLIANCE_OFFICER', 'DCI_ADMIN', 'SUPER_ADMIN']}><Queue config={{ title: 'Compliance Backlog', subtitle: 'Outstanding vs resolved delta', endpoint: '/applications' }} /></Protected>} />
        <Route path="/app/government" element={<Protected roles={['GOVERNMENT_AUTHORITY', 'DCI_ADMIN', 'SUPER_ADMIN']}><Queue config={{ title: 'Government Decisions', subtitle: 'LOI · bank guarantee · LOP', endpoint: '/government/queue' }} /></Protected>} />
        <Route path="/app/reports" element={<Protected roles={['CASE_OFFICER', 'GOVERNMENT_AUTHORITY', 'DCI_ADMIN', 'SUPER_ADMIN', 'EC_MEMBER', 'COMPLIANCE_OFFICER']}><ReportsHome /></Protected>} />
        <Route path="/app/reports/:slug" element={<Protected roles={['CASE_OFFICER', 'GOVERNMENT_AUTHORITY', 'DCI_ADMIN', 'SUPER_ADMIN', 'EC_MEMBER', 'COMPLIANCE_OFFICER']}><ReportDetail /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
