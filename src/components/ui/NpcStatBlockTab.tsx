import React from 'react';
import { cn } from '../../lib/utils';
import { NpcListEditor } from './NpcListEditor';
import { NpcSimpleFieldEditor } from './NpcSimpleFieldEditor';
import { NpcCombatActionFields } from './NpcCombatActionFields';
import type { 
  NpcTrait, 
  NpcAction, 
  NpcReaction, 
  NpcLegendaryAction 
} from '../../types';

interface NpcStatBlockTabProps {
  traits: NpcTrait[];
  actions: NpcAction[];
  reactions: NpcReaction[];
  legendaryActionsList: NpcLegendaryAction[];
  onTraitsChange: (updated: NpcTrait[]) => void;
  onActionsChange: (updated: NpcAction[]) => void;
  onReactionsChange: (updated: NpcReaction[]) => void;
  onLegendaryActionsChange: (updated: NpcLegendaryAction[]) => void;
  compact?: boolean;
}

export const NpcStatBlockTab: React.FC<NpcStatBlockTabProps> = ({
  traits,
  actions,
  reactions,
  legendaryActionsList,
  onTraitsChange,
  onActionsChange,
  onReactionsChange,
  onLegendaryActionsChange,
  compact = false,
}) => {
  return (
    <div className={cn("space-y-4", compact && "space-y-2")} id="npc-statblock-tab">
      <NpcListEditor<NpcTrait>
        title="Traits"
        items={traits}
        emptyItem={{ name: '', description: '' }}
        renderFields={(item, index, onChange) => (
          <NpcSimpleFieldEditor
            name={item.name}
            onNameChange={name => onChange({ ...item, name })}
            namePlaceholder="Trait name"
            description={item.description}
            onDescriptionChange={description => onChange({ ...item, description })}
          />
        )}
        onChange={onTraitsChange}
      />

      <NpcListEditor<NpcAction>
        title="Actions"
        items={actions}
        emptyItem={{
          name: '',
          description: '',
          attackBonus: undefined,
          damage: undefined,
          saveDC: undefined,
          saveType: undefined,
          range: undefined,
          recharge: undefined,
        }}
        renderFields={(item, index, onChange) => (
          <NpcCombatActionFields
            idPrefix={`npc-action-${index}`}
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
            descriptionRows={3}
          />
        )}
        onChange={onActionsChange}
      />

      <NpcListEditor<NpcReaction>
        title="Reactions"
        items={reactions}
        emptyItem={{ name: '', description: '' }}
        renderFields={(item, index, onChange) => (
          <NpcSimpleFieldEditor
            name={item.name}
            onNameChange={name => onChange({ ...item, name })}
            namePlaceholder="Reaction name"
            description={item.description}
            onDescriptionChange={description => onChange({ ...item, description })}
          />
        )}
        onChange={onReactionsChange}
      />

      <NpcListEditor<NpcLegendaryAction>
        title="Legendary Actions"
        items={legendaryActionsList}
        emptyItem={{
          name: '',
          description: '',
          cost: 1,
          attackBonus: undefined,
          damage: undefined,
          saveDC: undefined,
          saveType: undefined,
        }}
        renderFields={(item, index, onChange) => (
          <NpcCombatActionFields
            idPrefix={`npc-legendary-${index}`}
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
            descriptionRows={2}
          />
        )}
        onChange={onLegendaryActionsChange}
      />
    </div>
  );
};
