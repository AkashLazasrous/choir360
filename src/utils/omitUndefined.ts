/**
 * Recursively drop `undefined` values so Firestore setDoc/updateDoc never
 * receives nested undefined (client SDK rejects them).
 */
export function omitUndefinedDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => omitUndefinedDeep(item)) as T;
  }
  // Leave non-plain objects (Date, Timestamp, FieldValue, etc.) intact.
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return value;
  }

  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (child === undefined) continue;
    out[key] = omitUndefinedDeep(child);
  }
  return out as T;
}

/** Keep only defined optional string/number fields (empty string → omitted). */
export function optionalString(value: string | undefined | null): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed ? trimmed : undefined;
}

export function optionalNumber(value: number | undefined | null): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
