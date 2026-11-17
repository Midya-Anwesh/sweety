export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="18" fill="hsl(var(--ink))" />
      <path d="M32 12c8 11 13 19 13 27a13 13 0 0 1-26 0c0-8 5-16 13-27z" fill="hsl(var(--paper))" />
      <circle cx="32" cy="40" r="5" fill="hsl(var(--accent))" />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <BrandMark />
      <span className="brand-word">Sweety</span>
    </span>
  );
}
