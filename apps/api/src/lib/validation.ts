/** Parse a date string from query params. Returns null if invalid. */
export function parseDate(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/** Parse a positive integer from query params. Returns fallback if invalid. */
export function parsePositiveInt(value: string | undefined, fallback: number, max?: number): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) return fallback
  return max !== undefined ? Math.min(n, max) : n
}
