import { describe, it, expect } from 'vitest';
import { resetActionUsages } from '../actionUsages';

describe('resetActionUsages', () => {
  it('returns "[]" for undefined, empty, or malformed JSON', () => {
    expect(resetActionUsages(undefined, 'short')).toBe('[]');
    expect(resetActionUsages('', 'short')).toBe('[]');
    expect(resetActionUsages('   ', 'short')).toBe('[]');
    expect(resetActionUsages('{ "not": "an array" }', 'short')).toBe('[]');
    expect(resetActionUsages('malformed json', 'short')).toBe('[]');
  });

  it('resets items with usesReset === "short" on a short rest', () => {
    const input = JSON.stringify([
      { name: 'Short Rest Ability', maxUses: 3, currentUses: 0, usesReset: 'short' },
      { name: 'Long Rest Ability', maxUses: 3, currentUses: 0, usesReset: 'long' },
      { name: 'Manual Ability', maxUses: 3, currentUses: 0, usesReset: 'none' },
      { name: 'No Tracking', description: 'Just text' }
    ]);

    const result = resetActionUsages(input, 'short');
    const parsed = JSON.parse(result);

    expect(parsed[0].currentUses).toBe(3); // Reset
    expect(parsed[1].currentUses).toBe(0); // Untouched
    expect(parsed[2].currentUses).toBe(0); // Untouched
    expect(parsed[3]).not.toHaveProperty('currentUses'); // Untouched
  });

  it('resets items with usesReset === "short" or "long" on a long rest', () => {
    const input = JSON.stringify([
      { name: 'Short Rest Ability', maxUses: 3, currentUses: 0, usesReset: 'short' },
      { name: 'Long Rest Ability', maxUses: 3, currentUses: 0, usesReset: 'long' },
      { name: 'Manual Ability', maxUses: 3, currentUses: 0, usesReset: 'none' },
      { name: 'No Tracking', description: 'Just text' }
    ]);

    const result = resetActionUsages(input, 'long');
    const parsed = JSON.parse(result);

    expect(parsed[0].currentUses).toBe(3); // Reset
    expect(parsed[1].currentUses).toBe(3); // Reset
    expect(parsed[2].currentUses).toBe(0); // Untouched
    expect(parsed[3]).not.toHaveProperty('currentUses'); // Untouched
  });

  it('returns the exact same string if no items need resetting', () => {
    const input = JSON.stringify([
      { name: 'Short Rest Ability', maxUses: 3, currentUses: 3, usesReset: 'short' },
      { name: 'No Tracking', description: 'Just text' }
    ]);

    const result = resetActionUsages(input, 'short');
    expect(result).toBe(input); // String reference is identical (no re-serialization)
  });
});
