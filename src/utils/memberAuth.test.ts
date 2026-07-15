import { describe, expect, it } from 'vitest';
import { dobToPassword, looksLikeEmail, normalizeMobile } from './memberAuth';

describe('dobToPassword', () => {
  it('converts ISO date to DDMMYYYY', () => {
    expect(dobToPassword('2000-01-01')).toBe('01012000');
    expect(dobToPassword('1995-12-31')).toBe('31121995');
  });

  it('rejects invalid formats', () => {
    expect(() => dobToPassword('01-01-2000')).toThrow();
    expect(() => dobToPassword('')).toThrow();
  });
});

describe('normalizeMobile', () => {
  it('keeps digits only', () => {
    expect(normalizeMobile('+91 98765-43210')).toBe('919876543210');
    expect(normalizeMobile('9876543210')).toBe('9876543210');
  });
});

describe('looksLikeEmail', () => {
  it('detects email vs mobile', () => {
    expect(looksLikeEmail('antony@gmail.com')).toBe(true);
    expect(looksLikeEmail('9876543210')).toBe(false);
  });
});
