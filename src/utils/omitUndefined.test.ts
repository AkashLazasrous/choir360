import { describe, expect, it } from 'vitest';
import { omitUndefinedDeep, optionalNumber, optionalString } from './omitUndefined';

describe('omitUndefinedDeep', () => {
  it('removes nested undefined while keeping null and 0', () => {
    const cleaned = omitUndefinedDeep({
      a: 1,
      b: undefined,
      nested: {
        notes: undefined,
        amount: 0,
        whoPaid: null,
        deep: { x: undefined, y: 'ok' },
      },
      list: [{ a: undefined, b: 2 }, 3],
    });
    expect(cleaned).toEqual({
      a: 1,
      nested: {
        amount: 0,
        whoPaid: null,
        deep: { y: 'ok' },
      },
      list: [{ b: 2 }, 3],
    });
  });

  it('leaves Date instances alone', () => {
    const d = new Date('2026-07-20T00:00:00.000Z');
    expect(omitUndefinedDeep({ when: d })).toEqual({ when: d });
  });
});

describe('optional helpers', () => {
  it('omits blank strings and invalid numbers', () => {
    expect(optionalString('  hi  ')).toBe('hi');
    expect(optionalString('   ')).toBeUndefined();
    expect(optionalNumber(12)).toBe(12);
    expect(optionalNumber(Number.NaN)).toBeUndefined();
  });
});
