import { describe, it, expect } from 'vitest';
import { findStaleAutomatedValues, recalculateAutomatedValues } from '../automation';
import { AbilityScores } from '../abilityScores';
import { NpcAction } from '../../types';

describe('automation helpers', () => {
  const abilityScores: AbilityScores = {
    STR: 18, // +4
    DEX: 14, // +2
    CON: 16, // +3
    INT: 10, // 0
    WIS: 12, // +1
    CHA: 8,  // -1
  };
  const proficiencyBonus = 3;

  it('detects a DC-stale case when dcAutoComputed is true and saveDC differs from formula', () => {
    // Formula: 8 + 3 (pb) + 1 (wis mod) = 12. Stored saveDC = 10.
    const actions: NpcAction[] = [
      {
        name: 'Bite',
        description: 'Bite attack',
        dcAutoComputed: true,
        dcAbilities: ['WIS'],
        saveDC: 10,
      },
    ];

    expect(findStaleAutomatedValues(actions, abilityScores, proficiencyBonus)).toBe(1);

    const recalculated = recalculateAutomatedValues(actions, abilityScores, proficiencyBonus);
    expect(recalculated[0].saveDC).toBe(12);
  });

  it('detects an Atk-stale case when atkAutoComputed is true and attackBonus differs from formula', () => {
    // Formula: 3 (pb) + 4 (str mod) = 7. Stored attackBonus = 5.
    const actions: NpcAction[] = [
      {
        name: 'Claw',
        description: 'Claw attack',
        atkAutoComputed: true,
        atkAbility: 'STR',
        attackBonus: 5,
      },
    ];

    expect(findStaleAutomatedValues(actions, abilityScores, proficiencyBonus)).toBe(1);

    const recalculated = recalculateAutomatedValues(actions, abilityScores, proficiencyBonus);
    expect(recalculated[0].attackBonus).toBe(7);
  });

  it('detects a damage-bonus-stale case and re-compiles the damage string', () => {
    // Formula: str mod = 4. Stored bonus = 2.
    const actions: NpcAction[] = [
      {
        name: 'Slam',
        description: 'Slam attack',
        damage: '1d8+2 bludgeoning',
        damageComponents: [
          {
            dice: '1d8',
            type: 'bludgeoning',
            bonus: 2,
            bonusAbility: 'STR',
            bonusAutoComputed: true,
          },
        ],
      },
    ];

    expect(findStaleAutomatedValues(actions, abilityScores, proficiencyBonus)).toBe(1);

    const recalculated = recalculateAutomatedValues(actions, abilityScores, proficiencyBonus);
    expect(recalculated[0].damageComponents?.[0].bonus).toBe(4);
    expect(recalculated[0].damage).toBe('1d8+4 bludgeoning');
  });

  it('never counts as stale or recalculates fields where xAutoComputed is false/undefined', () => {
    // Stored saveDC = 10, attackBonus = 5, damage bonus = 2.
    // Formulas would give 12, 7, 4 respectively, but flags are false.
    const actions: NpcAction[] = [
      {
        name: 'Manual Action',
        description: 'Manual values',
        dcAutoComputed: false,
        dcAbilities: ['WIS'],
        saveDC: 10,
        atkAutoComputed: false,
        atkAbility: 'STR',
        attackBonus: 5,
        damage: '1d8+2 bludgeoning',
        damageComponents: [
          {
            dice: '1d8',
            type: 'bludgeoning',
            bonus: 2,
            bonusAbility: 'STR',
            bonusAutoComputed: false,
          },
        ],
      },
    ];

    expect(findStaleAutomatedValues(actions, abilityScores, proficiencyBonus)).toBe(0);

    const recalculated = recalculateAutomatedValues(actions, abilityScores, proficiencyBonus);
    expect(recalculated[0].saveDC).toBe(10);
    expect(recalculated[0].attackBonus).toBe(5);
    expect(recalculated[0].damageComponents?.[0].bonus).toBe(2);
    expect(recalculated[0].damage).toBe('1d8+2 bludgeoning');
  });

  it('returns 0 stale count and leaves items unchanged when all values match formula', () => {
    const actions: NpcAction[] = [
      {
        name: 'Fresh Action',
        description: 'Up to date',
        dcAutoComputed: true,
        dcAbilities: ['WIS'],
        saveDC: 12, // 8 + 3 + 1
        atkAutoComputed: true,
        atkAbility: 'STR',
        attackBonus: 7, // 3 + 4
        damage: '1d8+4 slashing',
        damageComponents: [
          {
            dice: '1d8',
            type: 'slashing',
            bonus: 4,
            bonusAbility: 'STR',
            bonusAutoComputed: true,
          },
        ],
      },
    ];

    expect(findStaleAutomatedValues(actions, abilityScores, proficiencyBonus)).toBe(0);

    const recalculated = recalculateAutomatedValues(actions, abilityScores, proficiencyBonus);
    expect(recalculated[0]).toEqual(actions[0]);
  });
});
