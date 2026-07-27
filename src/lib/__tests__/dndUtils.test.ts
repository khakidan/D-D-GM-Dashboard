import { describe, it, expect } from 'vitest';
import { crToNumber } from '../dndUtils';

describe('crToNumber', () => {
  it('correctly parses integer CRs', () => {
    expect(crToNumber('0')).toBe(0);
    expect(crToNumber('1')).toBe(1);
    expect(crToNumber('10')).toBe(10);
    expect(crToNumber('20')).toBe(20);
  });

  it('correctly parses fractional CRs', () => {
    expect(crToNumber('1/8')).toBe(0.125);
    expect(crToNumber('1/4')).toBe(0.25);
    expect(crToNumber('1/2')).toBe(0.5);
  });

  it('correctly parses decimal CRs', () => {
    expect(crToNumber('0.125')).toBe(0.125);
    expect(crToNumber('0.25')).toBe(0.25);
    expect(crToNumber('0.5')).toBe(0.5);
  });

  it('handles whitespace', () => {
    expect(crToNumber(' 1/4 ')).toBe(0.25);
    expect(crToNumber(' 10 ')).toBe(10);
  });

  it('handles null, undefined, or empty strings', () => {
    expect(crToNumber(null)).toBe(0);
    expect(crToNumber(undefined)).toBe(0);
    expect(crToNumber('')).toBe(0);
  });

  it('handles invalid strings by returning 0', () => {
    expect(crToNumber('invalid')).toBe(0);
    expect(crToNumber('1/0')).toBe(0);
  });

  it('can be used to sort CRs correctly', () => {
    const crs = ['20', '1', '1/4', '10', '0', '1/2', '1/8'];
    const sorted = [...crs].sort((a, b) => crToNumber(a) - crToNumber(b));
    expect(sorted).toEqual(['0', '1/8', '1/4', '1/2', '1', '10', '20']);
  });
});
