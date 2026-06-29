import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, MapPin, ClipboardList, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { GlassPanel, GlowButton, RiskGauge, SeverityBadge } from '../design-system/components';
import { WorkflowStepper, NextActionCard, BlockedReasonAlert } from '../components/Workflow';
import { AIFindingCard } from '../components/AIFindingCard';
import { GeoProofMap } from '../components/maps/GeoProofMap';
import { CocoSsdInspector, type DetectionSummary } from '../components/ai/CocoSsdInspector';
import { workflowLabels } from '../design-system/tokens';
export function ApplicationDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const summary = useQuery({
    queryKey: ['app-summary', id],
    queryFn: () => api.get<any>(`/applications/${id}/summary`),
  });

  const findings = useQuery({
    queryKey: ['findings', id],
    queryFn: () => api.get<any[]>(`/ai-inspection/${id}/findings`).catch(() => []),
  });

  const compliance = useQuery({
    queryKey: ['compliance', id],
    queryFn: () => api.get<any>(`/compliance/${id}`).catch(() => null),
  });

  const generatedDocs = useQuery({
    queryKey: ['generated-docs', id],
    queryFn: () => api.get<any[]>(`/applications/${id}/documents`).catch(() => []),
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ['app-summary', id] });
    qc.invalidateQueries({ queryKey: ['findings', id] });
    qc.invalidateQueries({ queryKey: ['generated-docs', id] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['applications'] });
  }

  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      setErr(null);
      setMsg('Action completed.');
      refresh();
    },
    onError: (e: Error) => {
      setMsg(null);
      setErr(e.message);
    },
  });

  const app = summary.data;
  if (summary.isLoading) return <div className="text-ink-muted">Loading…</div>;
  if (!app) return <div className="text-ink-muted">Application not found or not visible to your role.</div>;

  const role = user?.role;
  const state = app.state as string;
  const isDraftOwner = role === 'APPLICANT' && state === 'DRAFT';
  // Server-computed action envelope: the SINGLE source of truth for which
  // buttons may render. Empty array if the role has no actions at this stage.
  const allowed: string[] = Array.isArray(app.allowedActions) ? app.allowedActions : [];

  // Mandatory documents still missing (blocks submission).
  const requiredGating: { key: string; label: string }[] =
    (app.requiredDocuments ?? []).filter((d: any) => d.gating) ?? [];
  const missingGating = requiredGating.filter((spec) => {
    const doc = (app.documents ?? []).find((d: any) =>
      String(d.name).toLowerCase().includes(spec.key.toLowerCase()),
    );
    return !doc || !doc.uploaded;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{app.code}</h1>
          <p className="text-ink-soft">{workflowLabels[app.workflowType] ?? app.workflowType}</p>
        </div>
        {typeof app.riskScore === 'number' && (
          <GlassPanel className="px-4 py-3">
            <RiskGauge score={app.riskScore} level={app.riskScore === 0 ? 'LOW' : app.riskScore <= 5 ? 'MEDIUM' : 'HIGH'} />
          </GlassPanel>
        )}
      </div>

      <GlassPanel className="p-5">
        <WorkflowStepper current={state} />
      </GlassPanel>

      {msg && <div className="rounded-xl bg-compliance-soft px-4 py-3 text-sm text-compliance">{msg}</div>}
      {err && <BlockedReasonAlert reason={err} />}

      {/* AI capture — prominent, centered, full-width while on-site capture is active */}
      {(role === 'ASSESSOR' || role === 'DCI_ADMIN' || role === 'SUPER_ADMIN') &&
        state === 'AI_INSPECTION' && (
          <div className="mx-auto w-full max-w-3xl">
            <AICapturePanel id={id} intake={app.intake} onDone={refresh} />
          </div>
        )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Case snapshot */}
          <section className="grid gap-3 sm:grid-cols-3">
            <SnapshotCard label="Course / Intake" value={`${app.course ?? '—'} · ${app.intake ?? '—'} seats`} />
            <SnapshotCard
              label="Application fee"
              value={typeof app.feeLakh === 'number' ? `₹${app.feeLakh} lakh` : '—'}
              hint={app.feePaid ? 'Paid' : 'Pending'}
            />
            <SnapshotCard
              label="Bank guarantee"
              value={
                app.bankGuarantee
                  ? `₹${app.bankGuarantee.amountLakh} lakh`
                  : app.requiredBankGuarantee?.applicable
                    ? `₹${app.requiredBankGuarantee.amountLakh} lakh (req.)`
                    : '—'
              }
              hint={app.bankGuarantee?.verified ? 'Verified' : undefined}
            />
          </section>

          {/* Draft owner: collect & upload mandatory documents before submit */}
          {isDraftOwner && (
            <DraftDocuments
              id={id}
              requiredDocs={app.requiredDocuments ?? []}
              proformaFields={app.proformaFields ?? []}
              maxHospitalDistanceKm={app.maxHospitalDistanceKm ?? 10}
              existing={app.documents ?? []}
              onSaved={() => {
                setErr(null);
                setMsg('Documents saved.');
                refresh();
              }}
            />
          )}

          {/* Submitted annexures / documents (read-only) */}
          {!isDraftOwner && (app.documents ?? []).length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">Documents & Annexures</h2>
              <GlassPanel className="divide-y divide-teal/8">
                {app.documents.map((d: any) => (
                  <div key={d.id ?? d.name} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-ink">{d.name}</div>
                      <div className="text-xs text-ink-muted">
                        {d.type}
                        {d.validUpto ? ` · valid upto ${d.validUpto}` : ''}
                        {d.geo && typeof d.geo.distanceKm === 'number' ? ` · ${d.geo.distanceKm} km` : ''}
                        {d.proforma?.values ? ` · ${Object.keys(d.proforma.values).length} norms declared` : ''}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        d.uploaded ? 'bg-compliance-soft text-compliance' : 'bg-saffron-soft text-saffron-deep'
                      }`}
                    >
                      {d.uploaded ? (d.kind === 'geo' || d.kind === 'proforma' ? 'Captured' : 'Uploaded') : 'Missing'}
                    </span>
                  </div>
                ))}
              </GlassPanel>
            </section>
          )}
          {/* Generated statutory documents (JAR / LOI / LOP / letters) */}
          {(generatedDocs.data ?? []).length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">Issued Documents</h2>
              <GlassPanel className="divide-y divide-teal/8">
                {generatedDocs.data!.map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-ink">{g.title}</div>
                      <div className="text-xs text-ink-muted">
                        {g.reference} · ID {g.verificationId}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-teal-soft px-2.5 py-0.5 text-[11px] font-semibold text-teal-dark">
                      {g.type?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </GlassPanel>
            </section>
          )}

          {/* AI findings */}
          {(findings.data ?? []).length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">AI Findings</h2>
              <AIReportSummary findings={findings.data!} />
              <div className="grid gap-3 sm:grid-cols-2">
                {findings.data!.map((f) => (
                  <AIFindingCard
                    key={f.id}
                    finding={f}
                    onVerify={
                      allowed.includes('AI_FINDING_VERIFY')
                        ? (verdict) =>
                            act.mutate(() =>
                              api.post(`/observer/${id}/verify-finding`, {
                                findingId: f.id,
                                verdict,
                                notes: 'Verified in workspace',
                                exceptionReason: verdict !== 'ACCEPT' ? 'Flagged by observer' : undefined,
                              }),
                            )
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* Deficiencies */}
          {compliance.data && compliance.data.items?.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">
                Deficiencies · {compliance.data.resolved}/{compliance.data.total} resolved
              </h2>
              <GlassPanel className="divide-y divide-teal/8">
                {compliance.data.items.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm text-ink">{d.requirement}</div>
                      <div className="text-xs text-ink-muted">{d.deficiency}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={d.severity} />
                      <span className={`text-xs font-semibold ${d.status === 'RESOLVED' ? 'text-compliance' : 'text-saffron-deep'}`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </GlassPanel>
            </section>
          )}
        </div>

        {/* Right rail: guidance + role actions. Buttons render SOLELY from the
            server-computed `allowedActions` envelope — never from role/state —
            so no role ever sees another role's actions. */}
        <div className="space-y-4">
          <NextActionCard guidance={app.guidance} />
          {allowed.includes('INSPECTION_ASSIGN_TEAM') && (
            <CaseOfficerSchedule id={id} onDone={refresh} />
          )}
          {allowed.includes('LOP_ISSUE') && <GovernmentBankGuarantee id={id} onDone={refresh} />}
          <RoleActions
            allowed={allowed}
            busy={act.isPending}
            onAct={(fn) => act.mutate(fn)}
            id={id}
            submitBlockedReason={
              isDraftOwner && missingGating.length > 0
                ? `Upload all mandatory documents first: ${missingGating.map((m) => m.label).join('; ')}`
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

/** Compact key/value snapshot tile used in the case header. */
function SnapshotCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <GlassPanel className="px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-ink-muted">{hint}</div>}
    </GlassPanel>
  );
}

interface DraftDocSpec {
  key: string;
  label: string;
  type: string;
  gating: boolean;
  needsValidity: boolean;
  kind?: 'file' | 'geo' | 'proforma';
}
interface ProformaField {
  key: string;
  label: string;
  section: string;
  unit: string;
  requiredValue: number;
  comparator: 'gte' | 'lte';
}
interface GeoProof {
  collegeLat?: number;
  collegeLng?: number;
  hospitalLat?: number;
  hospitalLng?: number;
  distanceKm?: number;
}
interface DocRow extends DraftDocSpec {
  uploaded: boolean;
  fileName?: string;
  validUpto?: string;
  geo?: GeoProof;
  proforma?: { values: Record<string, number | undefined> };
}

/** Haversine great-circle distance in km (mirrors the backend check). */
function haversineKm(g: GeoProof): number | undefined {
  const { collegeLat, collegeLng, hospitalLat, hospitalLng } = g;
  if ([collegeLat, collegeLng, hospitalLat, hospitalLng].some((n) => typeof n !== 'number')) return undefined;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(hospitalLat! - collegeLat!);
  const dLng = toRad(hospitalLng! - collegeLng!);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(collegeLat!)) * Math.cos(toRad(hospitalLat!)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 100) / 100;
}

/** Applicant draft view: collect documents, geo proof & proforma, then save. */
function DraftDocuments({
  id,
  requiredDocs,
  proformaFields,
  maxHospitalDistanceKm,
  existing,
  onSaved,
}: {
  id: string;
  requiredDocs: DraftDocSpec[];
  proformaFields: ProformaField[];
  maxHospitalDistanceKm: number;
  existing: { name: string; type?: string; uploaded?: boolean; validUpto?: string; kind?: string; geo?: GeoProof; proforma?: { values: Record<string, number> } }[];
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<DocRow[]>(() =>
    requiredDocs.map((spec) => {
      const match = existing.find((e) => e.name.toLowerCase().includes(spec.key.toLowerCase()));
      const kind = spec.kind ?? 'file';
      return {
        ...spec,
        kind,
        uploaded: match?.uploaded ?? false,
        fileName: kind === 'file' && match?.uploaded ? match.name : undefined,
        validUpto: match?.validUpto,
        geo: match?.geo,
        proforma: match?.proforma,
      };
    }),
  );
  const [err, setErr] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/applications/${id}/documents`, {
        documents: rows.map((r) => {
          if (r.kind === 'geo') {
            const g = r.geo ?? {};
            const hasAll = [g.collegeLat, g.collegeLng, g.hospitalLat, g.hospitalLng].every(
              (n) => typeof n === 'number',
            );
            return {
              name: r.label,
              type: r.type,
              kind: 'geo',
              geo: hasAll
                ? {
                    collegeLat: g.collegeLat,
                    collegeLng: g.collegeLng,
                    hospitalLat: g.hospitalLat,
                    hospitalLng: g.hospitalLng,
                  }
                : undefined,
            };
          }
          if (r.kind === 'proforma') {
            const values: Record<string, number> = {};
            for (const [k, v] of Object.entries(r.proforma?.values ?? {})) {
              if (typeof v === 'number' && !Number.isNaN(v)) values[k] = v;
            }
            return { name: r.label, type: r.type, kind: 'proforma', proforma: { values } };
          }
          return { name: r.label, type: r.type, kind: 'file', uploaded: r.uploaded, validUpto: r.validUpto || undefined };
        }),
      }),
    onSuccess: () => {
      setErr(null);
      onSaved();
    },
    onError: (e: Error) => setErr(e.message),
  });

  function onPick(i: number, file?: File) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, uploaded: !!file, fileName: file?.name } : row)));
  }
  function onValidity(i: number, value: string) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, validUpto: value } : row)));
  }
  function onGeo(i: number, patch: Partial<GeoProof>) {
    setRows((r) =>
      r.map((row, idx) => {
        if (idx !== i) return row;
        const geo = { ...row.geo, ...patch };
        const distanceKm = haversineKm(geo);
        return { ...row, geo: { ...geo, distanceKm }, uploaded: distanceKm !== undefined };
      }),
    );
  }
  function onProforma(i: number, key: string, value: string) {
    setRows((r) =>
      r.map((row, idx) => {
        if (idx !== i) return row;
        const values = { ...(row.proforma?.values ?? {}) };
        values[key] = value === '' ? undefined : Number(value);
        const complete = proformaFields.every((f) => typeof values[f.key] === 'number' && !Number.isNaN(values[f.key] as number));
        return { ...row, proforma: { values }, uploaded: proformaFields.length > 0 && complete };
      }),
    );
  }

  const missing = rows.filter((r) => r.gating && !r.uploaded);

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-ink">Collect Documents & Information</h2>
      <GlassPanel className="space-y-2 p-4">
        {err && <BlockedReasonAlert reason={err} />}
        {rows.map((d, i) => (
          <div
            key={d.key}
            className={`rounded-xl border px-3 py-2.5 ${d.uploaded ? 'border-compliance/30 bg-compliance-soft/40' : 'border-teal/15 bg-white'}`}
          >
            <div className="flex items-center gap-3">
              <span className={d.uploaded ? 'text-compliance' : 'text-ink-muted'}>
                {d.uploaded ? <CheckCircle2 size={18} /> : d.kind === 'geo' ? <MapPin size={18} /> : d.kind === 'proforma' ? <ClipboardList size={18} /> : <Upload size={18} />}
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
                {d.fileName && <div className="truncate text-xs text-compliance">{d.fileName}</div>}
              </div>
              {d.kind === 'file' && (
                <label className="shrink-0 cursor-pointer rounded-lg border border-teal/30 bg-white px-3 py-1.5 text-xs font-semibold text-teal-dark hover:bg-teal-soft">
                  {d.uploaded ? 'Replace' : 'Upload'}
                  <input type="file" className="hidden" onChange={(e) => onPick(i, e.target.files?.[0])} />
                </label>
              )}
            </div>

            {d.kind === 'file' && d.needsValidity && d.uploaded && (
              <div className="mt-2 flex items-center gap-2 pl-8">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Valid upto</span>
                <input
                  type="date"
                  value={d.validUpto ?? ''}
                  onChange={(e) => onValidity(i, e.target.value)}
                  className="rounded-lg border border-teal/20 bg-white px-2.5 py-1.5 text-xs text-ink focus:border-teal focus:outline-none"
                />
              </div>
            )}

            {d.kind === 'geo' && (
              <GeoProofInput
                geo={d.geo ?? {}}
                maxKm={maxHospitalDistanceKm}
                onChange={(patch) => onGeo(i, patch)}
              />
            )}

            {d.kind === 'proforma' && (
              <ProformaInput
                fields={proformaFields}
                values={d.proforma?.values ?? {}}
                onChange={(key, value) => onProforma(i, key, value)}
              />
            )}
          </div>
        ))}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-ink-muted">
            {missing.length === 0 ? 'All mandatory items collected.' : `${missing.length} mandatory item(s) pending.`}
          </span>
          <GlowButton variant="primary" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save documents'}
          </GlowButton>
        </div>
      </GlassPanel>
    </section>
  );
}

/** Geo-location capture for the site ↔ attached hospital ≤10 km proof. */
function GeoProofInput({
  geo,
  maxKm,
  onChange,
}: {
  geo: GeoProof;
  maxKm: number;
  onChange: (patch: Partial<GeoProof>) => void;
}) {
  const num = (v: string) => (v === '' ? undefined : Number(v));
  const within = typeof geo.distanceKm === 'number' && geo.distanceKm <= maxKm;
  return (
    <div className="mt-2 space-y-2 pl-8">
      <p className="text-[11px] text-ink-muted">
        Enter the geo-coordinates of the proposed college site and the attached medical college / hospital.
        Distance is computed automatically and must be ≤ {maxKm} km by road (Reg 6(h)).
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <CoordPair
          label="College site"
          lat={geo.collegeLat}
          lng={geo.collegeLng}
          onLat={(v) => onChange({ collegeLat: num(v) })}
          onLng={(v) => onChange({ collegeLng: num(v) })}
          onPick={(la, ln) => onChange({ collegeLat: la, collegeLng: ln })}
        />
        <CoordPair
          label="Attached hospital"
          lat={geo.hospitalLat}
          lng={geo.hospitalLng}
          onLat={(v) => onChange({ hospitalLat: num(v) })}
          onLng={(v) => onChange({ hospitalLng: num(v) })}
          onPick={(la, ln) => onChange({ hospitalLat: la, hospitalLng: ln })}
        />
      </div>
      {typeof geo.distanceKm === 'number' && (
        <div
          className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold ${
            within ? 'bg-compliance-soft text-compliance' : 'bg-red-50 text-risk-high'
          }`}
        >
          Distance: {geo.distanceKm} km {within ? '· within limit' : `· exceeds ${maxKm} km limit`}
        </div>
      )}
      {typeof geo.collegeLat === 'number' &&
        typeof geo.collegeLng === 'number' &&
        typeof geo.hospitalLat === 'number' &&
        typeof geo.hospitalLng === 'number' && (
          <GeoProofMap
            college={[geo.collegeLat, geo.collegeLng]}
            hospital={[geo.hospitalLat, geo.hospitalLng]}
            distanceKm={geo.distanceKm ?? 0}
            withinLimit={within}
          />
        )}
    </div>
  );
}

function CoordPair({
  label,
  lat,
  lng,
  onLat,
  onLng,
  onPick,
}: {
  label: string;
  lat?: number;
  lng?: number;
  onLat: (v: string) => void;
  onLng: (v: string) => void;
  onPick: (lat: number, lng: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchErr(null);
    setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
      if (!data.length) {
        setSearchErr('No matching places found.');
        return;
      }
      setResults(
        data.map((d) => ({ label: d.display_name, lat: Number(d.lat), lng: Number(d.lon) })),
      );
    } catch (e) {
      setSearchErr((e as Error).message || 'Search failed.');
    } finally {
      setSearching(false);
    }
  }

  function choose(r: { label: string; lat: number; lng: number }) {
    onPick(Number(r.lat.toFixed(6)), Number(r.lng.toFixed(6)));
    setResults([]);
    setQuery(r.label.split(',')[0] ?? query);
  }

  return (
    <div className="rounded-lg border border-teal/15 bg-white p-2">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>

      {/* Place search → auto-fills coordinates */}
      <div className="relative mb-2">
        <div className="flex gap-1">
          <div className="relative flex-1">
            <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search place / address"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  runSearch();
                }
              }}
              className="w-full rounded-md border border-teal/20 bg-white py-1 pl-7 pr-2 text-xs text-ink focus:border-teal focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            disabled={searching || !query.trim()}
            className="shrink-0 rounded-md border border-teal/30 bg-teal-soft px-2 py-1 text-xs font-semibold text-teal-dark hover:bg-teal/10 disabled:opacity-50"
          >
            {searching ? '…' : 'Search'}
          </button>
        </div>
        {searchErr && <div className="mt-1 text-[10px] text-risk-high">{searchErr}</div>}
        {results.length > 0 && (
          <ul className="absolute z-[1000] mt-1 max-h-44 w-full overflow-auto rounded-md border border-teal/20 bg-white shadow-lg">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => choose(r)}
                  className="block w-full px-2 py-1.5 text-left text-[11px] text-ink hover:bg-teal-soft"
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={lat ?? ''}
          onChange={(e) => onLat(e.target.value)}
          className="w-full rounded-md border border-teal/20 bg-white px-2 py-1 text-xs text-ink focus:border-teal focus:outline-none"
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={lng ?? ''}
          onChange={(e) => onLng(e.target.value)}
          className="w-full rounded-md border border-teal/20 bg-white px-2 py-1 text-xs text-ink focus:border-teal focus:outline-none"
        />
      </div>
    </div>
  );
}

/** Structured inspection-proforma self-assessment grid. */
function ProformaInput({
  fields,
  values,
  onChange,
}: {
  fields: ProformaField[];
  values: Record<string, number | undefined>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="mt-2 space-y-1.5 pl-8">
      <p className="text-[11px] text-ink-muted">
        Declare your available figures against each norm. These are evaluated Required-vs-Available during inspection.
      </p>
      <div className="overflow-hidden rounded-lg border border-teal/15">
        <table className="w-full text-xs">
          <thead className="bg-ivory-200/70 text-ink-muted">
            <tr>
              <th className="px-2 py-1.5 text-left font-semibold">Parameter</th>
              <th className="px-2 py-1.5 text-right font-semibold">Required</th>
              <th className="px-2 py-1.5 text-right font-semibold">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal/8">
            {fields.map((f) => {
              const v = values[f.key];
              const ok =
                typeof v === 'number' && (f.comparator === 'gte' ? v >= f.requiredValue : v <= f.requiredValue);
              return (
                <tr key={f.key} className="bg-white">
                  <td className="px-2 py-1.5">
                    <div className="text-ink">{f.label}</div>
                    <div className="text-[10px] text-ink-muted">{f.section} · {f.unit}</div>
                  </td>
                  <td className="px-2 py-1.5 text-right text-ink-soft">
                    {f.comparator === 'lte' ? '≤ ' : '≥ '}
                    {f.requiredValue}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      step="any"
                      value={v ?? ''}
                      onChange={(e) => onChange(f.key, e.target.value)}
                      className={`w-24 rounded-md border px-2 py-1 text-right text-xs focus:outline-none ${
                        v === undefined
                          ? 'border-teal/20'
                          : ok
                            ? 'border-compliance/40 text-compliance'
                            : 'border-risk-high/40 text-risk-high'
                      }`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleActions({
  allowed,
  id,
  busy,
  onAct,
  submitBlockedReason,
}: {
  allowed: string[];
  id: string;
  busy: boolean;
  onAct: (fn: () => Promise<unknown>) => void;
  submitBlockedReason?: string;
}) {
  const can = (action: string) => allowed.includes(action);
  const buttons: { label: string; variant?: 'primary' | 'ghost' | 'danger' | 'success'; fn: () => Promise<unknown>; disabled?: boolean }[] = [];

  // Each button group is gated SOLELY by the presence of its canonical action
  // key in the server-computed `allowedActions`. Action keys mirror the backend
  // `domain/actions.ts` ACTIONS vocabulary — never role/state heuristics.
  if (can('APPLICATION_SUBMIT')) {
    buttons.push({
      label: 'Submit application',
      variant: 'primary',
      fn: () => api.post(`/applications/${id}/submit`),
      disabled: !!submitBlockedReason,
    });
  }
  if (can('SCRUTINY_PASS')) {
    buttons.push({ label: 'Pass scrutiny → schedule', variant: 'success', fn: () => api.post(`/scrutiny/${id}/pass`) });
  }
  if (can('SCRUTINY_CLARIFICATION_REQUEST')) {
    buttons.push({ label: 'Request clarification', variant: 'ghost', fn: () => api.post(`/scrutiny/${id}/clarification`, { reason: 'Missing documents' }) });
  }
  if (can('SCRUTINY_REJECT')) {
    buttons.push({ label: 'Reject (ineligible)', variant: 'danger', fn: () => api.post(`/scrutiny/${id}/reject`, { reason: 'Ineligible' }) });
  }
  if (can('INSPECTION_START')) {
    buttons.push({ label: 'Begin AI capture', variant: 'primary', fn: () => api.post(`/inspections/${id}/start`) });
  }
  if (can('ASSESSOR_SIGN_REPORT')) {
    buttons.push({ label: 'Sign report', variant: 'ghost', fn: () => api.post(`/assessor/${id}/sign-report`, { summary: 'Joint assessment complete' }) });
  }
  if (can('ASSESSOR_REPORT_REVIEW')) {
    buttons.push({ label: 'Submit to EC (needs dual sign)', variant: 'success', fn: () => api.post(`/assessor/${id}/submit-report`) });
  }
  if (can('OBSERVER_SIGNOFF')) {
    buttons.push({ label: 'Sign off (all findings)', variant: 'success', fn: () => api.post(`/observer/${id}/signoff`) });
  }
  if (can('EC_DECISION_RECORD')) {
    buttons.push({ label: 'Decide: ASK_COMPLIANCE', variant: 'ghost', fn: () => api.post(`/ec/${id}/decision`, { decision: 'ASK_COMPLIANCE', rationale: 'Curable deficiencies' }) });
    buttons.push({ label: 'Decide: APPROVE', variant: 'success', fn: () => api.post(`/ec/${id}/decision`, { decision: 'APPROVE', rationale: 'Compliant' }) });
    buttons.push({ label: 'Decide: REFUSE', variant: 'danger', fn: () => api.post(`/ec/${id}/decision`, { decision: 'REFUSE', rationale: 'Gross deficiencies' }) });
  }
  if (can('COMPLIANCE_TRIGGER_REVERIFICATION')) {
    buttons.push({ label: 'Trigger re-verification (WF7)', variant: 'primary', fn: () => api.post(`/compliance/${id}/trigger-reverification`) });
  }
  if (can('LOI_ISSUE')) {
    buttons.push({ label: 'Issue Letter of Intent', variant: 'primary', fn: () => api.post(`/government/${id}/issue-loi`) });
  }
  if (can('ADVERSE_ORDER_RECORD')) {
    buttons.push({ label: 'Refuse', variant: 'danger', fn: () => api.post(`/government/${id}/reject`, { reason: 'Adverse decision' }) });
  }
  if (can('LOP_ISSUE')) {
    buttons.push({ label: 'Issue LOP / Recognition → Approve', variant: 'success', fn: () => api.post(`/government/${id}/issue-lop`) });
  }

  if (buttons.length === 0) {
    return (
      <GlassPanel className="p-5 text-sm text-ink-muted">
        No actions are available to your role at this stage.
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="space-y-2 p-5">
      <div className="text-xs uppercase tracking-wider text-ink-muted">Your actions</div>
      {buttons.map((b) => (
        <GlowButton key={b.label} variant={b.variant} className="w-full" disabled={busy || b.disabled} onClick={() => onAct(b.fn)}>
          {b.label}
        </GlowButton>
      ))}
      {submitBlockedReason && (
        <p className="pt-1 text-xs text-saffron-deep">{submitBlockedReason}</p>
      )}
    </GlassPanel>
  );
}

/** Case Officer: assign ≥2 assessors + 1 observer, then approve the schedule. */
function CaseOfficerSchedule({ id, onDone }: { id: string; onDone: () => void }) {
  const qc = useQueryClient();
  const team = useQuery({
    queryKey: ['assignable', id],
    queryFn: () => api.get<{ assessors: any[]; observers: any[] }>(`/inspections/${id}/assignable`),
  });
  const assignment = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => api.get<any>(`/inspections/${id}/assignment`).catch(() => null),
  });
  const [picked, setPicked] = useState<string[]>([]);
  const [observer, setObserver] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const assign = useMutation({
    mutationFn: async () => {
      await api.post(`/inspections/${id}/assign-team`, {
        assessorIds: picked,
        observerId: observer,
        dates: ['2026-07-01', '2026-07-02'],
      });
      await api.post(`/inspections/${id}/approve-schedule`);
    },
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ['assignment', id] });
      onDone();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const approved = assignment.data?.approvedByCaseOfficer;
  if (approved) {
    return (
      <GlassPanel className="p-5">
        <div className="text-xs uppercase tracking-wider text-ink-muted">Inspection team</div>
        <p className="mt-2 text-sm font-semibold text-compliance">✓ Schedule approved — ready to start AI inspection.</p>
        <p className="mt-1 text-xs text-ink-muted">{assignment.data?.assessorIds?.length ?? 0} assessors · observer assigned</p>
      </GlassPanel>
    );
  }

  function toggle(idu: string) {
    setPicked((p) => (p.includes(idu) ? p.filter((x) => x !== idu) : [...p, idu]));
  }

  return (
    <GlassPanel className="space-y-3 p-5">
      <div className="text-xs uppercase tracking-wider text-ink-muted">Assign inspection team</div>
      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-risk-high">{err}</div>}
      <div>
        <div className="mb-1 text-[11px] font-semibold text-ink-soft">Assessors (pick ≥2)</div>
        <div className="space-y-1">
          {(team.data?.assessors ?? []).map((a) => (
            <label key={a.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${a.coi ? 'opacity-40' : 'border-teal/15'}`}>
              <input type="checkbox" disabled={a.coi} checked={picked.includes(a.id)} onChange={() => toggle(a.id)} className="h-4 w-4 accent-teal" />
              <span className="text-ink">{a.name}</span>
              {a.coi && <span className="ml-auto text-[10px] text-risk-high">COI</span>}
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1 text-[11px] font-semibold text-ink-soft">Observer</div>
        <select value={observer} onChange={(e) => setObserver(e.target.value)} className="w-full rounded-lg border border-teal/15 bg-white px-2.5 py-2 text-sm">
          <option value="">Select observer…</option>
          {(team.data?.observers ?? []).filter((o) => !o.coi).map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>
      <GlowButton
        variant="primary"
        className="w-full"
        disabled={assign.isPending || picked.length < 2 || !observer}
        onClick={() => assign.mutate()}
      >
        {assign.isPending ? 'Assigning…' : 'Assign team & approve schedule'}
      </GlowButton>
      {(picked.length < 2 || !observer) && (
        <p className="text-[11px] text-saffron-deep">
          {[
            picked.length < 2 ? `${2 - picked.length} more assessor${2 - picked.length === 1 ? '' : 's'}` : null,
            !observer ? 'an observer' : null,
          ]
            .filter(Boolean)
            .join(' and ')}
          {' required to enable assignment.'}
        </p>
      )}
    </GlassPanel>
  );
}

/** Government Authority: verify the performance bank guarantee (Reg 10/17/23)
 *  before issuing the LOP/Recognition. Amount must meet the required figure. */
function GovernmentBankGuarantee({ id, onDone }: { id: string; onDone: () => void }) {
  const qc = useQueryClient();
  const detail = useQuery({
    queryKey: ['gov-detail', id],
    queryFn: () => api.get<any>(`/government/${id}`),
  });
  const required = detail.data?.requiredBankGuarantee;
  const existing = detail.data?.application?.bankGuarantee;
  const verified = detail.data?.application?.bankGuaranteeVerified;

  const [amount, setAmount] = useState<string>('');
  const [bank, setBank] = useState('State Bank of India');
  const [reference, setReference] = useState('');
  const [validUpto, setValidUpto] = useState('2032-12-31');
  const [err, setErr] = useState<string | null>(null);

  // Prefill the amount with the required figure once known.
  useEffect(() => {
    if (required && amount === '') setAmount(String(required.applicable ? required.amountLakh : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [required?.amountLakh]);

  const verify = useMutation({
    mutationFn: () =>
      api.post(`/government/${id}/verify-bank-guarantee`, {
        amountLakh: Number(amount),
        bank,
        reference: reference || undefined,
        validUpto: validUpto || undefined,
      }),
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ['gov-detail', id] });
      onDone();
    },
    onError: (e: Error) => setErr(e.message),
  });

  if (verified) {
    return (
      <GlassPanel className="p-5">
        <div className="text-xs uppercase tracking-wider text-ink-muted">Performance bank guarantee</div>
        <p className="mt-2 text-sm font-semibold text-compliance">
          ✓ Verified — ₹{existing?.amountLakh ?? amount} lakh{existing?.bank ? ` · ${existing.bank}` : ''}
        </p>
        <p className="mt-1 text-xs text-ink-muted">You can now issue the LOP / Recognition.</p>
      </GlassPanel>
    );
  }

  if (required && !required.applicable) {
    return (
      <GlassPanel className="p-5">
        <div className="text-xs uppercase tracking-wider text-ink-muted">Performance bank guarantee</div>
        <p className="mt-2 text-sm text-ink-soft">Not applicable for this case. Verify to proceed to LOP.</p>
        <GlowButton variant="primary" className="mt-2 w-full" disabled={verify.isPending} onClick={() => verify.mutate()}>
          {verify.isPending ? 'Verifying…' : 'Mark verified'}
        </GlowButton>
      </GlassPanel>
    );
  }

  const below = !!required && Number(amount) < required.amountLakh;

  return (
    <GlassPanel className="space-y-3 p-5">
      <div className="text-xs uppercase tracking-wider text-ink-muted">Verify bank guarantee</div>
      {required && (
        <p className="text-xs text-ink-soft">
          Required: <span className="font-semibold text-ink">₹{required.amountLakh} lakh</span>
          {required.basis ? ` · ${required.basis}` : ''}
        </p>
      )}
      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-risk-high">{err}</div>}
      <div>
        <div className="mb-1 text-[11px] font-semibold text-ink-soft">Guarantee amount (₹ lakh)</div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`w-full rounded-lg border bg-white px-2.5 py-2 text-sm focus:outline-none ${below ? 'border-risk-high/50 text-risk-high' : 'border-teal/20 text-ink'}`}
        />
        {below && <p className="mt-1 text-[11px] text-risk-high">Must be at least ₹{required.amountLakh} lakh.</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-ink-soft">Issuing bank</div>
          <input value={bank} onChange={(e) => setBank(e.target.value)} className="w-full rounded-lg border border-teal/20 bg-white px-2.5 py-2 text-sm text-ink focus:outline-none" />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold text-ink-soft">Reference</div>
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="BG-2026-…" className="w-full rounded-lg border border-teal/20 bg-white px-2.5 py-2 text-sm text-ink focus:outline-none" />
        </div>
      </div>
      <div>
        <div className="mb-1 text-[11px] font-semibold text-ink-soft">Valid upto</div>
        <input type="date" value={validUpto} onChange={(e) => setValidUpto(e.target.value)} className="w-full rounded-lg border border-teal/20 bg-white px-2.5 py-2 text-sm text-ink focus:outline-none" />
      </div>
      <GlowButton
        variant="primary"
        className="w-full"
        disabled={verify.isPending || !amount || below}
        onClick={() => {
          setErr(null);
          verify.mutate();
        }}
      >
        {verify.isPending ? 'Verifying…' : 'Verify bank guarantee'}
      </GlowButton>
    </GlassPanel>
  );
}

/** Generated AI inspection report summary computed from persisted findings. */
function AIReportSummary({ findings }: { findings: any[] }) {
  const total = findings.length;
  const compliant = findings.filter((f) => f.aiVerdict === 'COMPLIANT').length;
  const deficient = findings.filter((f) => f.aiVerdict === 'DEFICIENT').length;
  const review = findings.filter((f) => f.status === 'NEEDS_HUMAN_REVIEW').length;
  const quarantined = findings.filter((f) => f.status === 'QUARANTINED').length;
  const avgConf = total
    ? Math.round((findings.reduce((s, f) => s + (f.confidence ?? 0), 0) / total) * 100)
    : 0;

  return (
    <GlassPanel className="mb-3 space-y-2 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-teal-dark">AI Inspection Report</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <ReportStat label="Findings" value={total} tone="ink" />
        <ReportStat label="Compliant" value={compliant} tone="good" />
        <ReportStat label="Deficient" value={deficient} tone="bad" />
        <ReportStat label="Needs review" value={review} tone="warn" />
        <ReportStat label="Avg confidence" value={`${avgConf}%`} tone="ink" />
      </div>
      {quarantined > 0 && (
        <p className="text-[11px] text-risk-high">
          {quarantined} finding(s) quarantined for integrity (geo/hash) — observer attention required.
        </p>
      )}
      <p className="text-[11px] text-ink-muted">
        Detected on-site via the in-browser COCO-SSD model. AI never approves or rejects — every finding is dispositioned by the Observer.
      </p>
    </GlassPanel>
  );
}

function ReportStat({ label, value, tone }: { label: string; value: number | string; tone: 'ink' | 'good' | 'bad' | 'warn' }) {
  const toneCls =
    tone === 'good' ? 'text-compliance' : tone === 'bad' ? 'text-risk-high' : tone === 'warn' ? 'text-saffron-deep' : 'text-ink';
  return (
    <div className="rounded-lg border border-teal/15 bg-white px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={`mt-0.5 text-lg font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}

/** Assessor / Case Officer: run the AI capture which generates findings and routes to the Observer. */
function AICapturePanel({ id, intake, onDone }: { id: string; intake?: number; onDone: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  const is100 = (intake ?? 0) >= 100;

  // Map a COCO-SSD detection summary → DantaDrishti proforma findings.
  function buildRequests(summary: DetectionSummary) {
    const peak = (label: string) => summary.aggregates.find((a) => a.label === label);
    const best = (label: string) => peak(label)?.bestScore ?? 0;
    const chairs = peak('chair')?.peakCount ?? 0;
    const persons = peak('person')?.peakCount ?? 0;
    const beds = peak('bed')?.peakCount ?? 0;
    const books = peak('book')?.peakCount ?? 0;
    const equipment = ['tv', 'laptop', 'keyboard', 'mouse', 'cell phone'].some((l) => (peak(l)?.peakCount ?? 0) > 0);
    const evidenceRef = `video/${summary.source}`;
    const conf = (...labels: string[]) => Math.max(0.6, ...labels.map(best));

    return [
      {
        category: 'dental_chairs_count',
        section: 'VIII. Major Equipment — Dental Chairs (Annexure II)',
        item: `Dental chairs detected in clinic walkthrough (${summary.source})`,
        requiredValue: is100 ? 200 : 100,
        detectedValue: chairs,
        confidence: conf('chair'),
        evidenceRef,
      },
      {
        category: 'faculty_attendance',
        section: 'VI. Dental Teaching Staff (Annexure III)',
        item: `Persons (faculty/staff) detected on-site (${summary.source})`,
        requiredValue: is100 ? 40 : 30,
        detectedValue: persons,
        confidence: conf('person'),
        evidenceRef,
      },
      {
        category: 'opd_patient_census',
        section: 'III. Clinical Material — OPD Census',
        item: `Persons observed in OPD/clinic as a footfall proxy (${summary.source})`,
        requiredValue: is100 ? 100 : 75,
        detectedValue: persons,
        confidence: conf('person'),
        evidenceRef,
      },
      {
        category: 'hospital_beds_count',
        section: 'Annexure I — Attached Hospital',
        item: `Hospital beds detected (${summary.source})`,
        requiredValue: 100,
        detectedValue: beds,
        confidence: conf('bed'),
        evidenceRef,
      },
      {
        category: 'library_books_journals_seating',
        section: 'VII. Central Library',
        item: `Library books / reading material detected (${summary.source})`,
        requiredValue: 10,
        detectedValue: books,
        confidence: conf('book'),
        evidenceRef,
      },
      {
        category: 'department_equipment_presence',
        section: 'IX. Dental Departments — Equipment',
        item: `Department equipment presence detected (${summary.source})`,
        requiredValue: true,
        detectedValue: equipment,
        confidence: conf('tv', 'laptop', 'keyboard', 'mouse', 'cell phone'),
        evidenceRef,
      },
    ];
  }

  const run = useMutation({
    mutationFn: async (summary: DetectionSummary) => {
      const sess = await api.post<{ id: string }>(`/ai-inspection/${id}/session`, {});
      await api.post(`/ai-inspection/${id}/findings`, {
        sessionId: sess.id,
        requests: buildRequests(summary),
      });
    },
    onSuccess: () => {
      setErr(null);
      onDone();
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <GlassPanel className="space-y-3 p-5">
      <div className="text-xs uppercase tracking-wider text-ink-muted">DantaDrishti AI capture</div>
      <p className="text-sm text-ink-soft">
        Run the on-site capture with the in-browser detector. It analyses the clinic video,
        counts dental chairs, staff, beds and equipment, then routes findings to the Observer
        and generates the AI inspection report.
      </p>
      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-risk-high">{err}</div>}
      <CocoSsdInspector busy={run.isPending} onComplete={(s) => run.mutate(s)} />
    </GlassPanel>
  );
}
