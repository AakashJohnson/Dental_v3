/**
 * SoftDashboardDepth — a very calm command-centre base for dashboards: a single
 * soft role-colored glow at the top and a barely-there grid. Minimal motion so
 * it never competes with data tables and charts.
 */
export function SoftDashboardDepth({ accent = 'rgba(37,99,235,0.08)', className = '' }: { accent?: string; className?: string }) {
  void accent;
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.025) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
      />
    </div>
  );
}
