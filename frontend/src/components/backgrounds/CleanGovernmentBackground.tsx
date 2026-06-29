/**
 * CleanGovernmentBackground — the calm base layer for every page. A soft, even
 * white→pale-blue gradient. No color glows, no motion, no patterns; it simply
 * supports the content above it.
 */
export function CleanGovernmentBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f6f9fd] to-[#eef3fb]" />
    </div>
  );
}
