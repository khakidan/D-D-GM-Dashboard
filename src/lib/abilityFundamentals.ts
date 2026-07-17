// Foundational ability-score primitives with zero internal dependencies.
//
// Extracted out of abilityScores.ts specifically to break a circular import
// with spellcasting.ts: spellcasting.ts needs abilitiesInOrder/AbilityName/
// calculateModifier/proficiencyBonusFromLevel, while abilityScores.ts needs
// SpellcastingAbility/parseSpellcastingAbility from spellcasting.ts. Neither
// side of that relationship actually depends on anything below — this file
// exists purely so both can import these 4 symbols from a common, dependency-free
// source instead of from each other.
//
// abilityScores.ts re-exports everything here, so all existing consumers
// importing from '../lib/abilityScores' are unaffected by this split.

export const abilitiesInOrder = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;

export type AbilityName = typeof abilitiesInOrder[number];

// floor((score - 10) / 2)
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Standard 5e table:
// Levels 1-4: +2, 5-8: +3, 9-12: +4,
// 13-16: +5, 17-20: +6
// Clamps: below 1 → +2, above 20 → +6
export function proficiencyBonusFromLevel(level: number): number {
  const lvl = Math.max(1, Math.min(20, level));
  if (lvl <= 4) return 2;
  if (lvl <= 8) return 3;
  if (lvl <= 12) return 4;
  if (lvl <= 16) return 5;
  return 6;
}