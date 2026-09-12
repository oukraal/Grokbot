export function Mark({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="7" className="stroke-primary/70" strokeWidth="1.2" />
      <rect x="6" y="6" width="20" height="20" rx="3.5" className="stroke-primary/40" strokeWidth="1" />
      <path
        d="M16 8.5 L16 23.5 M8.5 16 L23.5 16 M11.2 11.2 L20.8 20.8 M20.8 11.2 L11.2 20.8"
        className="stroke-primary"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2.1" className="fill-primary" />
    </svg>
  );
}
