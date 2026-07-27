import React from 'react';
import { NpcSimpleFieldEditor } from './NpcSimpleFieldEditor';
import { NpcCombatActionFields } from './NpcCombatActionFields';
import type { 
  NpcTrait, 
  NpcAction, 
  NpcReaction, 
  NpcLegendaryAction 
} from '../../types';

export function createNpcListRenderers(idPrefix: string) {
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
        onAttackBonusChange={val => onChange({ ...item, attackBonus: val })}
        damage={item.damage}
        onDamageChange={val => onChange({ ...item, damage: val })}
        damagePlaceholder="2d8+5 fire"
        saveDC={item.saveDC}
        onSaveDCChange={val => onChange({ ...item, saveDC: val })}
        saveType={item.saveType}
        onSaveTypeChange={val => onChange({ ...item, saveType: val })}
        rangeValue={item.range}
        onRangeValueChange={val => onChange({ ...item, range: val })}
        description={item.description}
        onDescriptionChange={description => onChange({ ...item, description })}
        descriptionRows={5}
      />
    ),

    renderReactionFields: (item: NpcReaction, index: number, onChange: (updated: NpcReaction) => void) => (
      <NpcSimpleFieldEditor
        name={item.name}
        onNameChange={name => onChange({ ...item, name })}
        namePlaceholder="Reaction name"
        description={item.description}
        onDescriptionChange={description => onChange({ ...item, description })}
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
        onAttackBonusChange={val => onChange({ ...item, attackBonus: val })}
        damage={item.damage}
        onDamageChange={val => onChange({ ...item, damage: val })}
        damagePlaceholder="1d4+3"
        saveDC={item.saveDC}
        onSaveDCChange={val => onChange({ ...item, saveDC: val })}
        saveType={item.saveType}
        onSaveTypeChange={val => onChange({ ...item, saveType: val })}
        rangeValue={item.range}
        onRangeValueChange={val => onChange({ ...item, range: val })}
        description={item.description}
        onDescriptionChange={description => onChange({ ...item, description })}
        descriptionRows={5}
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
        onAttackBonusChange={val => onChange({ ...item, attackBonus: val })}
        damage={item.damage}
        onDamageChange={val => onChange({ ...item, damage: val })}
        damagePlaceholder="2d8+5"
        saveDC={item.saveDC}
        onSaveDCChange={val => onChange({ ...item, saveDC: val })}
        saveType={item.saveType}
        onSaveTypeChange={val => onChange({ ...item, saveType: val })}
        description={item.description}
        onDescriptionChange={description => onChange({ ...item, description })}
        descriptionRows={4}
      />
    ),
  };
}
