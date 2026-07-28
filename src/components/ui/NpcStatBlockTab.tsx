import React from 'react';
import { cn } from '../../lib/utils';
import { NpcListEditor } from './NpcListEditor';
import { createNpcListRenderers } from './npcListFieldRenderers';
import type { 
  NpcTrait, 
  NpcAction, 
  NpcReaction, 
  NpcLegendaryAction
} from '../../types';
import { AbilityScores } from '../../lib/abilityScores';

interface NpcStatBlockTabProps {
  traits: NpcTrait[];
  actions: NpcAction[];
  reactions: NpcReaction[];
  bonusActions: NpcAction[];
  legendaryActionsList: NpcLegendaryAction[];
  abilityScores: AbilityScores;
  profBonus: number;
  onTraitsChange: (updated: NpcTrait[]) => void;
  onActionsChange: (updated: NpcAction[]) => void;
  onReactionsChange: (updated: NpcReaction[]) => void;
  onBonusActionsChange: (updated: NpcAction[]) => void;
  onLegendaryActionsChange: (updated: NpcLegendaryAction[]) => void;
  compact?: boolean;
}

export const NpcStatBlockTab: React.FC<NpcStatBlockTabProps> = ({
  traits,
  actions,
  reactions,
  bonusActions,
  legendaryActionsList,
  abilityScores,
  profBonus,
  onTraitsChange,
  onActionsChange,
  onReactionsChange,
  onBonusActionsChange,
  onLegendaryActionsChange,
  compact = false,
}) => {
  const {
    renderTraitFields,
    renderActionFields,
    renderReactionFields,
    renderBonusActionFields,
    renderLegendaryActionFields,
  } = React.useMemo(() => createNpcListRenderers('npc-tab', abilityScores, profBonus), [abilityScores, profBonus]);

  return (
    <div className={cn("space-y-4", compact && "space-y-2")} id="npc-statblock-tab">
      <NpcListEditor<NpcTrait>
        title="Traits"
        items={traits}
        defaultExpanded={true}
        emptyItem={{ name: '', description: '' }}
        renderFields={renderTraitFields}
        onChange={onTraitsChange}
      />

      <NpcListEditor<NpcAction>
        title="Actions"
        items={actions}
        defaultExpanded={true}
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
        renderFields={renderActionFields}
        onChange={onActionsChange}
      />

      <NpcListEditor<NpcReaction>
        title="Reactions"
        items={reactions}
        defaultExpanded={true}
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
        renderFields={renderReactionFields}
        onChange={onReactionsChange}
      />

      <NpcListEditor<NpcAction>
        title="Bonus Actions"
        items={bonusActions}
        defaultExpanded={true}
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
        renderFields={renderBonusActionFields}
        onChange={onBonusActionsChange}
      />

      <NpcListEditor<NpcLegendaryAction>
        title="Legendary Actions"
        items={legendaryActionsList}
        defaultExpanded={true}
        emptyItem={{
          name: '',
          description: '',
          cost: 1,
          attackBonus: undefined,
          damage: undefined,
          saveDC: undefined,
          saveType: undefined,
        }}
        renderFields={renderLegendaryActionFields}
        onChange={onLegendaryActionsChange}
      />
    </div>
  );
};
