/**
 * Converts a Challenge Rating string (e.g. "0", "1/8", "1/4", "1/2", "1", "10", "20")
 * into a comparable numeric value.
 */
export function crToNumber(cr: string | undefined | null): number {
  if (!cr) return 0;
  
  const trimmed = cr.trim();
  if (trimmed === '') return 0;

  // Handle fractions like "1/8", "1/4", "1/2"
  if (trimmed.includes('/')) {
    const [numerator, denominator] = trimmed.split('/').map(Number);
    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  // Handle standard numbers or decimals
  const num = Number(trimmed);
  return isNaN(num) ? 0 : num;
}
