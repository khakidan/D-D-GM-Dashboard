import { calculateModifier, AbilityScores } from "./abilityScores";
import type { NpcAction, DamageComponent } from "../types";
import type { AbilityName } from "./abilityFundamentals";

export function compileDamageComponents(components: DamageComponent[]): string {
  return components
    .map(c => {
      const dice = (c.dice || '').trim();
      const type = (c.type || '').trim();
      let bonusStr = '';
      if (c.bonus !== undefined && c.bonus !== 0) {
        bonusStr = c.bonus > 0 ? `+${c.bonus}` : `${c.bonus}`;
      }
      const part = `${dice}${bonusStr} ${type}`.trim();
      return part;
    })
    .filter(Boolean)
    .join(' & ');
}

export function findStaleAutomatedValues<T extends {
  dcAutoComputed?: boolean;
  dcAbilities?: AbilityName[];
  saveDC?: number;
  atkAutoComputed?: boolean;
  atkAbility?: AbilityName;
  attackBonus?: number;
  damageComponents?: DamageComponent[];
}>(
  items: T[] | undefined,
  abilityScores: AbilityScores,
  proficiencyBonus: number
): number {
  if (!items || items.length === 0) return 0;
  let staleCount = 0;

  for (const item of items) {
    // 1. DC check
    if (item.dcAutoComputed && item.dcAbilities && item.dcAbilities.length > 0) {
      const computedDc = 8 + proficiencyBonus + item.dcAbilities.reduce((sum, ab) => {
        return sum + calculateModifier(abilityScores[ab]);
      }, 0);
      if (item.saveDC !== computedDc) {
        staleCount++;
      }
    }

    // 2. Atk check
    if (item.atkAutoComputed && item.atkAbility !== undefined) {
      const computedAtk = proficiencyBonus + calculateModifier(abilityScores[item.atkAbility]);
      if (item.attackBonus !== computedAtk) {
        staleCount++;
      }
    }

    // 3. Damage components bonus check
    if (item.damageComponents && item.damageComponents.length > 0) {
      for (const comp of item.damageComponents) {
        if (comp.bonusAutoComputed && comp.bonusAbility !== undefined) {
          const computedBonus = calculateModifier(abilityScores[comp.bonusAbility]);
          if (comp.bonus !== computedBonus) {
            staleCount++;
          }
        }
      }
    }
  }

  return staleCount;
}

export function recalculateAutomatedValues<T extends NpcAction>(
  items: T[],
  abilityScores: AbilityScores,
  proficiencyBonus: number
): T[] {
  return items.map(item => {
    let updated = { ...item };
    let changed = false;

    // 1. DC recalculate
    if (item.dcAutoComputed && item.dcAbilities && item.dcAbilities.length > 0) {
      const computedDc = 8 + proficiencyBonus + item.dcAbilities.reduce((sum, ab) => {
        return sum + calculateModifier(abilityScores[ab]);
      }, 0);
      if (item.saveDC !== computedDc) {
        updated.saveDC = computedDc;
        changed = true;
      }
    }

    // 2. Atk recalculate
    if (item.atkAutoComputed && item.atkAbility !== undefined) {
      const computedAtk = proficiencyBonus + calculateModifier(abilityScores[item.atkAbility]);
      if (item.attackBonus !== computedAtk) {
        updated.attackBonus = computedAtk;
        changed = true;
      }
    }

    // 3. Damage components recalculate
    if (item.damageComponents && item.damageComponents.length > 0) {
      let compsChanged = false;
      const updatedComps = item.damageComponents.map(comp => {
        if (comp.bonusAutoComputed && comp.bonusAbility !== undefined) {
          const computedBonus = calculateModifier(abilityScores[comp.bonusAbility]);
          if (comp.bonus !== computedBonus) {
            compsChanged = true;
            return { ...comp, bonus: computedBonus };
          }
        }
        return comp;
      });

      if (compsChanged) {
        updated.damageComponents = updatedComps;
        updated.damage = compileDamageComponents(updatedComps);
        changed = true;
      }
    }

    return changed ? updated : item;
  });
}
