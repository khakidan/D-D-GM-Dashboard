import { useState } from 'react';
import { useAppState } from '../../../hooks/useAppState';
import { Character, Combatant } from '../../../types';
import { usePartyRest } from './usePartyRest';
import { usePartyLevelUp } from './usePartyLevelUp';
import { usePartyCharacterCrud } from './usePartyCharacterCrud';
import { withDefaultCombatState } from './partyStateHelpers';

function mirrorCharacterFieldsToCombatants(
  combatants: Combatant[],
  characterId: string,
  updates: Partial<Character>
): Combatant[] {
  return combatants.map(c => {
    if (c.characterId !== characterId) return c;
    return {
      ...c,
      ...(updates.ac !== undefined ? { ac: updates.ac } : {}),
      ...(updates.maxHp !== undefined ? { maxHp: updates.maxHp } : {}),
      ...(updates.tempHpMax !== undefined ? { tempHpMax: updates.tempHpMax } : {}),
      ...(updates.conditions !== undefined ? { conditions: updates.conditions } : {}),
      ...(updates.currentHp !== undefined ? { currentHp: updates.currentHp } : {}),
      ...(updates.tempHp !== undefined ? { tempHp: updates.tempHp } : {}),
      ...(updates.characterName !== undefined ? { name: updates.characterName } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.passivePerception !== undefined ? { passivePerception: updates.passivePerception } : {}),
      ...(updates.tempAc !== undefined ? { tempAcModifier: updates.tempAc } : {}),
    };
  });
}

export function useParty() {
  const { state, updateState } = useAppState();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const { isResting, handleShortRest, handleLongRest } = usePartyRest(setGlobalError);
  
  const {
    levelUpCharacter,
    setLevelUpCharacter,
    handleLevelUpConfirm
  } = usePartyLevelUp(setGlobalError, setSyncingId, mirrorCharacterFieldsToCombatants);

  const {
    isAddingPlayer,
    handleCreateCharacter,
    handleDeletePlayer,
    handleUpdate
  } = usePartyCharacterCrud(setGlobalError, setSyncingId, mirrorCharacterFieldsToCombatants);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return {
    state,
    syncingId,
    isResting,
    isAddingPlayer,
    globalError,
    expandedIds,
    toggleExpand,
    handleCreateCharacter,
    handleLongRest,
    handleShortRest,
    handleDeletePlayer,
    handleUpdate,
    levelUpCharacter,
    setLevelUpCharacter,
    handleLevelUpConfirm,
  };
}
