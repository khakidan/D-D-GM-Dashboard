import { useState } from 'react';
import { toast } from 'sonner';
import { useAppState } from '../../../hooks/useAppState';
import { updateCharacterDB } from '../../../services/dbOperations';
import { Character, Combatant, AppState } from '../../../types';
import { effectiveMaxHp, applyLongRestToConditions } from '../../../lib/conditions';
import { applyLongRestHitDiceRecovery } from '../../../lib/hitDice';
import { 
  parseResourcePools, 
  serializeResourcePools, 
  resetResourcesOnShortRest, 
  resetResourcesOnLongRest 
} from '../../../lib/resourcePools';

import { withDefaultCombatState } from './partyStateHelpers';

// --- Local Helpers ---
function calculateLongRestUpdates(character: Character): Partial<Character> {
  const nextHitDiceUsed = applyLongRestHitDiceRecovery(character.hitDiceConfig || '', character.hitDiceUsed || '{}');
  const currentPools = parseResourcePools(character.resourcePools || '[]');
  const updatedPools = resetResourcesOnLongRest(currentPools);
  const serializedPools = serializeResourcePools(updatedPools);
  const { remaining, newExhaustionLevel } = applyLongRestToConditions(character.conditions || '');

  const updates: Partial<Character> = {
    currentHp: effectiveMaxHp(character.maxHp, character.tempHpMax),
    tempHp: 0,
    hitDiceUsed: nextHitDiceUsed,
    deathSavesFails: 0,
    deathSavesSuccesses: 0,
    resourcePools: serializedPools,
  };

  if (remaining !== character.conditions) {
    updates.conditions = remaining;
  }

  const hadHpHalvingExhaustion = [4, 5, 6].some(
    n => (character.conditions || '').toLowerCase().includes(`exhaustion ${n}`)
  );
  const stillHasHpHalvingExhaustion = newExhaustionLevel !== null && newExhaustionLevel >= 4;
  if (hadHpHalvingExhaustion && !stillHasHpHalvingExhaustion) {
    updates.tempHpMax = 0;
    updates.currentHp = character.maxHp;
  }

  return updates;
}

function calculateShortRestUpdates(
  character: Character, 
  hpToAdd: number, 
  newHitDiceUsed: string
): Partial<Character> {
  const maxHpCeiling = effectiveMaxHp(character.maxHp, character.tempHpMax);
  const newHp = Math.min(
    character.currentHp + hpToAdd,
    maxHpCeiling
  );

  const currentPools = parseResourcePools(character.resourcePools || '[]');
  const updatedPools = resetResourcesOnShortRest(currentPools);
  const serializedPools = serializeResourcePools(updatedPools);

  return {
    currentHp: newHp,
    hitDiceUsed: newHitDiceUsed,
    resourcePools: serializedPools,
  };
}

export function usePartyRest(setGlobalError: (error: string | null) => void) {
  const { state, updateState } = useAppState();
  const [isResting, setIsResting] = useState(false);

  const handleLongRest = async (characterIds: string[]) => {
    setIsResting(true);
    setGlobalError(null);
    
    const eligibleCharacterIds = characterIds.filter(id => {
      const char = state.characters.find(c => c.id === id);
      return char?.statusId !== 3;
    });

    if (eligibleCharacterIds.length === 0) {
      toast.info("No eligible characters to rest — deceased characters cannot rest.");
      setIsResting(false);
      return;
    }
    
    const previousState = state;
    // 1. Update local state optimistically
    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => {
        if (!eligibleCharacterIds.includes(c.id)) return c;
        
        const updates = calculateLongRestUpdates(c);

        return { ...c, ...updates };
      });

      // Mirror the changes into any active PC combatants
      const updatedCombatants = (prev.combatState?.combatants || []).map(
        combatant => {
          if (combatant.type !== 'pc' || !combatant.characterId || !eligibleCharacterIds.includes(combatant.characterId)) {
            return combatant;
          }
          const updatedChar = updatedCharacters.find(
            c => c.id === combatant.characterId
          );
          if (!updatedChar) return combatant;

          return {
            ...combatant,
            currentHp: updatedChar.currentHp,
            tempHp: updatedChar.tempHp ?? 0,
            maxHp: updatedChar.maxHp,
            tempHpMax: updatedChar.tempHpMax,
            conditions: updatedChar.conditions || '',
            conditionTimers: {},
          };
        }
      );

      return {
        ...prev,
        characters: updatedCharacters,
        combatState: withDefaultCombatState(prev.combatState, updatedCombatants as Combatant[]),
      };
    });

    try {
      const selectedChars = previousState.characters.filter(c => eligibleCharacterIds.includes(c.id));
      
      const updatePromises = selectedChars.map(char => {
        const updates = calculateLongRestUpdates(char);

        return updateCharacterDB(updates, char);
      });

      await Promise.all(updatePromises);

      let anyExhaustionReduced = false;
      const removedEffects: string[] = [];
      selectedChars.forEach(char => {
        const { removed, exhaustionReduced } = applyLongRestToConditions(char.conditions || '');
        if (exhaustionReduced) anyExhaustionReduced = true;
        if (removed.length > 0) removedEffects.push(...removed);
      });

      const lines: string[] = [];
      lines.push(`Long rest applied to ${selectedChars.length} character(s).`);
      if (anyExhaustionReduced) lines.push('Exhaustion reduced by 1 for affected characters.');
      if (removedEffects.length > 0) lines.push(`Effects cleared: ${[...new Set(removedEffects)].join(', ')}.`);

      toast.success('Long rest complete', {
        description: lines.join(' '),
        duration: 8000,
      });

    } catch (error) {
      // Roll back to snapshot on failure
      updateState(prev => ({
        ...prev,
        characters: previousState.characters,
        combatState: {
          ...prev.combatState,
          combatants: previousState.combatState.combatants,
        },
      }));
      
      // Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      // Log for debugging
      console.error('[DB Error]', error);
    } finally {
      setIsResting(false);
    }
  };

  const handleShortRest = async (
    results: Array<{
      characterId: string;
      hpToAdd: number;
      newHitDiceUsed: string;
    }>
  ) => {
    setGlobalError(null);
    
    const eligibleResults = results.filter(res => {
      const char = state.characters.find(c => c.id === res.characterId);
      return char?.statusId !== 3;
    });

    if (eligibleResults.length === 0) {
      toast.info("No eligible characters to rest — deceased characters cannot rest.");
      return;
    }

    const previousState = state;

    // 1. Update local state optimistically
    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => {
        const res = eligibleResults.find(r => r.characterId === c.id);
        if (!res) return c;

        const updates = calculateShortRestUpdates(c, res.hpToAdd, res.newHitDiceUsed);

        return {
          ...c,
          ...updates,
        };
      });

      // Mirror the changes into any active PC combatants
      const updatedCombatants = (prev.combatState?.combatants || []).map(
        combatant => {
          if (combatant.type !== 'pc' || !combatant.characterId) {
            return combatant;
          }
          const updatedChar = updatedCharacters.find(
            c => c.id === combatant.characterId
          );
          if (!updatedChar) return combatant;

          return {
            ...combatant,
            currentHp: updatedChar.currentHp,
            tempHp: updatedChar.tempHp ?? 0,
            maxHp: updatedChar.maxHp,
          };
        }
      );

      return {
        ...prev,
        characters: updatedCharacters,
        combatState: withDefaultCombatState(prev.combatState, updatedCombatants as Combatant[]),
      };
    });

    try {
      const updatePromises = eligibleResults.map(res => {
        const char = previousState.characters.find(c => c.id === res.characterId);
        if (!char) return Promise.resolve();

        const updates = calculateShortRestUpdates(char, res.hpToAdd, res.newHitDiceUsed);

        return updateCharacterDB(updates, char);
      });

      await Promise.all(updatePromises);

      toast.success('Short rest complete', {
        description: `Short rest applied to ${eligibleResults.length} character(s).`,
      });

    } catch (error) {
      // Roll back to snapshot on failure
      updateState(prev => ({
        ...prev,
        characters: previousState.characters,
        combatState: {
          ...prev.combatState,
          combatants: previousState.combatState.combatants,
        },
      }));
      
      // Set local error state
      setGlobalError('Failed to save short rest. Please try again.');

      // Show error toast
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
    }
  };

  return {
    isResting,
    handleShortRest,
    handleLongRest
  };
}
