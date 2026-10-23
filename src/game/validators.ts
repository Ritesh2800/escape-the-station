/**
 * Validators for Level 2 (Section 7.2)
 * Each rule is a pure function (password: string) => boolean
 * Target: @S2!E8
 */

const ALLOWED_SYMBOLS = ['#', '@', '!', '*', '&'];

/** Rule 1: CHAR_TYPES — exactly 6 chars, at least 1 letter, 1 digit, 1 symbol */
export function charTypes(pw: string): boolean {
  if (pw.length !== 6) return false;
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSymbol = ALLOWED_SYMBOLS.some((s) => pw.includes(s));
  return hasLetter && hasDigit && hasSymbol;
}

/** Rule 2: ANCHORS — char 1 is @ (Power Symbol Anchor), char 6 is 8 (Split Value) */
export function anchors(pw: string): boolean {
  if (pw.length < 1) return false;
  return pw[0] === '@' && (pw.length >= 6 ? pw[5] === '8' : false);
}

/** Rule 3: DIGIT_SUM — sum of all digit chars equals 10 */
export function digitSum(pw: string): boolean {
  const digits = pw.split('').filter((c) => /[0-9]/.test(c));
  if (digits.length === 0) return false;
  const sum = digits.reduce((acc, d) => acc + parseInt(d, 10), 0);
  return sum === 10;
}

/** Rule 4: SYMBOL_LOGIC — if @ present then # forbidden; ! must be present and immediately followed by E */
export function symbolLogic(pw: string): boolean {
  if (pw.includes('@') && pw.includes('#')) return false;
  const bangIdx = pw.indexOf('!');
  if (bangIdx === -1) return false;
  if (bangIdx >= pw.length - 1) return false;
  return pw[bangIdx + 1] === 'E';
}

/** Rule 5: STATION_ID — password contains the station code S2 */
export function stationId(pw: string): boolean {
  return pw.includes('S2');
}

/** All validators as an array for easy iteration */
export const VALIDATORS = [
  { id: 'CHAR_TYPES', label: 'Exactly 6 chars: letter + digit + symbol', fn: charTypes },
  { id: 'ANCHORS', label: 'Starts with Power Symbol, ends with Split Value', fn: anchors },
  { id: 'DIGIT_SUM', label: 'All digits sum to the Target Digit Sum', fn: digitSum },
  { id: 'SYMBOL_LOGIC', label: '@ forbids #; ! must precede Engine Vowel', fn: symbolLogic },
  { id: 'STATION_ID', label: 'Contains the Station Sector Code', fn: stationId },
] as const;

/** Run all validators, returns Record<id, boolean> */
export function validateAll(pw: string): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  for (const v of VALIDATORS) {
    results[v.id] = v.fn(pw);
  }
  return results;
}

/** Level 1 segment validators */
export function validateLevel1Segments(code: string): Record<string, 'pending' | 'pass' | 'fail'> {
  const results: Record<string, 'pending' | 'pass' | 'fail'> = {
    PLATFORM: 'pending',
    RULEBOOK: 'pending',
    BOXCAR: 'pending',
  };
  
  if (code.length >= 2) {
    results.PLATFORM = code.substring(0, 2) === '07' ? 'pass' : 'fail';
  }
  if (code.length >= 4) {
    results.RULEBOOK = code.substring(2, 4) === '25' ? 'pass' : 'fail';
  }
  if (code.length >= 6) {
    results.BOXCAR = code.substring(4, 6) === '16' ? 'pass' : 'fail';
  }
  
  return results;
}
