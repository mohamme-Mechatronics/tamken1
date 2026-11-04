// Tamken wordmark, drawn in the same two-line lockup as the old ACTES logo:
// heavy Latin brand name on top with the first letter + accent tick in red,
// Arabic brand name and tagline underneath. Non-red parts use currentColor so
// the parent's text colour controls them (dark header bar vs. light card).

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex select-none flex-col items-center leading-none ${className}`}
      dir="rtl"
      aria-label="تمكين لأنظمة الطاقة وحلولها"
    >
      <span className="relative inline-block font-brand text-[1em] tracking-[0.01em]" dir="ltr">
        <span className="absolute -top-[0.36em] left-[0.10em] h-[0.28em] w-[0.10em] rotate-[22deg] rounded-[0.04em] bg-primary" />
        <span className="text-primary">T</span>
        <span>AMKEN</span>
      </span>
      <span className="mt-[0.22em] flex items-center gap-[0.4em] text-[0.40em] font-bold whitespace-nowrap">
        <span className="text-primary">تمكين</span>
        <span>لأنظمة الطاقة وحلولها</span>
      </span>
    </span>
  );
}
