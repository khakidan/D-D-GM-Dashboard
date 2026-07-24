import { describe, it, expect } from 'vitest';
import { reconstructChallengeRating } from '../challengeRatingRepair';

describe('reconstructChallengeRating', () => {
  it('reconstructs 1/4 from US MM/DD date (Jan 4, 2026 -> 46026)', () => {
    const result = reconstructChallengeRating(46026);
    expect(result.match).toBe('1/4');
    expect(result.ambiguous).toEqual([]);
  });

  it('reconstructs 1/4 from non-US DD/MM date (Apr 1, 2026 -> 46113)', () => {
    const result = reconstructChallengeRating(46113);
    expect(result.match).toBe('1/4');
    expect(result.ambiguous).toEqual([]);
  });

  it('reconstructs 1/8 from US MM/DD date (Jan 8, 2026 -> 46030)', () => {
    const result = reconstructChallengeRating(46030);
    expect(result.match).toBe('1/8');
    expect(result.ambiguous).toEqual([]);
  });

  it('reconstructs 1/2 from US MM/DD date (Jan 2, 2026 -> 46024)', () => {
    const result = reconstructChallengeRating(46024);
    expect(result.match).toBe('1/2');
    expect(result.ambiguous).toEqual([]);
  });
  
  it('reconstructs 1/2 from non-US DD/MM date (Feb 1, 2026 -> 46054)', () => {
    const result = reconstructChallengeRating(46054);
    expect(result.match).toBe('1/2');
    expect(result.ambiguous).toEqual([]);
  });

  it('returns null for non-date serials', () => {
    const result = reconstructChallengeRating(5);
    expect(result.match).toBeNull();
  });
  
  it('returns null for date serials that do not match valid CRs (Jan 1, 2026 -> 46023)', () => {
    const result = reconstructChallengeRating(46023);
    expect(result.match).toBeNull();
  });
});
