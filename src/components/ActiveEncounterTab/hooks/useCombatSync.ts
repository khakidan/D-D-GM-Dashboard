import { useState, useRef, useEffect } from 'react';
import { useAppState } from '../../../hooks/useAppState';
import { useCombatantMutations } from './useCombatantMutations';
import { useCombatLifecycle } from './useCombatLifecycle';
import { useCombatTurn } from './useCombatTurn';
import { useCombatConcentration } from './useCombatConcentration';
import { toast } from 'sonner';
import { useDeathEvent, useDamageEvent, useHealEvent, useUnconsciousEvent, useRageEvent } from '../../../hooks/useCombatOverlayEvents';
import { TIMERS } from '../../../lib/constants';

export function useCombatSync() {
  const { state, updateState } = useAppState();
  
  const { syncingIds, updateCombatant, removeCombatant } = useCombatantMutations();
  const { rollInitForNPCs, resetCombat, cancelCombat, handleCallInitiative, recordEncounter } = useCombatLifecycle();
  const { nextTurn } = useCombatTurn(updateCombatant);
  const {
    concentrationPrompt,
    setConcentrationPrompt,
    handleConcentrationPrompt,
    handleSelectCaster
  } = useCombatConcentration(updateCombatant);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const globalErrorTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (globalErrorTimerRef.current) clearTimeout(globalErrorTimerRef.current);
    };
  }, []);

  const { fire: fireDeathEvent } = useDeathEvent();
  const { fire: fireDamageEvent } = useDamageEvent();
  const { fire: fireHealEvent } = useHealEvent();
  const { fire: fireUnconsciousEvent } = useUnconsciousEvent();
  const { fire: fireRageEvent } = useRageEvent();

  const handleError = (err: any, fallbackMsg: string) => {
    const _e = typeof err !== 'undefined' ? err : null;
    if (_e && ((_e as any).message === 'UNAUTHENTICATED' || (_e as any).error === 'UNAUTHENTICATED')) {
      toast.error('Session expired — please sign in again.', {
        description: 'Your Google session timed out. Use the Connect & Sync button to reconnect.',
        duration: 8000,
      });
    } else {
      setGlobalError(fallbackMsg);
      if (globalErrorTimerRef.current) clearTimeout(globalErrorTimerRef.current);
      globalErrorTimerRef.current = setTimeout(() => setGlobalError(null), TIMERS.combatSyncErrorMs);
    }
  };

  return {
    syncingIds,
    globalError,
    setGlobalError,
    handleError,
    removeCombatant,
    updateCombatant,
    fireDeathEvent,
    fireDamageEvent,
    fireHealEvent,
    fireUnconsciousEvent,
    fireRageEvent,
    rollInitForNPCs,
    resetCombat,
    cancelCombat,
    handleCallInitiative,
    recordEncounter,
    nextTurn,
    handleConcentrationPrompt,
    handleSelectCaster,
    concentrationPrompt,
    setConcentrationPrompt
  };
}
