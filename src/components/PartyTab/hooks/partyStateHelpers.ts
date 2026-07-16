import { AppState, Combatant } from '../../../types';

export function withDefaultCombatState(
  prevCombatState: AppState['combatState'] | undefined, 
  updatedCombatants: Combatant[]
) {
  return {
    activeEncounterId: prevCombatState?.activeEncounterId ?? null,
    activeTurnId: prevCombatState?.activeTurnId ?? null,
    round: prevCombatState?.round ?? 1,
    ...prevCombatState,
    combatants: updatedCombatants,
  };
}
