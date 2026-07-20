import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCombatantExpanded } from '../hooks/useCombatantExpanded';
import { useDashboardStore } from '../../../hooks/dashboardStore';
import { updateCharacterDB } from '../../../services/dbOperations';
import type { Combatant, Character } from '../../../types';

vi.mock('../../../services/dbOperations', () => ({
  updateCharacterDB: vi.fn().mockResolvedValue(undefined),
}));

describe('useCombatantExpanded', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockCombatant: Combatant = {
    id: 'c1',
    characterId: 'char-1',
    type: 'pc',
    name: 'Test PC',
    ac: 15,
    maxHp: 30,
    currentHp: 30,
    tempHp: 0,
    initiative: 10,
    conditions: '',
    passivePerception: 10,
    conditionTimers: {},
  };

  const mockCharacter: Character = {
    id: 'char-1',
    playerName: 'Test Player',
    characterName: 'Test PC',
    ac: 15,
    maxHp: 30,
    tempHp: 0,
    currentHp: 30,
    conditions: '',
    passivePerception: 10,
    level: 3,
    statusId: 1,
    statusName: 'Active',
    notes: '',
    isActive: true,
    class: 'Fighter',
    hitDiceConfig: '1d10',
    hitDiceUsed: '{}',
    resourcePools: JSON.stringify([
      { name: 'Ki Points', current: 3, max: 3, reset: 'short' }
    ]),
    abilityScores: '{}',
    proficiencies: '{}',
    tempHpMax: 0,
    tempAc: 0,
    deathSavesFails: 0,
    deathSavesSuccesses: 0,
  };

  beforeEach(() => {
    act(() => {
      useDashboardStore.setState({
        characters: [mockCharacter],
        activeCombatLog: null,
      });
    });
  });

  it('TEST 2.1 — handleResourcePoolUpdate calls logProgressiveEvent with correct details during active combat', async () => {
    // 1. Set up active combat log in the store
    act(() => {
      useDashboardStore.setState({
        activeCombatLog: {
          encounterId: 'enc-1',
          encounterName: 'Test Encounter',
          location: 'Test Location',
          startedAt: new Date().toISOString(),
          currentRound: 2,
          partySnapshot: [],
          initiativeOrder: [],
          events: [],
        },
      });
    });

    // 2. Spy on logProgressiveEvent
    const logProgressiveEventSpy = vi.spyOn(useDashboardStore.getState(), 'logProgressiveEvent');

    // 3. Render hook
    const { result } = renderHook(() => useCombatantExpanded(mockCombatant));

    // 4. Update the resource pool
    const updatedPools = JSON.stringify([
      { name: 'Ki Points', current: 2, max: 3, reset: 'short' }
    ]);

    await act(async () => {
      await result.current.handleResourcePoolUpdate({ resourcePools: updatedPools });
    });

    // 5. Verify database update was called
    expect(updateCharacterDB).toHaveBeenCalledWith(
      expect.objectContaining({ resourcePools: updatedPools }),
      expect.objectContaining({ id: 'char-1' })
    );

    // 6. Verify logProgressiveEvent was called with correct data
    expect(logProgressiveEventSpy).toHaveBeenCalledWith({
      round: 2,
      type: 'resource-changed',
      actorId: null,
      actorName: null,
      targetId: 'c1',
      targetName: 'Test PC',
      resourceName: 'Ki Points',
      resourceBefore: 3,
      resourceAfter: 2,
      resourceMax: 3,
      isManualAdjustment: true,
    });
  });

  it('TEST 2.2 — handleResourcePoolUpdate does NOT call logProgressiveEvent when there is no active combat log', async () => {
    // 1. Ensure activeCombatLog is null
    act(() => {
      useDashboardStore.setState({ activeCombatLog: null });
    });

    const logProgressiveEventSpy = vi.spyOn(useDashboardStore.getState(), 'logProgressiveEvent');
    const { result } = renderHook(() => useCombatantExpanded(mockCombatant));

    const updatedPools = JSON.stringify([
      { name: 'Ki Points', current: 2, max: 3, reset: 'short' }
    ]);

    await act(async () => {
      await result.current.handleResourcePoolUpdate({ resourcePools: updatedPools });
    });

    expect(updateCharacterDB).toHaveBeenCalled();
    expect(logProgressiveEventSpy).not.toHaveBeenCalled();
  });

  it('TEST 2.3 — handleResourcePoolUpdate does NOT call logProgressiveEvent when update does not touch resourcePools', async () => {
    // 1. Set up active combat log
    act(() => {
      useDashboardStore.setState({
        activeCombatLog: {
          encounterId: 'enc-1',
          encounterName: 'Test Encounter',
          location: 'Test Location',
          startedAt: new Date().toISOString(),
          currentRound: 1,
          partySnapshot: [],
          initiativeOrder: [],
          events: [],
        },
      });
    });

    const logProgressiveEventSpy = vi.spyOn(useDashboardStore.getState(), 'logProgressiveEvent');
    const { result } = renderHook(() => useCombatantExpanded(mockCombatant));

    await act(async () => {
      await result.current.handleResourcePoolUpdate({ maxHp: 35 });
    });

    expect(updateCharacterDB).toHaveBeenCalled();
    expect(logProgressiveEventSpy).not.toHaveBeenCalled();
  });
});
