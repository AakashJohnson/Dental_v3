/**
 * MinimalPaperTexture — a whisper-faint horizontal rule texture for document /
 * regulation (archive) pages. Static, ~4% opacity. No icons, no repeats that
 * read as a pattern.
 */
export function MinimalPaperTexture({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-[#fffdf8]" />
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.04,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(28,39,51,0.6) 0, rgba(28,39,51,0.6) 1px, transparent 1px, transparent 26px)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.05), transparent 35%)' }}
      />
    </div>
  );
}
