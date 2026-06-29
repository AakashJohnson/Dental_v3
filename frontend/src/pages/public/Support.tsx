import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Mail, Phone, ChevronDown, Search } from 'lucide-react';
import { SectionHead } from '../../design-system/components';

const FAQ = [
  { q: 'Which workflow should I select?', a: 'New/unregistered institutions can only start Workflow 1 (New College). Existing recognised colleges access Workflows 2–6. Workflow 7 (Compliance Verification) is system-generated only.' },
  { q: 'How do I track my application?', a: 'Use the Track Application page with your reference code (e.g. shown on submission). You will see the current stage and history.' },
  { q: 'What documents must be valid for the session?', a: 'Essentiality Certificate, University Affiliation, Hospital/Medical-College MOU, Bank Guarantee and Fire/AERB certificates are gating documents and block progression on expiry.' },
  { q: 'How does AI inspection work?', a: 'DantaDrishti captures geo-tagged evidence on-site, auto-detects facts (chairs, beds, attendance, census), and an observer verifies every finding before the assessor signs the report.' },
  { q: 'Who makes the final decision?', a: 'The Expert Committee recommends using a fixed vocabulary; the Government Authority issues the LOI and then LOP/Recognition. AI never approves or rejects.' },
];

export function Support() {
  const [open, setOpen] = useState<number | null>(0);
  const [q, setQ] = useState('');
  const items = FAQ.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <SectionHead eyebrow="Help & Support" title="We are here to help" subtitle="Find answers, or reach the NDC/DARB secretariat." />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: <Mail size={18} />, t: 'Email', v: 'support@ndc.gov.in' },
          { icon: <Phone size={18} />, t: 'Helpline', v: '1800-XXX-XXXX' },
          { icon: <LifeBuoy size={18} />, t: 'Hours', v: 'Mon–Fri · 9:30–18:00' },
        ].map((c) => (
          <div key={c.t} className="gov-card-solid p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-soft text-teal-dark">{c.icon}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-ink-muted">{c.t}</div>
            <div className="font-semibold text-ink">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 rounded-xl border border-teal/20 bg-white px-3 py-2 shadow-card">
        <Search size={16} className="text-ink-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help topics…" className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted" />
      </div>

      <div className="mt-4 space-y-2">
        {items.map((f, i) => (
          <div key={f.q} className="gov-card-solid overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <span className="font-semibold text-ink">{f.q}</span>
              <ChevronDown size={16} className={`text-teal transition ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <div className="border-t border-teal/8 px-4 py-3 text-sm text-ink-soft">{f.a}</div>}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-teal-dark p-6 text-center text-white">
        <p className="font-semibold">Still need help?</p>
        <Link to="/login" className="mt-3 inline-block rounded-xl bg-saffron px-5 py-2.5 text-sm font-semibold text-white hover:bg-saffron-deep">Sign in to raise a ticket</Link>
      </div>
    </div>
  );
}
