/**
 * Member portal login helpers.
 * Password for registered members is their date of birth as DDMMYYYY.
 */

/** Convert ISO date `YYYY-MM-DD` → login password `DDMMYYYY`. */
export function dobToPassword(dob: string): string {
  const trimmed = dob.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    throw new Error('Date of birth must be in YYYY-MM-DD format.');
  }
  const [, year, month, day] = match;
  return `${day}${month}${year}`;
}

/** Strip non-digits for mobile matching (e.g. +91 98765 43210 → 919876543210). */
export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '');
}

/** True when the identifier looks like an email rather than a phone number. */
export function looksLikeEmail(identifier: string): boolean {
  return identifier.includes('@');
}
