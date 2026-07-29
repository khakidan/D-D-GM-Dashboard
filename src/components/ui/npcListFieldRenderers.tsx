import React from 'react';
import { NpcSimpleFieldEditor } from './NpcSimpleFieldEditor';
import { NpcCombatActionFields } from './NpcCombatActionFields';
import { DEFAULT_ABILITY_SCORES, AbilityScores } from '../../lib/abilityScores';
import { compileDamageComponents } from '../../lib/automation';

import type { 
  NpcTrait, 
  NpcAction, 
  NpcReaction, 
  NpcLegendaryAction 
} from '../../types';

export function createNpcListRenderers(idPrefix: string, abilityScores: AbilityScores, proficiencyBonus: number) {
  return {
    renderTraitFields: (item: NpcTrait, index: number, onChange: (updated: NpcTrait) => void) => (
      <NpcSimpleFieldEditor
        name={item.name}
        onNameChange={name => onChange({ ...item, name })}
        namePlaceholder="Trait name"
        description={item.description}
        onDescriptionChange={description => onChange({ ...item, description })}
      />
    ),
    renderActionFields: (item: NpcAction, index: number, onChange: (updated: NpcAction) => void) => (
      <NpcCombatActionFields
        idPrefix={`${idPrefix}-action-${index}`}
        name={item.name}
        onNameChange={name => onChange({ ...item, name })}
        namePlaceholder="Action name (e.g. Bite)"
        recharge={item.recharge}
        onRechargeChange={val => onChange({ ...item, recharge: val })}
        attackBonus={item.attackBonus}
        onAttackBonusChange={(val, isAuto) => onChange({ ...item, attackBonus: val, ...(isAuto !== undefined && { atkAutoComputed: isAuto }) })}
        damage={item.damage}
        onDamageChange={val => onChange({ ...item, damage: val })}
        damagePlaceholder="2d8+5 fire"
        saveDC={item.saveDC}
        onSaveDCChange={(val, isAuto) => onChange({ ...item, saveDC: val, ...(isAuto !== undefined && { dcAutoComputed: isAuto }) })}
        saveType={item.saveType}
        onSaveTypeChange={val => onChange({ ...item, saveType: val })}
        rangeValue={item.range}
        onRangeValueChange={val => onChange({ ...item, range: val })}
        description={item.description}
        onDescriptionChange={description => onChange({ ...item, description })}
        descriptionRows={5}
        abilityScores={abilityScores}
        proficiencyBonus={proficiencyBonus}
        dcAbilities={item.dcAbilities}
        onDcAbilitiesChange={val => onChange({ ...item, dcAbilities: val })}
        dcAutoComputed={item.dcAutoComputed}
        atkAbility={item.atkAbility}
        onAtkAbilityChange={val => onChange({ ...item, atkAbility: val })}
        atkAutoComputed={item.atkAutoComputed}
        damageComponents={item.damageComponents}
        onDamageComponentsChange={val => onChange({ ...item, damageComponents: val,
          damage: val ? compileDamageComponents(val) : item.damage
        })}
      />
    ),
    renderReactionFields: (item: NpcReaction, index: number, onChange: (updated: NpcReaction) => void) => (
      <NpcCombatActionFields
        idPrefix={`${idPrefix}-reaction-${index}`}
        name={item.name}
        onNameChange={name => onChange({ ...item, name })}
        namePlaceholder="Reaction name (e.g. Shield)"
        recharge={item.recharge}
        onRechargeChange={val => onChange({ ...item, recharge: val })}
        attackBonus={item.attackBonus}
        onAttackBonusChange={(val, isAuto) => onChange({ ...item, attackBonus: val, ...(isAuto !== undefined && { atkAutoComputed: isAuto }) })}
        damage={item.damage}
        onDamageChange={val => onChange({ ...item, damage: val })}
        damagePlaceholder="2d6"
        saveDC={item.saveDC}
        onSaveDCChange={(val, isAuto) => onChange({ ...item, saveDC: val, ...(isAuto !== undefined && { dcAutoComputed: isAuto }) })}
        saveType={item.saveType}
        onSaveTypeChange={val => onChange({ ...item, saveType: val })}
        rangeValue={item.range}
        onRangeValueChange={val => onChange({ ...item, range: val })}
        description={item.description}
        onDescriptionChange={description => onChange({ ...item, description })}
        descriptionRows={5}
        abilityScores={abilityScores}
        proficiencyBonus={proficiencyBonus}
        dcAbilities={item.dcAbilities}
        onDcAbilitiesChange={val => onChange({ ...item, dcAbilities: val })}
        dcAutoComputed={item.dcAutoComputed}
        atkAbility={item.atkAbility}
        onAtkAbilityChange={val => onChange({ ...item, atkAbility: val })}
        atkAutoComputed={item.atkAutoComputed}
        damageComponents={item.damageComponents}
        onDamageComponentsChange={val => onChange({ ...item, damageComponents: val,
          damage: val ? compileDamageComponents(val) : item.damage
        })}
      />
    ),
    renderBonusActionFields: (item: NpcAction, index: number, onChange: (updated: NpcAction) => void) => (
      <NpcCombatActionFields
        idPrefix={`${idPrefix}-bonus-${index}`}
        name={item.name}
        onNameChange={name => onChange({ ...item, name })}
        namePlaceholder="Bonus Action name (e.g. Healing Word)"
        recharge={item.recharge}
        onRechargeChange={val => onChange({ ...item, recharge: val })}
        attackBonus={item.attackBonus}
        onAttackBonusChange={(val, isAuto) => onChange({ ...item, attackBonus: val, ...(isAuto !== undefined && { atkAutoComputed: isAuto }) })}
        damage={item.damage}
        onDamageChange={val => onChange({ ...item, damage: val })}
        damagePlaceholder="1d4+3"
        saveDC={item.saveDC}
        onSaveDCChange={(val, isAuto) => onChange({ ...item, saveDC: val, ...(isAuto !== undefined && { dcAutoComputed: isAuto }) })}
        saveType={item.saveType}
        onSaveTypeChange={val => onChange({ ...item, saveType: val })}
        rangeValue={item.range}
        onRangeValueChange={val => onChange({ ...item, range: val })}
        description={item.description}
        onDescriptionChange={description => onChange({ ...item, description })}
        descriptionRows={5}
        abilityScores={abilityScores}
        proficiencyBonus={proficiencyBonus}
        dcAbilities={item.dcAbilities}
        onDcAbilitiesChange={val => onChange({ ...item, dcAbilities: val })}
        dcAutoComputed={item.dcAutoComputed}
        atkAbility={item.atkAbility}
        onAtkAbilityChange={val => onChange({ ...item, atkAbility: val })}
        atkAutoComputed={item.atkAutoComputed}
        damageComponents={item.damageComponents}
        onDamageComponentsChange={val => onChange({ ...item, damageComponents: val,
          damage: val ? compileDamageComponents(val) : item.damage
        })}
      />
    ),
    renderLegendaryActionFields: (item: NpcLegendaryAction, index: number, onChange: (updated: NpcLegendaryAction) => void) => (
      <NpcCombatActionFields
        idPrefix={`${idPrefix}-legendary-${index}`}
        name={item.name}
        onNameChange={name => onChange({ ...item, name })}
        namePlaceholder="Action name"
        cost={item.cost}
        onCostChange={val => onChange({ ...item, cost: val })}
        attackBonus={item.attackBonus}
        onAttackBonusChange={(val, isAuto) => onChange({ ...item, attackBonus: val, ...(isAuto !== undefined && { atkAutoComputed: isAuto }) })}
        damage={item.damage}
        onDamageChange={val => onChange({ ...item, damage: val })}
        damagePlaceholder="2d8+5"
        saveDC={item.saveDC}
        onSaveDCChange={(val, isAuto) => onChange({ ...item, saveDC: val, ...(isAuto !== undefined && { dcAutoComputed: isAuto }) })}
        saveType={item.saveType}
        onSaveTypeChange={val => onChange({ ...item, saveType: val })}
        rangeValue={item.range}
        onRangeValueChange={val => onChange({ ...item, range: val })}
        description={item.description}
        onDescriptionChange={description => onChange({ ...item, description })}
        descriptionRows={4}
        abilityScores={abilityScores}
        proficiencyBonus={proficiencyBonus}
        dcAbilities={item.dcAbilities}
        onDcAbilitiesChange={val => onChange({ ...item, dcAbilities: val })}
        dcAutoComputed={item.dcAutoComputed}
        atkAbility={item.atkAbility}
        onAtkAbilityChange={val => onChange({ ...item, atkAbility: val })}
        atkAutoComputed={item.atkAutoComputed}
        damageComponents={item.damageComponents}
        onDamageComponentsChange={val => onChange({ ...item, damageComponents: val,
          damage: val ? compileDamageComponents(val) : item.damage
        })}
      />
    ),
  };
}
