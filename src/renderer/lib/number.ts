export function sanitizeNumber(value: string, fallback: number, min = 0) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(min, parsed);
}
