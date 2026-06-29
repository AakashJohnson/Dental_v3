import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FilePlus2, ArrowRight, Upload, ShieldCheck, CalendarClock, IndianRupee } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { GlassPanel, GlowButton } from '../design-system/components';
import { BlockedReasonAlert } from '../components/Workflow';
import { workflowLabels } from '../design-system/tokens';

const COURSES = ['BDS', 'MDS'];

interface DocumentSpec {
  key: string;
  label: string;
  type: string;
  gating: boolean;
  needsValidity: boolean;
}

interface WorkflowRequirements {
  workflowType: string;
  documents: DocumentSpec[];
  feeLakh: number;
  bankGuarantee: { applicable: boolean; amountLakh: number; basis: string };
  statutorySchedule: {
    course: string;
    windowOpen: string;
    windowClose: string;
    recommendationBy: string;
    permissionBy: string;
  };
  proformaTier: string;
  supportsPartialApproval: boolean;
}

/** Applicant/Consultant: create a brand-new application (any of the 7 workflows). */
export function NewApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  const workflows = useQuery({
    queryKey: ['selectable-workflows'],
    queryFn: () => api.get<string[]>('/applications/selectable-workflows'),
  });

  const [workflowType, setWorkflowType] = useState('');
  const [course, setCourse] = useState('BDS');
  const [specialty, setSpecialty] = useState('');
  const [intake, setIntake] = useState(100);

  // Default workflow once loaded.
  const wf = workflowType || workflows.data?.[0] || '';

  // Live regulatory requirements for the chosen workflow / course / intake.
  const requirements = useQuery({
    queryKey: ['workflow-requirements', wf, course, intake],
    queryFn: () =>
      api.get<WorkflowRequirements>(
        `/applications/workflow-requirements?workflowType=${encodeURIComponent(wf)}&course=${course}&intake=${intake}`,
      ),
    enabled: !!wf,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<{ id: string; code: string }>('/applications', {
        collegeId: user?.collegeId,
        workflowType: wf,
        applicationType: workflowLabels[wf] ?? 'New Application',
        course,
        specialty: specialty || undefined,
        intake: Number(intake),
        // Documents are uploaded by the applicant AFTER the draft is created,
        // from the Draft case view — never at creation time.
        documents: [],
      }),
    onSuccess: (app) => navigate(`/app/application/${app.id}`),
    onError: (e: Error) => setErr(e.message),
  });

  const req = requirements.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-soft text-teal-dark">
          <FilePlus2 size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">New Application</h1>
          <p className="text-ink-soft">Start a new case under the DCI Regulations 2006 workflow.</p>
        </div>
      </div>

      {err && <BlockedReasonAlert reason={err} />}

      <GlassPanel className="space-y-5 p-6">
        <Field label="Workflow type">
          <select
            className="w-full rounded-xl border border-teal/20 bg-white px-3 py-2.5 text-sm text-ink focus:border-teal focus:outline-none"
            value={wf}
            onChange={(e) => setWorkflowType(e.target.value)}
          >
            {(workflows.data ?? []).map((w) => (
              <option key={w} value={w}>
                {workflowLabels[w] ?? w}
              </option>
            ))}
          </select>
          {(workflows.data?.length ?? 0) <= 1 && (
            <p className="mt-1.5 text-xs text-ink-muted">
              Your college’s current status limits you to the workflow above. More workflows unlock once the college is approved/recognised.
            </p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Course">
            <select
              className="w-full rounded-xl border border-teal/20 bg-white px-3 py-2.5 text-sm text-ink focus:border-teal focus:outline-none"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Proposed intake (seats)">
            <input
              type="number"
              min={0}
              className="w-full rounded-xl border border-teal/20 bg-white px-3 py-2.5 text-sm text-ink focus:border-teal focus:outline-none"
              value={intake}
              onChange={(e) => setIntake(Number(e.target.value))}
            />
          </Field>
        </div>

        {course === 'MDS' && (
          <Field label="Specialty (MDS)">
            <input
              className="w-full rounded-xl border border-teal/20 bg-white px-3 py-2.5 text-sm text-ink focus:border-teal focus:outline-none"
              placeholder="e.g. Oral & Maxillofacial Surgery"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </Field>
        )}

        {/* Live regulatory preview — proves the form is driven by the engine. */}
        {req && (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={<IndianRupee size={15} />} label="Application fee" value={`₹${req.feeLakh} lakh`} />
            <StatCard
              icon={<ShieldCheck size={15} />}
              label="Bank guarantee"
              value={req.bankGuarantee.applicable ? `₹${req.bankGuarantee.amountLakh} lakh` : 'Not required'}
              hint={req.bankGuarantee.basis}
            />
            <StatCard
              icon={<CalendarClock size={15} />}
              label={`Window (${req.statutorySchedule.course})`}
              value={`${req.statutorySchedule.windowOpen} – ${req.statutorySchedule.windowClose}`}
              hint={`Permission by ${req.statutorySchedule.permissionBy}`}
            />
          </div>
        )}

        <Field label="Annexures / documents you will need to upload">
          {requirements.isLoading && <p className="text-sm text-ink-muted">Loading required documents…</p>}
          <div className="space-y-2">
            {(req?.documents ?? []).map((d) => (
              <div
                key={d.key}
                className="rounded-xl border border-teal/15 bg-white px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-ink-muted">
                    <Upload size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm text-ink">{d.label}</span>
                      {d.gating && (
                        <span className="rounded-full bg-saffron-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-saffron-deep">
                          Mandatory
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] uppercase tracking-wide text-ink-muted">{d.type}</span>
                </div>
              </div>
            ))}
          </div>
          {(req?.documents ?? []).length > 0 && (
            <p className="mt-2 text-xs text-ink-muted">
              You’ll upload these from the Draft case view after creating the application.
            </p>
          )}
        </Field>

        <GlowButton
          variant="primary"
          className="w-full"
          disabled={create.isPending || !wf}
          onClick={() => {
            setErr(null);
            create.mutate();
          }}
        >
          {create.isPending ? 'Creating…' : 'Create application'} <ArrowRight size={16} className="ml-1 inline" />
        </GlowButton>
        <p className="text-center text-xs text-ink-muted">
          Creates the case in <strong>Draft</strong>. Open it to upload the required documents and submit for scrutiny.
        </p>
      </GlassPanel>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-teal/15 bg-white px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
      {hint && <div className="mt-0.5 line-clamp-2 text-[11px] text-ink-muted">{hint}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

