import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Building2, GraduationCap, Map as MapIcon } from 'lucide-react';
import { SectionHead, StatusPill } from '../../design-system/components';
import { RealInspectionMap } from '../../components/maps/RealInspectionMap';
import { MapFilterPanel, DEFAULT_FILTERS, applyMapFilters } from '../../components/maps/MapFilterPanel';
import { PageBackground } from '../../components/visuals/AnimatedBackgrounds';
import { ChartCard, BarChartCard, C } from '../../components/charts';
import { hx } from '../../design-system/effects/hoverEffects';
import { revealUp, scrollViewport } from '../../design-system/motion/scrollReveal';
import { MAP_MARKERS, STATE_APPLICATIONS, INSPECTION_DENSITY } from '../../data/demoMapData';
import { api } from '../../lib/api';

interface PublicCollege {
  id: string;
  name: string;
  state: string;
  city: string;
  status: string;
  courses: { course: string; intake: number }[];
  geo: { lat: number; lng: number };
  latestState: string | null;
  latestWorkflow: string | null;
  applications: number;
}

const STATUS_LABEL: Record<string, string> = { NEW: 'Proposed', REGISTERED: 'Registered', APPROVED: 'Approved', RECOGNIZED: 'Recognized' };

export function Colleges() {
  const { data = [], isLoading } = useQuery({ queryKey: ['public-colleges'], queryFn: () => api.get<PublicCollege[]>('/public/colleges') });
  const [q, setQ] = useState('');
  const [stateF, setStateF] = useState('');
  const [statusF, setStatusF] = useState('');
  const [mapFilters, setMapFilters] = useState(DEFAULT_FILTERS);

  const states = useMemo(() => Array.from(new Set(data.map((c) => c.state))).sort(), [data]);
  const filtered = data.filter(
    (c) =>
      (!q || `${c.name} ${c.city} ${c.state}`.toLowerCase().includes(q.toLowerCase())) &&
      (!stateF || c.state === stateF) &&
      (!statusF || c.status === statusF),
  );
  const mapMarkers = useMemo(() => applyMapFilters(MAP_MARKERS, mapFilters), [mapFilters]);

  return (
    <div className="relative">
      <PageBackground variant="colleges" />

      {/* MAP-FIRST HERO — real interactive tile map is the page hero */}
      <section className="mx-auto max-w-7xl px-4 pt-12">
        <SectionHead eyebrow="Directory · map-first" title="Dental college inspection coverage" subtitle="A real interactive national map of dental colleges, live inspection status, and risk — pan, zoom, filter and click any marker." />

        <motion.div variants={revealUp} initial="hidden" whileInView="show" viewport={scrollViewport} className="mt-7 grid gap-5 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className={`gov-card p-3 ${hx.mapCard}`}>
              <div className="mb-2.5 flex items-center justify-between px-1">
                <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink"><MapIcon size={16} className="text-teal" /> National inspection map</h3>
                <span className="text-[11px] text-ink-muted">{mapMarkers.length} colleges · cluster · risk heat · route</span>
              </div>
              <RealInspectionMap markers={mapMarkers} height={520} showHeat showRoute />
            </div>
          </div>
          <div className="space-y-4">
            <MapFilterPanel markers={MAP_MARKERS} filters={mapFilters} onChange={setMapFilters} />
            <ChartCard title="Applications by state"><BarChartCard data={STATE_APPLICATIONS.slice(0, 6)} x="state" y="value" color={C.teal} horizontal height={170} /></ChartCard>
          </div>
        </motion.div>
      </section>

      {/* Inspection load chart strip */}
      <section className="mx-auto max-w-7xl px-4 pt-8">
        <ChartCard title="Inspection load" subtitle="Completed inspections by month"><BarChartCard data={INSPECTION_DENSITY} x="month" y="inspections" color={C.royal} height={170} /></ChartCard>
      </section>

      {/* Searchable directory list */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-teal/20 bg-white px-3 py-2 shadow-card">
            <Search size={16} className="text-ink-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search colleges, city, state…" className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted" />
          </div>
          <select value={stateF} onChange={(e) => setStateF(e.target.value)} className="rounded-xl border border-teal/20 bg-white px-3 py-2 text-sm text-ink">
            <option value="">All States</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="rounded-xl border border-teal/20 bg-white px-3 py-2 text-sm text-ink">
            <option value="">All Status</option>
            {Object.keys(STATUS_LABEL).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-ink-muted">Loading directory…</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                variants={revealUp}
                initial="hidden"
                whileInView="show"
                viewport={scrollViewport}
                transition={{ delay: (i % 6) * 0.04 }}
                className={`gov-card-solid p-4 ${hx.card}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-soft text-teal-dark"><Building2 size={16} /></div>
                    <div>
                      <div className="font-semibold leading-tight text-ink">{c.name}</div>
                      <div className="flex items-center gap-1 text-[12px] text-ink-muted"><MapPin size={11} /> {c.city}, {c.state}</div>
                    </div>
                  </div>
                  <span className="rounded-md bg-royal-soft px-2 py-0.5 text-[10px] font-bold text-royal-dark">{STATUS_LABEL[c.status] ?? c.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {c.courses.map((co) => (
                    <span key={co.course} className="inline-flex items-center gap-1 rounded-md bg-ivory-200 px-2 py-0.5 text-[11px] font-medium text-ink-soft"><GraduationCap size={11} /> {co.course} · {co.intake}</span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {c.latestState ? <StatusPill state={c.latestState} /> : <span className="text-[12px] text-ink-muted">No active case</span>}
                  <span className="text-[11px] text-ink-muted">{c.applications} application{c.applications === 1 ? '' : 's'}</span>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-16 text-center text-ink-muted">No colleges match your filters.</div>}
          </div>
        )}
      </section>
    </div>
  );
}
