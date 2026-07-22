export function formatNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) 
    return `${names[0]} and ${names[1]}`;
  const last = names[names.length - 1];
  const rest = names.slice(0, -1).join(', ');
  return `${rest}, and ${last}`;
}

// Formats a numeric modifier/bonus with an explicit sign.
// Zero displays as '+0'. Uses a true minus sign (−) for negatives, not a hyphen.
export function formatBonus(val: number): string {
  if (val >= 0) return `+${val}`;
  return `\u2212${Math.abs(val)}`;
}

export interface ParseCommaSeparatedListOptions {
  toLowerCase?: boolean;
}

export function parseCommaSeparatedList(
  input: string | null | undefined,
  options: ParseCommaSeparatedListOptions = {}
): string[] {
  if (!input) return [];
  const parts = input.split(',').map(s => s.trim());
  if (options.toLowerCase) {
    return parts.map(s => s.toLowerCase()).filter(Boolean);
  }
  return parts.filter(Boolean);
}

/**
 * Converts a 1-based column number to a spreadsheet column letter (e.g. 1 -> A, 26 -> Z, 27 -> AA)
 */
export function getColumnLetter(colNum: number): string {
  let letter = '';
  let temp = colNum;
  while (temp > 0) {
    const modulo = (temp - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    temp = Math.floor((temp - modulo) / 26);
  }
  return letter;
}
