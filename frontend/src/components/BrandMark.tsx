interface BrandMarkProps {
  className?: string
}

export function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <span className={`brand-mark ${className}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none" focusable="false">
        {/* A D-shaped day frame, with a sunrise above a completed task. */}
        <path d="M6 4H15C22.2 4 28 9.4 28 16S22.2 28 15 28H6V4Z" fill="#273f34" />
        <path d="M11 16A6 6 0 0 1 23 16H11Z" fill="#e7b66f" />
        <path d="M17 7V8M10 10L11 11M24 10L23 11" stroke="#e7b66f" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 21L14.5 24L22 18.5" stroke="#e5efc4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
