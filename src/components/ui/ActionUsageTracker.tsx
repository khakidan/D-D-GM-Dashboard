import React from 'react';
import { Character, NpcAction, NpcReaction } from '../../types';
import { PipTracker } from './PipTracker';
import { RotateCcw } from 'lucide-react';

interface ActionUsageTrackerProps {
  pcCharacter: Character;
  isSyncing: boolean;
  onUpdate: (updates: Partial<Character>) => void | Promise<void>;
}

export function ActionUsageTracker({ pcCharacter, isSyncing, onUpdate }: ActionUsageTrackerProps) {
  const getItems = (jsonStr?: string): Array<NpcAction | NpcReaction> => {
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const actions = getItems(pcCharacter.actions);
  const bonusActions = getItems(pcCharacter.bonusActions);
  const reactions = getItems(pcCharacter.reactions);

  const filterTracked = (items: Array<NpcAction | NpcReaction>, type: 'actions' | 'bonusActions' | 'reactions') => {
    return items
      .map(item => ({ ...item, _type: type }))
      .filter(item => item.maxUses !== undefined && typeof item.maxUses === 'number');
  };

  const trackedActions = filterTracked(actions, 'actions');
  const trackedBonusActions = filterTracked(bonusActions, 'bonusActions');
  const trackedReactions = filterTracked(reactions, 'reactions');

  const allTracked = [...trackedActions, ...trackedBonusActions, ...trackedReactions];

  if (allTracked.length === 0) {
    return null;
  }

  const handleUpdate = (item: (NpcAction | NpcReaction) & { _type: 'actions' | 'bonusActions' | 'reactions' }, newUses: number) => {
    let targetArray = item._type === 'actions' ? actions : item._type === 'bonusActions' ? bonusActions : reactions;
    const updatedArray = targetArray.map(existing => 
      existing._key === item._key ? { ...existing, currentUses: newUses } : existing
    );

    onUpdate({ [item._type]: JSON.stringify(updatedArray) });
  };

  return (
    <div className="mt-4 border-t border-[#e2e8f0] pt-4">
      <div className="space-y-2">
        {allTracked.map(item => {
          const max = item.maxUses!;
          const current = item.currentUses ?? max;
          
          return (
            <div key={`${item._type}-${item._key}`} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#20201a] text-xs font-serif block truncate max-w-[150px]" title={item.name}>
                  {item.name}
                </span>
                <span className="text-[9px] uppercase font-bold text-[#8d8db9]/70 tracking-widest">
                  ({item._type === 'bonusActions' ? 'Bonus' : item._type === 'reactions' ? 'Reaction' : 'Action'})
                </span>
                <button
                  onClick={() => handleUpdate(item, max)}
                  title="Reset to Max"
                  className="p-0.5 hover:bg-[#f1ecd8]/60 hover:text-[#2563eb] rounded transition-all opacity-50 hover:opacity-100"
                  id={`reset-usage-${item._key}`} data-testid={`reset-usage-${item._key}`}
                  disabled={isSyncing || current === max}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
              
              <PipTracker
                max={max}
                remaining={current}
                readOnly={isSyncing}
                onChange={(newValue) => handleUpdate(item, newValue)}
                color="blue"
                size="default"
                label={item.name}
                className="flex-wrap justify-end"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
