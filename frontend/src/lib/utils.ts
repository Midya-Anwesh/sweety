export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function codePointLength(value: string): number {
  return Array.from(value).length;
}

export function formatAverage(value: number | null): string {
  return value === null ? '-' : value.toFixed(1);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => Array.from(p)[0] ?? '').join('') || '?').toUpperCase();
}
