/**
 * SectionGlow — a single soft radial glow you can drop behind an individual
 * section (e.g. a stats strip or feature panel) to add depth without page-wide
 * clutter. Absolutely positioned; place inside a `relative` section.
 */
export function SectionGlow({
  tone = 'blue',
  position = 'top',
  className = '',
}: {
  tone?: 'blue' | 'teal' | 'saffron';
  position?: 'top' | 'center' | 'left' | 'right';
  className?: string;
}) {
  const color =
    tone === 'teal' ? 'rgba(20,184,166,0.10)' : tone === 'saffron' ? 'rgba(245,158,11,0.08)' : 'rgba(37,99,235,0.10)';
  const pos =
    position === 'center'
      ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
      : position === 'left'
        ? 'left-0 top-1/2 -translate-y-1/2'
        : position === 'right'
          ? 'right-0 top-1/2 -translate-y-1/2'
          : 'left-1/2 top-0 -translate-x-1/2';
  return (
    <div
      className={`pointer-events-none absolute h-72 w-[36rem] rounded-full blur-3xl ${pos} ${className}`}
      style={{ background: color }}
      aria-hidden
    />
  );
}
