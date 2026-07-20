import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useCombatSync } from '../hooks/useCombatSync';
import { useDashboardStore, getSnapshot } from '../../../hooks/useAppState';
import { getSpreadsheetId, setSpreadsheetId } from '../../../services/sheetsService';
import { toast } from 'sonner';
import {
  updateEncounterStateDB,
  updateInitiativeDB,
  deleteEncounterCombatantDB,
  updateEncounterCombatantQuantityDB,
  updateCharacterDB,
  updateNpcInstanceHpDB,
  updateNpcInstanceConditionsDB,
  updateNpcInstanceAcModDB,
  appendEncounterLog,
  fetchEncounterLogEventsDB,
  updateEncounterLoggingRequestedDB,
} from '../../../services/dbOperations';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('../../../services/dbOperations', () => ({
  updateEncounterStateDB: vi.fn().mockResolvedValue(true),
  updateInitiativeDB: vi.fn().mockResolvedValue(true),
  deleteEncounterCombatantDB: vi.fn().mockResolvedValue(undefined),
  updateEncounterCombatantQuantityDB: vi.fn().mockResolvedValue(undefined),
  updateCharacterDB: vi.fn().mockResolvedValue(undefined),
  updateConditionTimersDB: vi.fn().mockResolvedValue(undefined),
  updateNpcInstanceHpDB: vi.fn().mockResolvedValue(undefined),
  updateNpcInstanceConditionsDB: vi.fn().mockResolvedValue(undefined),
  updateNpcInstanceAcModDB: vi.fn().mockResolvedValue(undefined),
  updateNpcInstanceLegendaryDB: vi.fn().mockResolvedValue(undefined),
  appendEncounterLog: vi.fn().mockResolvedValue(undefined),
  fetchEncounterLogEventsDB: vi.fn().mockResolvedValue([]),
  updateEncounterLoggingRequestedDB: vi.fn().mockResolvedValue(undefined),
  appendEncounterLogEventDB: vi.fn().mockResolvedValue(undefined),
}));

describe('useCombatSync', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    // Setup 3 mock combatants in the store
    act(() => {
      useDashboardStore.setState({
        combatState: {
          activeEncounterId: 'enc-1',
          activeTurnId: 'c1',
          round: 1,
          selectedIds: [],
          isSelectionMode: false,
          syncingIds: [],
          expandedIds: [],
          concentrationLinks: {},
          combatStarted: true,
          actionContext: { sourceOverride: null, actionType: 'attack' },
          combatants: [
            { id: 'c1', name: 'PC 1', type: 'pc', initiative: 20, reactionUsed: true, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10 },
            { id: 'c2', name: 'NPC 1', type: 'npc', initiative: 15, reactionUsed: true, legendaryActions: { max: 3, remaining: 1 }, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10 },
            { id: 'c3', name: 'PC 2', type: 'pc', initiative: 10, reactionUsed: true, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10 }
          ]
        },
        characters: [],
        npcs: [],
        encounters: [{ id: 'enc-1', name: 'Encounter 1' }] as any,
        encounterCombatants: []
      });
    });
  });

  it('nextTurn sorts and establishes first turn when combatStarted is false', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatStarted: false,
          activeTurnId: 'c2', // Incorrect turn before sorting
          combatants: [
            { id: 'c3', name: 'PC 2', type: 'pc', initiative: 10, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10 },
            { id: 'c1', name: 'PC 1', type: 'pc', initiative: 20, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10 },
            { id: 'c2', name: 'NPC 1', type: 'npc', initiative: 15, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10 }
          ]
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    // Should be sorted by initiative descending
    expect(state.combatState.combatants[0].id).toBe('c1');
    expect(state.combatState.combatants[1].id).toBe('c2');
    expect(state.combatState.combatants[2].id).toBe('c3');
    // Active turn should be the one with highest initiative
    expect(state.combatState.activeTurnId).toBe('c1');
    expect(state.combatState.combatStarted).toBe(true);
    expect(vi.mocked(updateEncounterStateDB)).toHaveBeenCalledWith('enc-1', 1, 'c1');
  });

  it('nextTurn skips NPCs at 0 HP', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c1',
          combatants: [
            { id: 'c1', name: 'PC 1', type: 'pc', initiative: 20, currentHp: 50, ac: 15, maxHp: 50, passivePerception: 10 },
            { id: 'c2', name: 'NPC 1', type: 'npc', initiative: 15, currentHp: 0, ac: 15, maxHp: 30, passivePerception: 10 },
            { id: 'c3', name: 'PC 2', type: 'pc', initiative: 10, currentHp: 10, ac: 15, maxHp: 30, passivePerception: 10 } // PC is above 0 HP so not skipped (combatants at 0 HP are skipped under new rules)
          ]
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    // From c1, it should skip c2 (NPC at 0 HP) and go to c3 (PC at 0 HP)
    act(() => {
      result.current.nextTurn();
    });

    const state1 = getSnapshot();
    expect(state1.combatState.activeTurnId).toBe('c3');

    // From c3, it should wrap to c1
    act(() => {
      result.current.nextTurn();
    });

    const state2 = getSnapshot();
    expect(state2.combatState.activeTurnId).toBe('c1');
    expect(state2.combatState.round).toBe(2);
  });

  it('nextTurn sets activeTurnId to null if all remaining combatants are dead NPCs', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c1',
          combatants: [
            { id: 'c1', name: 'NPC 1', type: 'npc', initiative: 20, currentHp: 10, ac: 15, maxHp: 10, passivePerception: 10 },
            { id: 'c2', name: 'NPC 2', type: 'npc', initiative: 10, currentHp: 0, ac: 15, maxHp: 10, passivePerception: 10 }
          ]
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    // Reduce c1 to 0 HP
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState.combatants.map(c => c.id === 'c1' ? { ...c, currentHp: 0 } : c)
        }
      }));
    });

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    expect(state.combatState.activeTurnId).toBeNull();
  });

  it('nextTurn advances activeTurnId to the next combatant in order', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    expect(state.combatState.activeTurnId).toBe('c2');
    expect(state.combatState.round).toBe(1);
  });

  it('nextTurn increments round when wrapping from last combatant to first', () => {
    // Set active turn to the last combatant (c3)
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c3'
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    expect(state.combatState.activeTurnId).toBe('c1');
    expect(state.combatState.round).toBe(2);
  });

  it('nextTurn resets reactionUsed to false for the newly active combatant only', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    const c1 = state.combatState.combatants.find(c => c.id === 'c1');
    const c2 = state.combatState.combatants.find(c => c.id === 'c2');
    const c3 = state.combatState.combatants.find(c => c.id === 'c3');

    // Newly active combatant (c2) should have reactionUsed: false
    expect(c2?.reactionUsed).toBe(false);
    // Other combatants (c1, c3) remain unchanged
    expect(c1?.reactionUsed).toBe(true);
    expect(c3?.reactionUsed).toBe(true);
  });

  it('nextTurn auto-resets legendary actions to max when an NPC becomes active', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    const c2 = state.combatState.combatants.find(c => c.id === 'c2');

    // NPC 1 (c2) should have legendaryActions.remaining reset to max (3)
    expect(c2?.legendaryActions?.remaining).toBe(3);
  });

  it('nextTurn calls updateEncounterStateDB with the new activeTurnId', async () => {
    const { result } = renderHook(() => useCombatSync());

    await act(async () => {
      await result.current.nextTurn();
    });

    expect(vi.mocked(updateEncounterStateDB)).toHaveBeenCalledWith(
      'enc-1',        // encounter ID
      1,              // round (still 1)
      'c2'            // NEW active turn
    );
  });

  it('nextTurn calls updateEncounterStateDB with incremented round on wrap', async () => {
    // Set active turn to the last combatant (c3)
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c3'
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    await act(async () => {
      await result.current.nextTurn();
    });

    expect(vi.mocked(updateEncounterStateDB)).toHaveBeenCalledWith(
      'enc-1',        // encounter ID
      2,              // incremented round
      'c1'            // wraps to first
    );
  });

  it('nextTurn resets actionContext to default on turn advance, even if manually set beforehand', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          actionContext: { sourceOverride: 'c3', actionType: 'legendary-action' }
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    expect(state.combatState.actionContext).toEqual({
      sourceOverride: null,
      actionType: 'attack'
    });
  });

  it('nextTurn triggers recharge prompt for newly active NPC with unrecharged abilities', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c1',
          combatants: [
            { id: 'c1', name: 'PC 1', type: 'pc', initiative: 20, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10 },
            { id: 'c2', name: 'NPC 1', type: 'npc', initiative: 15, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10, rechargeAbilities: [{ name: 'Fire Breath', rechargeOn: 5, isCharged: false }] },
            { id: 'c3', name: 'PC 2', type: 'pc', initiative: 10, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10 }
          ]
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    expect(toast).toHaveBeenCalled();
  });

  it('nextTurn does NOT trigger recharge prompt for newly active PC or NPC with already charged abilities', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c1',
          combatants: [
            { id: 'c1', name: 'PC 1', type: 'pc', initiative: 20, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10 },
            { id: 'c2', name: 'NPC 1', type: 'npc', initiative: 15, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10, rechargeAbilities: [{ name: 'Fire Breath', rechargeOn: 5, isCharged: true }] },
            { id: 'c3', name: 'PC 2', type: 'pc', initiative: 10, ac: 15, maxHp: 30, currentHp: 30, passivePerception: 10 }
          ]
        }
      }));
    });

    vi.mocked(toast).mockClear();

    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const calledIds = vi.mocked(toast).mock.calls.map(call => (call[1] as any)?.id);
    expect(calledIds.includes('recharge-c2')).toBe(false);
  });

  it('removeCombatant calls deleteEncounterCombatantDB when quantity is 1', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [
            ...prev.combatState.combatants,
            {
              id: 'c-remove',
              name: 'Goblin',
              type: 'npc',
              initiative: 5,
              encounterCombatantId: 'ec-1',
              ac: 15,
              maxHp: 10,
              currentHp: 10,
              passivePerception: 10,
            }
          ]
        },
        encounterCombatants: [{
          id: 'ec-1',
          encounterId: 'enc-1',
          npcId: 'npc-1',
          playerId: null,
          quantity: 1,
          initiative: 5,
          conditionTimers: {},
          npcCurrentHp: 10,
          npcTempHp: 0,
          npcCurrentConditions: '',
          npcTempAcMod: 0,
        }]
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    await act(async () => {
      await result.current
        .removeCombatant('c-remove');
    });

    expect(
      vi.mocked(deleteEncounterCombatantDB)
    ).toHaveBeenCalledWith('ec-1');
  });

  it('removeCombatant calls deleteEncounterCombatantDB even when quantity > 1', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [
            ...prev.combatState.combatants,
            {
              id: 'c-remove',
              name: 'Goblin',
              type: 'npc',
              initiative: 5,
              encounterCombatantId: 'ec-1',
              ac: 15,
              maxHp: 10,
              currentHp: 10,
              passivePerception: 10,
            }
          ]
        },
        encounterCombatants: [{
          id: 'ec-1',
          encounterId: 'enc-1',
          npcId: 'npc-1',
          playerId: null,
          quantity: 3,
          initiative: 5,
          conditionTimers: {},
          npcCurrentHp: 10,
          npcTempHp: 0,
          npcCurrentConditions: '',
          npcTempAcMod: 0,
        }]
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    await act(async () => {
      await result.current
        .removeCombatant('c-remove');
    });

    expect(
      vi.mocked(deleteEncounterCombatantDB)
    ).toHaveBeenCalledWith('ec-1');
  });

  it('updateCombatant for PC calls updateCharacterDB with updated HP', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [
            {
              id: 'c1',
              name: 'PC 1',
              type: 'pc',
              initiative: 20,
              characterId: 'char-1',
              encounterCombatantId: 'ec-pc-1',
              currentHp: 30,
              maxHp: 40,
              tempHp: 0,
              conditions: '',
              ac: 15,
              passivePerception: 10,
            }
          ]
        },
        characters: [{
          id: 'char-1',
          characterName: 'Hero',
          currentHp: 30,
          maxHp: 40,
          tempHp: 0,
          conditions: '',
          level: 5,
          ac: 15,
        }] as any,
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    await act(async () => {
      await result.current.updateCombatant(
        'c1',
        { currentHp: 25 }
      );
    });

    expect(
      vi.mocked(updateCharacterDB)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        currentHp: 25,
      }),
      expect.objectContaining({
        id: 'char-1',
      })
    );
  });

  it('updateCombatant for NPC calls updateNpcInstanceHpDB', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [
            {
              id: 'c2',
              name: 'NPC 1',
              type: 'npc',
              initiative: 15,
              encounterCombatantId: 'ec-npc-1',
              currentHp: 10,
              maxHp: 20,
              tempHp: 0,
              conditions: '',
              ac: 15,
              passivePerception: 10,
            }
          ]
        }
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    await act(async () => {
      await result.current.updateCombatant(
        'c2',
        { currentHp: 8, tempHp: 0 }
      );
    });

    expect(
      vi.mocked(updateNpcInstanceHpDB)
    ).toHaveBeenCalledWith('ec-npc-1', 8, 0);
  });

  it('rollInitForNPCs calls updateInitiativeDB for each NPC combatant', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState
            .combatants.map(c =>
              c.id === 'c2'
                ? { ...c,
                    encounterCombatantId:
                      'ec-npc-2' }
                : c
            )
        }
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    act(() => {
      result.current.rollInitForNPCs();
    });

    expect(
      vi.mocked(updateInitiativeDB)
    ).toHaveBeenCalledWith(
      'ec-npc-2',
      expect.any(Number)
    );
  });

  it('rolls 0 or negative initiative for NPC with low DEX score and does not clamp to 1', () => {
    // Mock Math.random to return 0, making d20 roll deterministically 1
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        npcs: [
          {
            id: 'npc-negative-dex',
            name: 'Slow Snail',
            abilityScores: JSON.stringify({ DEX: 1 }),
          } as any
        ],
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState.combatants.map(c =>
            c.id === 'c2'
              ? {
                  ...c,
                  npcId: 'npc-negative-dex',
                  encounterCombatantId: 'ec-npc-2',
                }
              : c
          ),
        },
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.rollInitForNPCs();
    });

    const state = getSnapshot();
    const updatedNpc = state.combatState.combatants.find(c => c.id === 'c2');
    
    // d20 roll (1) + DEX modifier (-5 for score of 1) = -4
    expect(updatedNpc?.initiative).toBe(-4);
    expect(vi.mocked(updateInitiativeDB)).toHaveBeenCalledWith('ec-npc-2', -4);

    randomSpy.mockRestore();
  });


  it('recordEncounter initializes combat log and updates DB if not already initialized', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        encounters: [{
          id: 'test-enc-id',
          name: 'Test Encounter',
          location: 'Test Location',
          status: 'active',
          difficultyId: 1,
          difficultyName: 'Easy',
          npcDefinitions: ''
        }],
        combatState: {
          ...prev.combatState,
          activeEncounterId: 'test-enc-id',
          round: 2,
          combatants: [
            { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10 }
          ]
        },
        activeCombatLog: null // Not initialized
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    await act(async () => {
      await result.current.recordEncounter();
    });

    // Verify initCombatLog was called (activeCombatLog is now set)
    expect(useDashboardStore.getState().activeCombatLog).not.toBeNull();
    expect(useDashboardStore.getState().activeCombatLog?.encounterId).toBe('test-enc-id');
    expect(useDashboardStore.getState().activeCombatLog?.events.length).toBeGreaterThan(0); // the combat-start event

    // Verify DB update
    expect(vi.mocked(updateEncounterLoggingRequestedDB)).toHaveBeenCalledWith('test-enc-id', true);
  });

  it('does not reset activeCombatLog or clear events when GM clicks Record Encounter then Call for Initiative', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        encounters: [{
          id: 'test-enc-id',
          name: 'Test Encounter',
          location: 'Test Location',
          status: 'active',
          difficultyId: 1,
          difficultyName: 'Easy',
          npcDefinitions: ''
        }],
        combatState: {
          ...prev.combatState,
          activeEncounterId: 'test-enc-id',
          round: 1,
          combatants: [
            { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10 }
          ]
        },
        activeCombatLog: null // Start uninitialized
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    // 1. GM clicks "Record Encounter"
    await act(async () => {
      await result.current.recordEncounter();
    });

    // Check first event is combat-start
    const log1 = useDashboardStore.getState().activeCombatLog;
    expect(log1).not.toBeNull();
    expect(log1?.encounterId).toBe('test-enc-id');
    expect(log1?.events).toHaveLength(1);
    expect(log1?.events[0].type).toBe('combat-start');
    const originalEventId = log1?.events[0].id;

    // 2. GM clicks "Call for Initiative"
    act(() => {
      result.current.handleCallInitiative();
    });

    // Verify it didn't overwrite/re-init activeCombatLog
    const log2 = useDashboardStore.getState().activeCombatLog;
    expect(log2).not.toBeNull();
    expect(log2?.encounterId).toBe('test-enc-id');
    expect(log2?.events).toHaveLength(1);
    expect(log2?.events[0].id).toBe(originalEventId); // original combat-start event remains intact
  });

  it('resetCombat fetches fresh events and appends to encounter log', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeEncounterId: 'test-enc-id',
          combatants: [
            { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10, encounterCombatantId: 'ec-1' }
          ]
        },
        activeCombatLog: {
          encounterId: 'test-enc-id',
          encounterName: 'Test Encounter',
          location: 'Test Loc',
          startedAt: '2025-01-01',
          currentRound: 3,
          partySnapshot: [{ id: 'c1', type: 'pc', name: 'Char 1', startingHp: 10, maxHp: 10 }],
          initiativeOrder: [],
          events: [] // Initial events
        }
      }));
    });

    // Mock fresh events
    vi.mocked(fetchEncounterLogEventsDB).mockResolvedValueOnce([
      { round: 1, type: 'damage', actorId: 'c1', targetId: 'c2', value: 5, isManualAdjustment: false, timestamp: '2025' }
    ]);

    const { result } = renderHook(() => useCombatSync());

    await act(async () => {
      await result.current.resetCombat();
    });

    // Verify fetch was called
    expect(vi.mocked(fetchEncounterLogEventsDB)).toHaveBeenCalledWith('test-enc-id');

    // Verify append was called with the fresh events
    expect(vi.mocked(appendEncounterLog)).toHaveBeenCalled();
    const appendCall = vi.mocked(appendEncounterLog).mock.calls[0][1];
    expect(JSON.parse(appendCall.events)).toHaveLength(1);
    expect(JSON.parse(appendCall.events)[0].type).toBe('damage');

    // Verify logging turned off
    expect(vi.mocked(updateEncounterLoggingRequestedDB)).toHaveBeenCalledWith('test-enc-id', false);
  });

  it('resetCombat calls updateInitiativeDB with 0 for each combatant', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [
            { ...prev.combatState
                .combatants[0],
              encounterCombatantId: 'ec-1'
            },
            { ...prev.combatState
                .combatants[1],
              encounterCombatantId: 'ec-2'
            },
            { ...prev.combatState
                .combatants[2],
              encounterCombatantId: 'ec-3'
            },
          ]
        }
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    await act(async () => {
      await result.current.resetCombat();
    });

    expect(
      vi.mocked(updateInitiativeDB)
    ).toHaveBeenCalledWith('ec-1', 0);
    expect(
      vi.mocked(updateInitiativeDB)
    ).toHaveBeenCalledWith('ec-2', 0);
    expect(
      vi.mocked(updateInitiativeDB)
    ).toHaveBeenCalledWith('ec-3', 0);
  });

  it('updateCombatant logs legendary action and resistance changes when activeCombatLog is present', async () => {
    const logProgressiveEventSpy = vi.spyOn(useDashboardStore.getState(), 'logProgressiveEvent');
    
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        activeCombatLog: { id: 'log-1', currentRound: 3, events: [] } as any,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c1',
          combatants: [
            {
              id: 'c1',
              name: 'Hero',
              type: 'pc',
              initiative: 20,
              currentHp: 30,
              maxHp: 40,
              ac: 15,
              passivePerception: 10,
            },
            {
              id: 'c2',
              name: 'Lich',
              type: 'npc',
              initiative: 15,
              encounterCombatantId: 'ec-lich',
              currentHp: 100,
              maxHp: 100,
              legendaryActions: { max: 3, remaining: 3 },
              legendaryResistances: { max: 3, remaining: 3 },
              ac: 15,
              passivePerception: 10,
            }
          ]
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    await act(async () => {
      await result.current.updateCombatant('c2', {
        legendaryActions: { max: 3, remaining: 2 },
        legendaryResistances: { max: 3, remaining: 1 },
      });
    });

    expect(logProgressiveEventSpy).toHaveBeenCalledWith({
      round: 3,
      type: 'resource-changed',
      actorId: 'c1',
      actorName: 'Hero',
      targetId: 'c2',
      targetName: 'Lich',
      resourceName: 'Legendary Actions',
      resourceBefore: 3,
      resourceAfter: 2,
      resourceMax: 3,
      isManualAdjustment: false,
    });

    expect(logProgressiveEventSpy).toHaveBeenCalledWith({
      round: 3,
      type: 'resource-changed',
      actorId: 'c1',
      actorName: 'Hero',
      targetId: 'c2',
      targetName: 'Lich',
      resourceName: 'Legendary Resistances',
      resourceBefore: 3,
      resourceAfter: 1,
      resourceMax: 3,
      isManualAdjustment: false,
    });
  });

  it('updateCombatant does NOT log resource-changed events when legendary action/resistance values do not change', async () => {
    const logProgressiveEventSpy = vi.spyOn(useDashboardStore.getState(), 'logProgressiveEvent');
    
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        activeCombatLog: { id: 'log-1', currentRound: 3, events: [] } as any,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c1',
          combatants: [
            {
              id: 'c1',
              name: 'Hero',
              type: 'pc',
              initiative: 20,
              currentHp: 30,
              maxHp: 40,
              ac: 15,
              passivePerception: 10,
            },
            {
              id: 'c2',
              name: 'Lich',
              type: 'npc',
              initiative: 15,
              encounterCombatantId: 'ec-lich',
              currentHp: 100,
              maxHp: 100,
              legendaryActions: { max: 3, remaining: 3 },
              legendaryResistances: { max: 3, remaining: 3 },
              ac: 15,
              passivePerception: 10,
            }
          ]
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    await act(async () => {
      await result.current.updateCombatant('c2', {
        legendaryActions: { max: 3, remaining: 3 },
        legendaryResistances: { max: 3, remaining: 3 },
      });
    });

    // Verify no resource-changed events were added for c2
    const resourceChangedCalls = logProgressiveEventSpy.mock.calls.filter(call => {
      const arg = call[0] as any;
      return arg.type === 'resource-changed' && arg.targetId === 'c2';
    });

    expect(resourceChangedCalls.length).toBe(0);
  });

  describe('loggingRequested optimistic updates and rollback', () => {
    it('recordEncounter optimistically sets loggingRequested to true and rolls back on failure', async () => {
      act(() => {
        useDashboardStore.setState(prev => ({
          ...prev,
          encounters: [{
            id: 'test-enc-id',
            name: 'Test Encounter',
            location: 'Test Location',
            status: 'active',
            difficultyId: 1,
            difficultyName: 'Easy',
            npcDefinitions: '',
            loggingRequested: false,
          }],
          combatState: {
            ...prev.combatState,
            activeEncounterId: 'test-enc-id',
            round: 2,
            combatants: [
              { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10 }
            ]
          },
          activeCombatLog: null
        }));
      });

      // 1. Successful case
      vi.mocked(updateEncounterLoggingRequestedDB).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCombatSync());

      await act(async () => {
        await result.current.recordEncounter();
      });

      const encounterAfterSuccess = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
      expect(encounterAfterSuccess?.loggingRequested).toBe(true);

      // 2. Failure case with rollback
      vi.mocked(updateEncounterLoggingRequestedDB).mockRejectedValueOnce(new Error('DB Error'));

      // Set state back to false
      act(() => {
        useDashboardStore.setState(prev => ({
          ...prev,
          encounters: prev.encounters.map(e => e.id === 'test-enc-id' ? { ...e, loggingRequested: false } : e)
        }));
      });

      await act(async () => {
        await result.current.recordEncounter();
      });

      // Verification that loggingRequested is false due to rollback
      const encounterAfterFailure = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
      expect(encounterAfterFailure?.loggingRequested).toBe(false);
    });

    it('resetCombat optimistically sets loggingRequested to false and rolls back on failure', async () => {
      act(() => {
        useDashboardStore.setState(prev => ({
          ...prev,
          encounters: [{
            id: 'test-enc-id',
            name: 'Test Encounter',
            location: 'Test Location',
            status: 'active',
            difficultyId: 1,
            difficultyName: 'Easy',
            npcDefinitions: '',
            loggingRequested: true,
          }],
          combatState: {
            ...prev.combatState,
            activeEncounterId: 'test-enc-id',
            combatants: [
              { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10, encounterCombatantId: 'ec-1' }
            ]
          },
          activeCombatLog: {
            encounterId: 'test-enc-id',
            encounterName: 'Test Encounter',
            location: 'Test Loc',
            startedAt: '2025-01-01',
            currentRound: 3,
            partySnapshot: [{ id: 'c1', type: 'pc', name: 'Char 1', startingHp: 10, maxHp: 10 }],
            initiativeOrder: [],
            events: []
          }
        }));
      });

      // 1. Successful case
      vi.mocked(updateEncounterLoggingRequestedDB).mockResolvedValueOnce(undefined);
      vi.mocked(fetchEncounterLogEventsDB).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useCombatSync());

      await act(async () => {
        await result.current.resetCombat();
      });

      const encounterAfterSuccess = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
      expect(encounterAfterSuccess?.loggingRequested).toBe(false);

      // Reset state for failure testing
      act(() => {
        useDashboardStore.setState(prev => ({
          ...prev,
          encounters: [{
            id: 'test-enc-id',
            name: 'Test Encounter',
            location: 'Test Location',
            status: 'active',
            difficultyId: 1,
            difficultyName: 'Easy',
            npcDefinitions: '',
            loggingRequested: true,
          }],
          combatState: {
            ...prev.combatState,
            activeEncounterId: 'test-enc-id',
            combatants: [
              { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10, encounterCombatantId: 'ec-1' }
            ]
          },
          activeCombatLog: {
            encounterId: 'test-enc-id',
            encounterName: 'Test Encounter',
            location: 'Test Loc',
            startedAt: '2025-01-01',
            currentRound: 3,
            partySnapshot: [{ id: 'c1', type: 'pc', name: 'Char 1', startingHp: 10, maxHp: 10 }],
            initiativeOrder: [],
            events: []
          }
        }));
      });

      // 2. Failure case with rollback
      vi.mocked(updateEncounterLoggingRequestedDB).mockRejectedValueOnce(new Error('DB Error'));
      vi.mocked(fetchEncounterLogEventsDB).mockResolvedValueOnce([]);

      await act(async () => {
        await result.current.resetCombat();
      });

      const encounterAfterFailure = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
      expect(encounterAfterFailure?.loggingRequested).toBe(true);
    });

    it('cancelCombat optimistically sets loggingRequested to false and rolls back on failure', async () => {
      act(() => {
        useDashboardStore.setState(prev => ({
          ...prev,
          encounters: [{
            id: 'test-enc-id',
            name: 'Test Encounter',
            location: 'Test Location',
            status: 'active',
            difficultyId: 1,
            difficultyName: 'Easy',
            npcDefinitions: '',
            loggingRequested: true,
          }],
          combatState: {
            ...prev.combatState,
            activeEncounterId: 'test-enc-id',
            combatants: [
              { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10, encounterCombatantId: 'ec-1' }
            ]
          }
        }));
      });

      // 1. Successful case
      vi.mocked(updateEncounterLoggingRequestedDB).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCombatSync());

      await act(async () => {
        result.current.cancelCombat();
      });

      const encounterAfterSuccess = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
      expect(encounterAfterSuccess?.loggingRequested).toBe(false);

      // Reset state for failure testing
      act(() => {
        useDashboardStore.setState(prev => ({
          ...prev,
          encounters: [{
            id: 'test-enc-id',
            name: 'Test Encounter',
            location: 'Test Location',
            status: 'active',
            difficultyId: 1,
            difficultyName: 'Easy',
            npcDefinitions: '',
            loggingRequested: true,
          }],
          combatState: {
            ...prev.combatState,
            activeEncounterId: 'test-enc-id',
            combatants: [
              { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10, encounterCombatantId: 'ec-1' }
            ]
          }
        }));
      });

      // 2. Failure case with rollback
      vi.mocked(updateEncounterLoggingRequestedDB).mockRejectedValueOnce(new Error('DB Error'));

      await act(async () => {
        result.current.cancelCombat();
      });

      const encounterAfterFailure = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
      expect(encounterAfterFailure?.loggingRequested).toBe(true);
    });

    it('resetCombat with no activeCombatLog but spreadsheet configured should still set loggingRequested to false, write to DB, and roll back on failure', async () => {
      const originalSheetId = getSpreadsheetId();
      setSpreadsheetId('mock-sheet-id');

      try {
        act(() => {
          useDashboardStore.setState(prev => ({
            ...prev,
            encounters: [{
              id: 'test-enc-id',
              name: 'Test Encounter',
              location: 'Test Location',
              status: 'active',
              difficultyId: 1,
              difficultyName: 'Easy',
              npcDefinitions: '',
              loggingRequested: true,
            }],
            combatState: {
              ...prev.combatState,
              activeEncounterId: 'test-enc-id',
              combatants: [
                { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10, encounterCombatantId: 'ec-1' }
              ]
            },
            activeCombatLog: null
          }));
        });

        // 1. Success path
        vi.mocked(updateEncounterLoggingRequestedDB).mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useCombatSync());

        await act(async () => {
          await result.current.resetCombat();
        });

        const encounterAfterSuccess = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
        expect(encounterAfterSuccess?.loggingRequested).toBe(false);
        expect(updateEncounterLoggingRequestedDB).toHaveBeenCalledWith('test-enc-id', false);

        // Reset state for rollback path
        act(() => {
          useDashboardStore.setState(prev => ({
            ...prev,
            encounters: [{
              id: 'test-enc-id',
              name: 'Test Encounter',
              location: 'Test Location',
              status: 'active',
              difficultyId: 1,
              difficultyName: 'Easy',
              npcDefinitions: '',
              loggingRequested: true,
            }],
            combatState: {
              ...prev.combatState,
              activeEncounterId: 'test-enc-id',
              combatants: [
                { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10, encounterCombatantId: 'ec-1' }
              ]
            },
            activeCombatLog: null
          }));
        });

        // 2. Failure path with rollback
        vi.mocked(updateEncounterLoggingRequestedDB).mockRejectedValueOnce(new Error('DB Error'));

        await act(async () => {
          await result.current.resetCombat();
        });

        const encounterAfterFailure = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
        expect(encounterAfterFailure?.loggingRequested).toBe(true);
      } finally {
        setSpreadsheetId(originalSheetId);
      }
    });

    it('resetCombat and cancelCombat in local mode (no spreadsheet) should set loggingRequested to false locally without calling DB or rolling back', async () => {
      const originalSheetId = getSpreadsheetId();
      setSpreadsheetId('');

      try {
        act(() => {
          useDashboardStore.setState(prev => ({
            ...prev,
            encounters: [{
              id: 'test-enc-id',
              name: 'Test Encounter',
              location: 'Test Location',
              status: 'active',
              difficultyId: 1,
              difficultyName: 'Easy',
              npcDefinitions: '',
              loggingRequested: true,
            }],
            combatState: {
              ...prev.combatState,
              activeEncounterId: 'test-enc-id',
              combatants: [
                { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10, encounterCombatantId: 'ec-1' }
              ]
            },
            activeCombatLog: null
          }));
        });

        vi.mocked(updateEncounterLoggingRequestedDB).mockClear();

        const { result } = renderHook(() => useCombatSync());

        await act(async () => {
          await result.current.resetCombat();
        });

        const encounterAfterReset = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
        expect(encounterAfterReset?.loggingRequested).toBe(false);
        expect(updateEncounterLoggingRequestedDB).not.toHaveBeenCalled();

        // Reset state to true for cancelCombat testing
        act(() => {
          useDashboardStore.setState(prev => ({
            ...prev,
            encounters: prev.encounters.map(e => e.id === 'test-enc-id' ? { ...e, loggingRequested: true } : e)
          }));
        });

        await act(async () => {
          result.current.cancelCombat();
        });

        const encounterAfterCancel = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
        expect(encounterAfterCancel?.loggingRequested).toBe(false);
        expect(updateEncounterLoggingRequestedDB).not.toHaveBeenCalled();
      } finally {
        setSpreadsheetId(originalSheetId);
      }
    });

    it('recordEncounter in local mode (no spreadsheet) should set loggingRequested to true locally without calling DB', async () => {
      const originalSheetId = getSpreadsheetId();
      setSpreadsheetId('');

      try {
        act(() => {
          useDashboardStore.setState(prev => ({
            ...prev,
            encounters: [{
              id: 'test-enc-id',
              name: 'Test Encounter',
              location: 'Test Location',
              status: 'active',
              difficultyId: 1,
              difficultyName: 'Easy',
              npcDefinitions: '',
              loggingRequested: false,
            }],
            combatState: {
              ...prev.combatState,
              activeEncounterId: 'test-enc-id',
              combatants: [
                { id: 'c1', name: 'Char 1', type: 'pc', currentHp: 10, maxHp: 10 }
              ]
            },
            activeCombatLog: null
          }));
        });

        vi.mocked(updateEncounterLoggingRequestedDB).mockClear();

        const { result } = renderHook(() => useCombatSync());

        await act(async () => {
          await result.current.recordEncounter();
        });

        const encounterAfterRecord = useDashboardStore.getState().encounters.find(e => e.id === 'test-enc-id');
        expect(encounterAfterRecord?.loggingRequested).toBe(true);
        expect(updateEncounterLoggingRequestedDB).not.toHaveBeenCalled();
      } finally {
        setSpreadsheetId(originalSheetId);
      }
    });
  });
});
