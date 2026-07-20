import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../dashboardStore';
import { appendEncounterLogEventDB } from '../../services/dbOperations';

vi.mock('../../services/dbOperations', () => ({
  appendEncounterLogEventDB: vi.fn().mockResolvedValue(undefined),
}));

describe('combatLogSlice', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      characters: [],
      npcs: [],
      encounters: [],
      encounterCombatants: [],
      statuses: {},
      difficulties: {},
      campaignName: '',
      hasInitialSynced: false,
      openDialog: null,
      activeCombatLog: null,
      combatState: {
        activeEncounterId: null,
        activeTurnId: null,
        round: 1,
        combatants: [],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
        combatStarted: false,
        actionContext: {
          sourceOverride: null,
          actionType: 'attack'
        },
      },
    });
  });

  it('TEST 2.1 — initCombatLog sets correct initial state', () => {
    useDashboardStore.getState().initCombatLog(
      'enc-1',
      'Goblin Ambush',
      'Forest',
      [{ id: 'pc-1', name: 'Aria', type: 'pc', startingHp: 30, maxHp: 30 }],
      [{ combatantId: 'pc-1', name: 'Aria', initiative: 15, type: 'pc' }],
      1
    );

    const log = useDashboardStore.getState().activeCombatLog;
    expect(log).not.toBeNull();
    expect(log?.encounterId).toBe('enc-1');
    expect(log?.currentRound).toBe(1);
    expect(log?.events).toEqual([]);
    expect(log?.partySnapshot).toHaveLength(1);
    expect(log?.initiativeOrder).toHaveLength(1);
  });

  it('TEST 2.2 — addCombatEvent appends with generated id and timestamp', () => {
    useDashboardStore.getState().initCombatLog(
      'enc-1', 'Test', 'Test', [], [], 1
    );

    useDashboardStore.getState().addCombatEvent({
      round: 1,
      type: 'damage',
      actorId: 'pc-1',
      actorName: 'Aria',
      targetId: 'npc-1',
      targetName: 'Goblin',
      value: 5,
      isManualAdjustment: false,
    });

    const log = useDashboardStore.getState().activeCombatLog;
    expect(log?.events).toHaveLength(1);
    const event = log?.events[0];
    expect(event?.id).toMatch(/^evt_/);
    expect(event?.timestamp).toEqual(
      expect.any(String)
    );
    expect(event?.type).toBe('damage');
  });

  it('TEST 2.2b — addCombatEvent preserves provided id and timestamp', () => {
    useDashboardStore.getState().initCombatLog(
      'enc-1', 'Test', 'Test', [], [], 1
    );

    useDashboardStore.getState().addCombatEvent({
      id: 'pre-generated-id',
      timestamp: '2023-01-01T00:00:00.000Z',
      round: 1,
      type: 'damage',
      actorId: 'pc-1',
      actorName: 'Aria',
      targetId: 'npc-1',
      targetName: 'Goblin',
      value: 5,
      isManualAdjustment: false,
    });

    const log = useDashboardStore.getState().activeCombatLog;
    expect(log?.events).toHaveLength(1);
    const event = log?.events[0];
    expect(event?.id).toBe('pre-generated-id');
    expect(event?.timestamp).toBe('2023-01-01T00:00:00.000Z');
  });

  it('TEST 2.3 — addCombatEvent is a no-op when activeCombatLog is null', () => {
    useDashboardStore.getState().addCombatEvent({
      round: 1,
      type: 'damage',
      actorId: 'pc-1',
      actorName: 'Aria',
      targetId: 'npc-1',
      targetName: 'Goblin',
      value: 5,
      isManualAdjustment: false,
    });

    expect(useDashboardStore.getState().activeCombatLog).toBeNull();
  });

  it('TEST 2.4 — advanceCombatLogRound increments currentRound', () => {
    useDashboardStore.getState().initCombatLog(
      'enc-1', 'Test', 'Test', [], [], 1
    );
    expect(useDashboardStore.getState().activeCombatLog?.currentRound).toBe(1);

    useDashboardStore.getState().advanceCombatLogRound();
    useDashboardStore.getState().advanceCombatLogRound();

    expect(useDashboardStore.getState().activeCombatLog?.currentRound).toBe(3);
  });

  it('TEST 2.5 — clearCombatLog resets to null', () => {
    useDashboardStore.getState().initCombatLog(
      'enc-1', 'Test', 'Test', [], [], 1
    );
    expect(useDashboardStore.getState().activeCombatLog).not.toBeNull();

    useDashboardStore.getState().clearCombatLog();
    expect(useDashboardStore.getState().activeCombatLog).toBeNull();
  });

  it('TEST 2.6 — setActionContext updates actionContext correctly', () => {
    useDashboardStore.getState().setActionContext('some-id', 'opportunity-attack');

    const context = useDashboardStore.getState().combatState.actionContext;
    expect(context.sourceOverride).toBe('some-id');
    expect(context.actionType).toBe('opportunity-attack');
  });

  it('TEST 2.7 — setCombatStarted toggles the flag', () => {
    expect(useDashboardStore.getState().combatState.combatStarted).toBe(false);

    useDashboardStore.getState().setCombatStarted(true);
    expect(useDashboardStore.getState().combatState.combatStarted).toBe(true);

    useDashboardStore.getState().setCombatStarted(false);
    expect(useDashboardStore.getState().combatState.combatStarted).toBe(false);
  });

  it('TEST 2.8 — logProgressiveEvent commits locally and fires network write if loggingRequested is true', async () => {
    vi.clearAllMocks();
    useDashboardStore.setState((state) => ({
      ...state,
      encounters: [{
        id: 'enc-1',
        name: 'Test',
        location: 'Test',
        difficultyId: 1,
        difficultyName: 'Easy',
        npcDefinitions: '',
        status: 'active',
        loggingRequested: true
      }]
    }));
    useDashboardStore.getState().initCombatLog(
      'enc-1', 'Test', 'Test', [], [], 1
    );

    await useDashboardStore.getState().logProgressiveEvent({
      round: 1,
      type: 'damage',
      actorId: 'pc-1',
      actorName: 'Aria',
      targetId: 'npc-1',
      targetName: 'Goblin',
      value: 5,
      isManualAdjustment: false,
    });

    const log = useDashboardStore.getState().activeCombatLog;
    expect(log?.events).toHaveLength(1);
    const event = log?.events[0];
    
    // Should have called the DB service
    expect(appendEncounterLogEventDB).toHaveBeenCalledWith('enc-1', event);
  });

  it('TEST 2.9 — logProgressiveEvent commits locally but does NOT fire network write if loggingRequested is false', async () => {
    vi.clearAllMocks();
    useDashboardStore.setState((state) => ({
      ...state,
      encounters: [{
        id: 'enc-1',
        name: 'Test',
        location: 'Test',
        difficultyId: 1,
        difficultyName: 'Easy',
        npcDefinitions: '',
        status: 'active',
        loggingRequested: false
      }]
    }));
    useDashboardStore.getState().initCombatLog(
      'enc-1', 'Test', 'Test', [], [], 1
    );

    await useDashboardStore.getState().logProgressiveEvent({
      round: 1,
      type: 'damage',
      actorId: 'pc-1',
      actorName: 'Aria',
      targetId: 'npc-1',
      targetName: 'Goblin',
      value: 5,
      isManualAdjustment: false,
    });

    const log = useDashboardStore.getState().activeCombatLog;
    expect(log?.events).toHaveLength(1);
    
    // Should NOT have called the DB service
    expect(appendEncounterLogEventDB).not.toHaveBeenCalled();
  });
});
