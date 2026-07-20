import { AppState, Combatant } from '../../../types';

export function withDefaultCombatState(
  prevCombatState: AppState['combatState'] | undefined, 
  updatedCombatants: Combatant[]
) {
  return {
    activeEncounterId: prevCombatState?.activeEncounterId ?? null,
    activeTurnId: prevCombatState?.activeTurnId ?? null,
    round: prevCombatState?.round ?? 1,
    concentrationLinks: prevCombatState?.concentrationLinks ?? {},
    selectedIds: prevCombatState?.selectedIds ?? [],
    isSelectionMode: prevCombatState?.isSelectionMode ?? false,
    syncingIds: prevCombatState?.syncingIds ?? [],
    expandedIds: prevCombatState?.expandedIds ?? [],
    combatStarted: prevCombatState?.combatStarted ?? false,
    actionContext: prevCombatState?.actionContext ?? { sourceOverride: null, actionType: 'attack' },
    ...prevCombatState,
    combatants: updatedCombatants,
  };
}