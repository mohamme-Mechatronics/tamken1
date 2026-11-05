// Tamken wordmark, drawn in the same two-line lockup as the old ACTES logo:
// heavy Latin brand name on top with the first letter + accent tick in solar
// gold, Arabic brand name and tagline underneath. Non-highlight parts use
// currentColor so the parent's text colour controls them (dark header bar vs.
// light card). compact keeps the tagline but shrinks it for tight rows like the
// header.

export function BrandMark({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={`inline-flex select-none flex-col items-center leading-none ${className}`}
      dir="rtl"
      aria-label="تمكين لحلول الطاقة"
    >
      <span className="relative inline-block font-brand text-[1em] tracking-[0.01em]" dir="ltr">
        <span className="absolute -top-[0.36em] left-[0.10em] h-[0.28em] w-[0.10em] rotate-[22deg] rounded-[0.04em] bg-accent" />
        <span className="text-accent">T</span>
        <span>AMKEN</span>
      </span>
      <span className={`mt-[0.22em] flex items-center gap-[0.4em] font-bold whitespace-nowrap ${compact ? "text-[0.46em]" : "text-[0.40em]"}`}>
        <span className="text-accent">تمكين</span>
        <span>لحلول الطاقة</span>
      </span>
    </span>
  );
}
