import { describe, it, expect } from 'vitest';
import { formatNames, parseCommaSeparatedList } from '../stringUtils';

describe('formatNames', () => {
  it('returns empty string for empty array', () => {
    expect(formatNames([])).toBe('');
  });

  it('formats a single name', () => {
    expect(formatNames(['Alice'])).toBe('Alice');
  });

  it('formats two names with "and"', () => {
    expect(formatNames(['Alice', 'Bob'])).toBe('Alice and Bob');
  });

  it('formats three names with commas and an Oxford comma', () => {
    expect(formatNames(['Alice', 'Bob', 'Charlie'])).toBe('Alice, Bob, and Charlie');
  });

  it('formats more than three names with commas and an Oxford comma', () => {
    expect(formatNames(['Alice', 'Bob', 'Charlie', 'Diana'])).toBe('Alice, Bob, Charlie, and Diana');
  });
});

describe('parseCommaSeparatedList', () => {
  it('handles null, undefined, or empty strings', () => {
    expect(parseCommaSeparatedList(null)).toEqual([]);
    expect(parseCommaSeparatedList(undefined)).toEqual([]);
    expect(parseCommaSeparatedList('')).toEqual([]);
    expect(parseCommaSeparatedList('   ')).toEqual([]);
  });

  it('parses a clean comma-separated list', () => {
    expect(parseCommaSeparatedList('Alice,Bob,Charlie')).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('trims whitespace', () => {
    expect(parseCommaSeparatedList('  Alice  ,   Bob,Charlie   ')).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('filters empty strings and handles double commas', () => {
    expect(parseCommaSeparatedList('Alice,,Bob, ,Charlie')).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('converts to lowercase if option set', () => {
    expect(parseCommaSeparatedList('Alice, Bob, Charlie', { toLowerCase: true })).toEqual(['alice', 'bob', 'charlie']);
  });
});

