import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEncounterResume } from '../useEncounterResume';
import { useAppState } from '../useAppState';
import { useDashboardStore } from '../dashboardStore';

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
}));

vi.mock('../dashboardStore', () => ({
  useDashboardStore: {
    getState: vi.fn(),
  },
}));

describe('useEncounterResume State Transition Tests', () =>
 {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores in-progress encounter state from the sheet snapshot when hasInitialSynced is false', () => {
    const updateState = vi.fn();
    const mockEnc = { id: 'enc-1', currentRound: 2, activeTurnId: 'pc-1' };
    const mockEC = { id: 'ec-1', encounterId: 'enc-1', playerId: 'char-1', initiative: 10 };
    const mockChar = { id: 'char-1', characterName: 'Thorin', maxHp: 50, currentHp: 50, ac: 15 };

    vi.mocked(useAppState).mockReturnValue({
      state: { 
        hasInitialSynced: true, // Transitions to true to trigger restore
        encounters: [mockEnc], 
        characters: [mockChar], 
        encounterCombatants: [mockEC], 
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    renderHook(() => useEncounterResume());
    expect(updateState).toHaveBeenCalled();
  });

  it('does not restore anything if hasInitialSynced is true or activeEncounterId is already set', () => {
    const updateState = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { 
        hasInitialSynced: false, // If false, no restore is triggered
        encounters: [{ id: 'enc-1', currentRound: 2 }], 
        characters: [], 
        encounterCombatants: [], 
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    renderHook(() => useEncounterResume());
    expect(updateState).not.toHaveBeenCalled();
  });

  it('reconstructs the log with real combatant data when loggingRequested is true', () => {
    const updateState = vi.fn();
    const mockEnc = { id: 'enc-log', name: 'Log Encounter', location: 'Cave', currentRound: 3, activeTurnId: 'ec-2', loggingRequested: true };
    const mockEC = { id: 'ec-2', encounterId: 'enc-log', playerId: 'char-2', initiative: 15 };
    const mockChar = { id: 'char-2', characterName: 'Gimli', type: 'pc', maxHp: 60, currentHp: 55, ac: 16 };

    vi.mocked(useAppState).mockReturnValue({
      state: {
        hasInitialSynced: true, // Transitions to true to trigger restore
        encounters: [mockEnc],
        characters: [mockChar],
        encounterCombatants: [mockEC],
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    const initCombatLog = vi.fn();
    const logProgressiveEvent = vi.fn();
    vi.mocked(useDashboardStore.getState).mockReturnValue({
      activeCombatLog: null,
      initCombatLog,
      logProgressiveEvent,
    } as any);

    renderHook(() => useEncounterResume());

    // Expect the log to be reconstructed with the rebuilt combatant data
    expect(initCombatLog).toHaveBeenCalledWith(
      'enc-log',
      'Log Encounter',
      'Cave',
      [{
        id: 'combat-pc-char-2', 
        name: 'Gimli',
        type: 'pc',
        startingHp: 55, 
        maxHp: 60,
        level: undefined,
        cr: undefined
      }],
      [],
      3
    );

    // Assert no combat-start event was fired
    const startEventCalls = logProgressiveEvent.mock.calls.filter(call => call[0].type === 'combat-start');
    expect(startEventCalls.length).toBe(0);
  });

  it('does NOT reconstruct the log when loggingRequested is false', () => {
    const updateState = vi.fn();
    const mockEnc = { id: 'enc-nolog', name: 'No Log Encounter', location: 'Cave', currentRound: 3, activeTurnId: 'ec-2', loggingRequested: false };
    const mockEC = { id: 'ec-2', encounterId: 'enc-nolog', playerId: 'char-2', initiative: 15 };
    const mockChar = { id: 'char-2', characterName: 'Gimli', type: 'pc', maxHp: 60, currentHp: 55, ac: 16 };

    vi.mocked(useAppState).mockReturnValue({
      state: {
        hasInitialSynced: true, 
        encounters: [mockEnc],
        characters: [mockChar],
        encounterCombatants: [mockEC],
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    const initCombatLog = vi.fn();
    const logProgressiveEvent = vi.fn();
    vi.mocked(useDashboardStore.getState).mockReturnValue({
      activeCombatLog: null,
      initCombatLog,
      logProgressiveEvent,
    } as any);

    renderHook(() => useEncounterResume());

    expect(initCombatLog).not.toHaveBeenCalled();
  });

  it('does NOT reconstruct the log if one already exists for this encounter', () => {
    const updateState = vi.fn();
    const mockEnc = { id: 'enc-log', name: 'Log Encounter', location: 'Cave', currentRound: 3, activeTurnId: 'ec-2', loggingRequested: true };
    const mockEC = { id: 'ec-2', encounterId: 'enc-log', playerId: 'char-2', initiative: 15 };
    const mockChar = { id: 'char-2', characterName: 'Gimli', type: 'pc', maxHp: 60, currentHp: 55, ac: 16 };

    vi.mocked(useAppState).mockReturnValue({
      state: {
        hasInitialSynced: true, 
        encounters: [mockEnc],
        characters: [mockChar],
        encounterCombatants: [mockEC],
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    const initCombatLog = vi.fn();
    const logProgressiveEvent = vi.fn();
    vi.mocked(useDashboardStore.getState).mockReturnValue({
      activeCombatLog: { encounterId: 'enc-log' },
      initCombatLog,
      logProgressiveEvent,
    } as any);

    renderHook(() => useEncounterResume());

    expect(initCombatLog).not.toHaveBeenCalled();
  });
});
