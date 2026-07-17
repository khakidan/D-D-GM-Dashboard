import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { useDashboardStore } from '../../../hooks/dashboardStore';
import { toast } from 'sonner';
import {
  updateCharacterDB,
  deleteEncounterCombatantDB,
  updateInitiativeDB,
  updateConditionTimersDB,
  updateNpcInstanceHpDB,
  updateNpcInstanceConditionsDB,
  updateNpcInstanceAcModDB,
  updateNpcInstanceLegendaryDB,
  updateNpcInstanceRechargeDB
} from '../../../services/dbOperations';
import { Combatant } from '../../../types';
import { buildConditionSummary } from '../../../lib/conditions';
import { parseCommaSeparatedList } from '../../../lib/stringUtils';
import { CombatEvent } from '../../../lib/combatLog';
import { calculateConditionAcModifier, calculateExhaustionHpCap } from '../../../lib/combatLogic';
import { useRageEvent } from '../../../hooks/useCombatOverlayEvents';

export function useCombatantMutations() {
  const { state, updateState } = useAppState();
  const { fire: fireRageEvent } = useRageEvent();

  const syncingIds = new Set(state.combatState.syncingIds || []);
  const setSyncingIds = (action: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    updateState(pState => {
      const currentSet = new Set(pState.combatState.syncingIds || []);
      const nextSet = typeof action === 'function' ? action(currentSet) : action;
      return {
        ...pState,
        combatState: {
          ...pState.combatState,
          syncingIds: Array.from(nextSet),
        }
      };
    });
  };

  const removeCombatant = async (id: string) => {
    const latestSnapshot = getSnapshot();
    const targetCombatant = latestSnapshot.combatState.combatants.find(c => c.id === id);
    const previousState = latestSnapshot;

    if (!targetCombatant) return;

    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        combatants: prev.combatState.combatants.filter(c => c.id !== id),
        activeTurnId: prev.combatState.activeTurnId === id ? null : prev.combatState.activeTurnId,
      },
    }));

    if (targetCombatant.encounterCombatantId) {
      try {
        await deleteEncounterCombatantDB(targetCombatant.encounterCombatantId);
        updateState(prev => ({
          ...prev,
          encounterCombatants: prev.encounterCombatants.filter(
            ecItem => ecItem.id !== targetCombatant.encounterCombatantId
          ),
        }));
      } catch (error) {
        updateState(prev => ({
          ...prev,
          encounterCombatants: previousState.encounterCombatants,
          combatState: {
            ...prev.combatState,
            combatants: previousState.combatState.combatants,
            activeTurnId: previousState.combatState.activeTurnId,
          }
        }));
        toast.error('Failed to save changes. Please try again.', {
          description: error instanceof Error ? error.message : 'Unknown error',
          duration: 5000,
        });
        console.error('[DB Error]', error);
        throw error;
      }
    }
  };

  const updateCombatant = async (id: string, updates: Partial<Combatant>) => {
    const snapshot = getSnapshot();
    const currentCombatant = snapshot.combatState.combatants.find(c => c.id === id);
    if (!currentCombatant) return;

    const { updates: computedUpdates, notifications, rageTriggered } = calculateCombatantStateUpdates(
      currentCombatant,
      updates
    );
    updates = computedUpdates;

    notifications.forEach(n => {
      if (n.type === 'warning') {
        toast.warning(n.message, { description: n.description });
      } else if (n.type === 'success') {
        toast.success(n.message);
      }
    });

    if (rageTriggered && currentCombatant.type === 'pc') {
      fireRageEvent({ characterName: currentCombatant.name });
    }

    const targetCombatant = { ...currentCombatant, ...updates };

    updateState(prev => {
      let nextCombatants = prev.combatState.combatants.map(c =>
        c.id === id ? { ...c, ...updates } : c
      );

      if (updates.initiative !== undefined) {
        nextCombatants = [...nextCombatants].sort((a, b) => b.initiative - a.initiative);
      }

      return {
        ...prev,
        characters: prev.characters.map(c => {
          if (targetCombatant.characterId === c.id) {
            return {
              ...c,
              ...(updates.currentHp !== undefined ? { currentHp: updates.currentHp } : {}),
              ...(updates.tempHp !== undefined ? { tempHp: updates.tempHp } : {}),
              ...(updates.conditions !== undefined ? { conditions: updates.conditions } : {}),
              ...(updates.tempHpMax !== undefined ? { tempHpMax: updates.tempHpMax } : {}),
              ...(updates.tempAcModifier !== undefined ? { tempAc: updates.tempAcModifier } : {}),
              ...(updates.statusId !== undefined ? { statusId: updates.statusId } : {}),
              ...(updates.deathSavesFails !== undefined ? { deathSavesFails: updates.deathSavesFails } : {}),
              ...(updates.deathSavesSuccesses !== undefined ? { deathSavesSuccesses: updates.deathSavesSuccesses } : {}),
            };
          }
          return c;
        }),
        encounterCombatants: prev.encounterCombatants.map(item => {
          if (targetCombatant.encounterCombatantId === item.id) {
            return {
              ...item,
              ...(updates.conditionTimers !== undefined ? { conditionTimers: updates.conditionTimers } : {}),
              ...(updates.currentHp !== undefined && targetCombatant.type === 'npc' ? { npcCurrentHp: updates.currentHp } : {}),
              ...(updates.tempHp !== undefined && targetCombatant.type === 'npc' ? { npcTempHp: updates.tempHp } : {}),
              ...(updates.conditions !== undefined && targetCombatant.type === 'npc' ? { npcCurrentConditions: updates.conditions } : {}),
              ...(updates.tempAcModifier !== undefined && targetCombatant.type === 'npc' ? { npcTempAcMod: updates.tempAcModifier } : {}),
              ...(updates.legendaryActions !== undefined && targetCombatant.type === 'npc' ? { npcLegendaryActionsRemaining: updates.legendaryActions?.remaining ?? 0 } : {}),
              ...(updates.legendaryResistances !== undefined && targetCombatant.type === 'npc' ? { npcLegendaryResistancesRemaining: updates.legendaryResistances?.remaining ?? 0 } : {}),
              ...(updates.rechargeAbilities !== undefined && targetCombatant.type === 'npc' ? { npcRechargeState: JSON.stringify(Object.fromEntries((updates.rechargeAbilities || []).map(a => [a.name, a.isCharged]))) } : {}),
            };
          }
          return item;
        }),
        combatState: { ...prev.combatState, combatants: nextCombatants },
      };
    });

    setSyncingIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      if (updates.initiative !== undefined && targetCombatant.encounterCombatantId) {
        await updateInitiativeDB(targetCombatant.encounterCombatantId, updates.initiative);
      }

      if (updates.conditionTimers !== undefined && targetCombatant.encounterCombatantId) {
        await updateConditionTimersDB(targetCombatant.encounterCombatantId, updates.conditionTimers);
      }

      if (targetCombatant.type === 'pc' && targetCombatant.characterId) {
        const char = snapshot.characters.find(c => c.id === targetCombatant.characterId);
        if (char) {
          await updateCharacterDB(
            {
              currentHp: targetCombatant.currentHp,
              tempHp: targetCombatant.tempHp,
              conditions: targetCombatant.conditions,
              tempHpMax: targetCombatant.tempHpMax,
              tempAc: targetCombatant.tempAcModifier,
              statusId: targetCombatant.statusId,
              deathSavesFails: targetCombatant.deathSavesFails,
              deathSavesSuccesses: targetCombatant.deathSavesSuccesses,
            },
            char
          );
        }
      } else if (targetCombatant.type === 'npc') {
        if (targetCombatant.encounterCombatantId && (updates.currentHp !== undefined || updates.tempHp !== undefined)) {
          await updateNpcInstanceHpDB(
            targetCombatant.encounterCombatantId,
            targetCombatant.currentHp,
            targetCombatant.tempHp || 0
          );
        }
        if (targetCombatant.encounterCombatantId && updates.conditions !== undefined) {
          await updateNpcInstanceConditionsDB(
            targetCombatant.encounterCombatantId,
            updates.conditions
          );
        }
        if (targetCombatant.encounterCombatantId && updates.tempAcModifier !== undefined) {
          await updateNpcInstanceAcModDB(
            targetCombatant.encounterCombatantId,
            updates.tempAcModifier
          );
        }
        if (targetCombatant.encounterCombatantId && (updates.legendaryActions !== undefined || updates.legendaryResistances !== undefined)) {
          await updateNpcInstanceLegendaryDB(
            targetCombatant.encounterCombatantId,
            targetCombatant.legendaryActions?.remaining ?? 0,
            targetCombatant.legendaryResistances?.remaining ?? 0
          );
        }
        if (targetCombatant.encounterCombatantId && updates.rechargeAbilities !== undefined) {
          const rechargeStateRecord = Object.fromEntries(
            (targetCombatant.rechargeAbilities || []).map(a => [a.name, a.isCharged])
          );
          await updateNpcInstanceRechargeDB(targetCombatant.encounterCombatantId, rechargeStateRecord);
        }
      }

      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      updateState(prev => ({
        ...prev,
        characters: snapshot.characters,
        encounterCombatants: snapshot.encounterCombatants,
        combatState: {
          ...prev.combatState,
          combatants: snapshot.combatState.combatants,
        }
      }));
      toast.error('Failed to save changes. Please try again.');
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      throw error;
    }

    // Section F: Post-success combat logging
    const { addCombatEvent, activeCombatLog, combatState } = useDashboardStore.getState();
    if (activeCombatLog) {
      const activeTurnCombatant = combatState.combatants.find(x => x.id === combatState.activeTurnId);
      const preMutationCombatant = snapshot.combatState.combatants.find(x => x.id === id);

      const eventsToLog = getCombatantStateLogEvents(
        id,
        updates,
        preMutationCombatant,
        activeTurnCombatant,
        activeCombatLog.currentRound
      );

      eventsToLog.forEach(evt => addCombatEvent(evt));
    }
  };

  return {
    syncingIds,
    updateCombatant,
    removeCombatant
  };
}

/**
 * Pure helper function to calculate the combat events that should be logged
 * based on state transitions of a combatant (conditions, resources, etc.).
 */
export function getCombatantStateLogEvents(
  id: string,
  updates: Partial<Combatant>,
  currentCombatant: Combatant | undefined,
  activeTurnCombatant: Combatant | undefined,
  currentRound: number
): Omit<CombatEvent, 'id' | 'timestamp'>[] {
  const events: Omit<CombatEvent, 'id' | 'timestamp'>[] = [];

  if (updates.conditions !== undefined) {
    const oldConditions = parseCommaSeparatedList(currentCombatant?.conditions);
    const newConditions = parseCommaSeparatedList(updates.conditions);

    newConditions
      .filter(c => !oldConditions.includes(c))
      .forEach(condition => {
        events.push({
          round: currentRound,
          type: 'condition-applied',
          actorId: activeTurnCombatant?.id ?? null,
          actorName: activeTurnCombatant?.name ?? null,
          targetId: id,
          targetName: currentCombatant?.name ?? null,
          condition,
          isManualAdjustment: false,
        });
      });

    oldConditions
      .filter(c => !newConditions.includes(c))
      .forEach(condition => {
        events.push({
          round: currentRound,
          type: 'condition-removed',
          actorId: activeTurnCombatant?.id ?? null,
          actorName: activeTurnCombatant?.name ?? null,
          targetId: id,
          targetName: currentCombatant?.name ?? null,
          condition,
          isManualAdjustment: false,
        });
      });
  }

  if (updates.legendaryActions !== undefined || updates.legendaryResistances !== undefined) {
    if (currentCombatant) {
      if (updates.legendaryActions !== undefined) {
        const before = currentCombatant.legendaryActions?.remaining ?? 0;
        const after = updates.legendaryActions.remaining;
        if (before !== after) {
          events.push({
            round: currentRound,
            type: 'resource-changed',
            actorId: activeTurnCombatant?.id ?? null,
            actorName: activeTurnCombatant?.name ?? null,
            targetId: id,
            targetName: currentCombatant.name,
            resourceName: 'Legendary Actions',
            resourceBefore: before,
            resourceAfter: after,
            resourceMax: updates.legendaryActions.max,
            isManualAdjustment: false,
          });
        }
      }

      if (updates.legendaryResistances !== undefined) {
        const before = currentCombatant.legendaryResistances?.remaining ?? 0;
        const after = updates.legendaryResistances.remaining;
        if (before !== after) {
          events.push({
            round: currentRound,
            type: 'resource-changed',
            actorId: activeTurnCombatant?.id ?? null,
            actorName: activeTurnCombatant?.name ?? null,
            targetId: id,
            targetName: currentCombatant.name,
            resourceName: 'Legendary Resistances',
            resourceBefore: before,
            resourceAfter: after,
            resourceMax: updates.legendaryResistances.max,
            isManualAdjustment: false,
          });
        }
      }
    }
  }

  return events;
}

/**
 * Pure helper function to compute automatic downstream state changes resulting from
 * direct updates to a combatant (e.g., condition timers cleanup, AC-modifier recalculation,
 * exhaustion Max-HP capping, and rage-event triggering).
 */
export function calculateCombatantStateUpdates(
  currentCombatant: Combatant,
  updates: Partial<Combatant>
): {
  updates: Partial<Combatant>;
  notifications: {
    type: 'warning' | 'success';
    message: string;
    description?: string;
  }[];
  rageTriggered: boolean;
} {
  let mergedUpdates = { ...updates };
  const notifications: {
    type: 'warning' | 'success';
    message: string;
    description?: string;
  }[] = [];
  let rageTriggered = false;

  if (mergedUpdates.conditions !== undefined) {
    const newConditions = Array.from(new Set(parseCommaSeparatedList(mergedUpdates.conditions, { toLowerCase: true })));
    const newConditionSet = new Set(newConditions);

    if (currentCombatant.conditionTimers) {
      const cleanedTimers = Object.fromEntries(
        Object.entries(currentCombatant.conditionTimers)
          .filter(([key]) => newConditionSet.has(key.toLowerCase()))
      );

      if (Object.keys(cleanedTimers).length !== Object.keys(currentCombatant.conditionTimers).length) {
        mergedUpdates = { ...mergedUpdates, conditionTimers: cleanedTimers };
      }
    }

    const newAcMod = calculateConditionAcModifier(newConditions);
    if (newAcMod !== (currentCombatant.tempAcModifier || 0)) {
      mergedUpdates = { ...mergedUpdates, tempAcModifier: newAcMod };
    }

    if (currentCombatant.type === 'pc') {
      const conditionSummary = buildConditionSummary(newConditions);
      
      const { tempHpMax, changed } = calculateExhaustionHpCap(
        currentCombatant.maxHp,
        conditionSummary.hpMaxHalved,
        currentCombatant.tempHpMax || 0
      );
      
      if (changed === 'gained') {
        mergedUpdates = { ...mergedUpdates, tempHpMax };
        
        const currentHpVal = mergedUpdates.currentHp !== undefined ? mergedUpdates.currentHp : currentCombatant.currentHp;
        if (currentHpVal > tempHpMax) {
          mergedUpdates.currentHp = tempHpMax;
        }
        
        notifications.push({
          type: 'warning',
          message: `${currentCombatant.name}'s Max HP is halved from exhaustion!`,
          description: `Effective Max HP is now ${tempHpMax}`,
        });
      } else if (changed === 'lost') {
        mergedUpdates = { ...mergedUpdates, tempHpMax };
        notifications.push({
          type: 'success',
          message: `${currentCombatant.name}'s Max HP restriction is lifted.`,
        });
      }
    }

    const oldConditions = parseCommaSeparatedList(currentCombatant.conditions, { toLowerCase: true });
    const hadRaging = oldConditions.includes('raging');
    const nowHasRaging = newConditions.includes('raging');

    if (!hadRaging && nowHasRaging && currentCombatant.type === 'pc') {
      rageTriggered = true;
    }
  }

  return {
    updates: mergedUpdates,
    notifications,
    rageTriggered,
  };
}
