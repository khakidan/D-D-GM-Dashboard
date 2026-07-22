import { useState } from 'react';
import { toast } from 'sonner';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { addCharacterDB, updateCharacterDB, deleteCharacterFully } from '../../../services/dbOperations';
import { Character, Combatant } from '../../../types';
import { withDefaultCombatState } from './partyStateHelpers';
import { isConcentrating, fireConcentrationAlert } from '../../../lib/concentrationCheck';
import {
  parseAbilityScores,
  parseProficiencies,
  getPassiveScore,
  proficiencyBonusFromLevel,
  serializeProficiencies,
} from '../../../lib/abilityScores';

export function usePartyCharacterCrud(
  setGlobalError: (error: string | null) => void,
  setSyncingId: (id: string | null) => void,
  mirrorCharacterFieldsToCombatants: (
    combatants: Combatant[],
    characterId: string,
    updates: Partial<Character>
  ) => Combatant[]
) {
  const { state, updateState } = useAppState();
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  const handleCreateCharacter = async (newCharData: Omit<Character, 'id' | 'sheetRowIndex'>) => {
    setIsAddingPlayer(true);
    setGlobalError(null);
    const previousState = state;
    
    const tempId = `pc-temp-${Date.now()}`;
    const newChar: Character = {
      ...newCharData,
      id: tempId,
      resourcePools: newCharData.resourcePools ?? '[]',
      abilityScores: newCharData.abilityScores ?? '{}',
      proficiencies: newCharData.proficiencies ?? '{}',
    };

    updateState(prev => ({
      ...prev,
      characters: [...prev.characters, newChar]
    }));

    try {
      const savedChar = await addCharacterDB(newChar);
      updateState(prev => ({
        ...prev,
        characters: prev.characters.map(c => c.id === tempId ? { ...savedChar } : c) as Character[]
      }));
      toast.success(`${newCharData.characterName} added to the roster`);
    } catch (error) {
      updateState(prev => ({ ...prev, characters: previousState.characters }));
      setGlobalError('Failed to add player. Please try again.');
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      console.error('[DB Error]', error);
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    const char = state.characters.find(c => c.id === id);
    if (!char) return;

    setGlobalError(null);
    const previousState = state;
    
    updateState(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));

    toast.success(`${char.characterName} removed from roster.`);

    try {
      await deleteCharacterFully(id);
    } catch (error) {
      updateState(prev => ({ ...prev, characters: previousState.characters }));
      setGlobalError(`Failed to delete "${char.characterName}".`);
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      console.error('[DB Error]', error);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Character>) => {
    const previousState = state;
    const sanitizedUpdates = { ...updates };
    if (typeof sanitizedUpdates.characterName === 'string') sanitizedUpdates.characterName = sanitizedUpdates.characterName.trim();
    if (typeof sanitizedUpdates.playerName === 'string') sanitizedUpdates.playerName = sanitizedUpdates.playerName.trim();
    
    const characterForCalc = state.characters.find(c => c.id === id);
    if (characterForCalc) {
      if (sanitizedUpdates.abilityScores !== undefined || sanitizedUpdates.proficiencies !== undefined || sanitizedUpdates.level !== undefined) {
        const charLevel = sanitizedUpdates.level !== undefined ? Number(sanitizedUpdates.level) : characterForCalc.level;
        const rawAbil = sanitizedUpdates.abilityScores !== undefined ? String(sanitizedUpdates.abilityScores) : (characterForCalc.abilityScores || '{}');
        const rawProf = sanitizedUpdates.proficiencies !== undefined ? String(sanitizedUpdates.proficiencies) : (characterForCalc.proficiencies || '{}');
        
        const abilObj = parseAbilityScores(rawAbil);
        const profObj = parseProficiencies(rawProf);

        if (sanitizedUpdates.level !== undefined) {
          profObj.proficiencyBonus = proficiencyBonusFromLevel(charLevel);
          sanitizedUpdates.proficiencies = serializeProficiencies(profObj);
        }

        const recalculatedPassivePerception = getPassiveScore(abilObj, profObj, 'perception');
        sanitizedUpdates.passivePerception = recalculatedPassivePerception;
      }
    }

    if (sanitizedUpdates.ac !== undefined) sanitizedUpdates.ac = Math.max(0, Number(sanitizedUpdates.ac) || 0);
    if (sanitizedUpdates.tempAc !== undefined) sanitizedUpdates.tempAc = Number(sanitizedUpdates.tempAc) || 0;
    if (sanitizedUpdates.maxHp !== undefined) sanitizedUpdates.maxHp = Math.max(1, Number(sanitizedUpdates.maxHp) || 1);
    if (sanitizedUpdates.currentHp !== undefined) sanitizedUpdates.currentHp = Math.max(0, Number(sanitizedUpdates.currentHp) || 0);
    if (sanitizedUpdates.tempHp !== undefined) sanitizedUpdates.tempHp = Math.max(0, Number(sanitizedUpdates.tempHp) || 0);
    if (sanitizedUpdates.level !== undefined) sanitizedUpdates.level = Math.max(1, Number(sanitizedUpdates.level) || 1);
    if (sanitizedUpdates.passivePerception !== undefined) sanitizedUpdates.passivePerception = Math.max(0, Number(sanitizedUpdates.passivePerception) || 0);

    const character = state.characters.find(c => c.id === id);
    if (character && sanitizedUpdates.currentHp !== undefined) {
      const newHp = Number(sanitizedUpdates.currentHp);
      const previousHp = character.currentHp;
      const damageTaken = previousHp - newHp;
      
      if (damageTaken > 0 && isConcentrating(character.conditions)) {
        fireConcentrationAlert(
          character.characterName,
          damageTaken
        );
      }
    }

    updateState(prev => {
      const updatedCharacters = prev.characters.map(c => 
        c.id === id ? { ...c, ...sanitizedUpdates } : c
      );
      const updatedCombatants = mirrorCharacterFieldsToCombatants(
        prev.combatState?.combatants || [],
        id,
        sanitizedUpdates
      );
      return {
        ...prev,
        characters: updatedCharacters,
        combatState: withDefaultCombatState(prev.combatState, updatedCombatants as Combatant[])
      };
    });

    const isSheetData = Object.keys(sanitizedUpdates).some(k => 
      ['playerName', 'characterName', 'class', 'ac', 'maxHp', 'tempHp', 'currentHp', 'conditions', 'passivePerception', 'level', 'statusId', 'notes', 'resistances', 'immunities', 'vulnerabilities', 'tempAc', 'deathSavesFails', 'deathSavesSuccesses', 'hitDiceConfig', 'hitDiceUsed', 'resourcePools', 'abilityScores', 'proficiencies', 'spellcastingAbility', 'gmControlled', 'traits', 'actions', 'reactions'].includes(k)
    );

    if (!isSheetData) return;

    const char = getSnapshot().characters.find(c => c.id === id);
    if (!char) return;
    
    setSyncingId(id);
    try {
      await updateCharacterDB(sanitizedUpdates, char);
    } catch (error) {
      updateState(prev => ({
        ...prev,
        characters: previousState.characters,
        combatState: {
          ...prev.combatState,
          combatants: previousState.combatState.combatants,
        },
      }));
      setGlobalError(`Failed to update details for "${char.characterName}".`);
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
    isAddingPlayer,
    handleCreateCharacter,
    handleDeletePlayer,
    handleUpdate
  };
}
