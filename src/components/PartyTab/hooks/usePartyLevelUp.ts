import { useState } from 'react';
import { toast } from 'sonner';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { updateCharacterDB } from '../../../services/dbOperations';
import { Character, Combatant } from '../../../types';
import { withDefaultCombatState } from './partyStateHelpers';

export function usePartyLevelUp(
  setGlobalError: (error: string | null) => void,
  setSyncingId: (id: string | null) => void,
  mirrorCharacterFieldsToCombatants: (
    combatants: Combatant[],
    characterId: string,
    updates: Partial<Character>
  ) => Combatant[]
) {
  const { state, updateState } = useAppState();
  const [levelUpCharacter, setLevelUpCharacter] = useState<Character | null>(null);

  const handleLevelUp = (character: Character) => {
    setLevelUpCharacter(character);
  };

  const cancelLevelUp = () => {
    setLevelUpCharacter(null);
  };

  const handleLevelUpConfirm = async (updates: Partial<Character>) => {
    if (!levelUpCharacter) return;
    const previousState = state;
    const charId = levelUpCharacter.id;

    // 1. Close the dialog
    setLevelUpCharacter(null);

    // 2. Optimistically update local state with the new values
    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => 
        c.id === charId ? { ...c, ...updates } : c
      );
      const updatedCombatants = mirrorCharacterFieldsToCombatants(
        prev.combatState?.combatants || [],
        charId,
        updates
      );
      return {
        ...prev,
        characters: updatedCharacters,
        combatState: withDefaultCombatState(prev.combatState, updatedCombatants as Combatant[])
      };
    });

    // Find the latest char info to ensure we have the right name for the toast
    const char = state.characters.find(c => c.id === charId) || levelUpCharacter;

    // 3. Show a sonner toast
    const newLevel = updates.level !== undefined ? updates.level : (char.level + 1);
    toast.success(`${char.characterName} is now level ${newLevel}!`);

    // 4. Call updateCharacterDB with the changed fields
    setSyncingId(charId);
    try {
      const latestChar = getSnapshot().characters.find(c => c.id === charId);
      if (!latestChar) throw new Error("Character not found");
      
      await updateCharacterDB(updates, latestChar);
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
      
      setGlobalError(`Failed to update details for "${levelUpCharacter.characterName}".`);
      
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      
      console.error('[DB Error]', error);
    } finally {
      setSyncingId(null);
    }
  };

  return {
    levelUpCharacter,
    setLevelUpCharacter,
    handleLevelUp,
    cancelLevelUp,
    handleLevelUpConfirm,
  };
}
