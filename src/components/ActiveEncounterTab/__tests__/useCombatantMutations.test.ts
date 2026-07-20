import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useCombatantMutations, calculateCombatantStateUpdates } from '../hooks/useCombatantMutations';
import { toast } from 'sonner';
import { 
  deleteEncounterCombatantDB, 
  updateCharacterDB
} from '../../../services/dbOperations';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('../../../services/dbOperations', () => ({
  deleteEncounterCombatantDB: vi.fn().mockResolvedValue(true),
  updateCharacterDB: vi.fn().mockResolvedValue(true),
  updateInitiativeDB: vi.fn().mockResolvedValue(true),
  updateConditionTimersDB: vi.fn().mockResolvedValue(true),
  updateNpcInstanceHpDB: vi.fn().mockResolvedValue(true),
  updateNpcInstanceConditionsDB: vi.fn().mockResolvedValue(true),
  updateNpcInstanceAcModDB: vi.fn().mockResolvedValue(true),
  updateNpcInstanceLegendaryDB: vi.fn().mockResolvedValue(true),
  updateNpcInstanceRechargeDB: vi.fn().mockResolvedValue(true),
}));

const mockAppState = {
  combatState: {
    combatants: [] as any[],
    activeTurnId: null as string | null,
    syncingIds: [] as string[],
  },
  encounterCombatants: [] as any[],
  characters: [] as any[],
  npcs: [] as any[],
};

const mockUpdateState = vi.fn((updater) => {
  if (typeof updater === 'function') {
    const nextState = updater(mockAppState);
    if (nextState) {
      if (nextState.combatState) {
        mockAppState.combatState = { ...mockAppState.combatState, ...nextState.combatState };
      }
      if (nextState.characters) {
        mockAppState.characters = nextState.characters;
      }
      if (nextState.encounterCombatants) {
        mockAppState.encounterCombatants = nextState.encounterCombatants;
      }
      if (nextState.npcs) {
        mockAppState.npcs = nextState.npcs;
      }
    }
  }
});

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: () => ({
    updateState: mockUpdateState,
    state: mockAppState,
  }),
  getSnapshot: () => ({
    combatState: {
      combatants: [...mockAppState.combatState.combatants],
      activeTurnId: mockAppState.combatState.activeTurnId,
      syncingIds: [...(mockAppState.combatState.syncingIds || [])],
    },
    encounterCombatants: [...mockAppState.encounterCombatants],
    characters: [...mockAppState.characters],
    npcs: [...mockAppState.npcs],
  }),
}));

vi.mock('../../../hooks/useCombatOverlayEvents', () => ({
  useRageEvent: () => ({ fire: vi.fn() }),
}));

describe('useCombatantMutations', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockAppState.combatState.combatants = [];
    mockAppState.encounterCombatants = [];
    mockAppState.characters = [];
    mockAppState.combatState.activeTurnId = null;
  });

  it('updateCombatant restores only specified slices on failure', async () => {
    const c1 = { id: 'c1', characterId: 'char-1', type: 'pc', name: 'PC', maxHp: 10, currentHp: 10, conditions: '' };
    mockAppState.combatState.combatants = [c1];
    mockAppState.characters = [ { id: 'char-1', name: 'PC', maxHp: 10, currentHp: 10, conditions: '' } ];
    // Set unrelated slice to a distinct value
    mockAppState.npcs = [{ id: 'npc-1' }];
    
    const { result } = renderHook(() => useCombatantMutations());

    let rejectPromise: any;
    const promise = new Promise<void>((_, reject) => { rejectPromise = reject; });
    vi.mocked(updateCharacterDB).mockReturnValue(promise);

    // Trigger update
    const callPromise = result.current.updateCombatant('c1', { currentHp: 5 });
    
    // Simulate concurrent update to unrelated slice
    mockUpdateState(prev => ({ ...prev, npcs: [{ id: 'npc-2' }] }));
    
    // Fail the original update
    rejectPromise(new Error('DB Fail'));
    
    try {
      await callPromise;
    } catch (e) {
      // Expected
    }

    expect(mockUpdateState).toHaveBeenCalled();
    // Verify unrelated slice is preserved (updated concurrently)
    expect(mockAppState.npcs).toEqual([{ id: 'npc-2' }]);
    // Verify characters (related slice) was restored
    expect(mockAppState.characters[0].currentHp).toBe(10);
  });

  it('removeCombatant restores only specified slices on failure', async () => {
    const c1 = { id: 'c1', encounterCombatantId: 'ec-1' };
    mockAppState.combatState.combatants = [c1];
    mockAppState.encounterCombatants = [{ id: 'ec-1', quantity: 1 }];
    // Set unrelated slice to a distinct value
    mockAppState.npcs = [{ id: 'npc-1' }];
    
    const { result } = renderHook(() => useCombatantMutations());

    let rejectPromise: any;
    const promise = new Promise<void>((_, reject) => { rejectPromise = reject; });
    vi.mocked(deleteEncounterCombatantDB).mockReturnValue(promise);

    // Trigger remove
    const callPromise = result.current.removeCombatant('c1');
    
    // Simulate concurrent update to unrelated slice
    mockUpdateState(prev => ({ ...prev, npcs: [{ id: 'npc-2' }] }));
    
    // Fail the original update
    rejectPromise(new Error('DB Fail'));

    try {
      await callPromise;
    } catch (e) {
      // Expected
    }

    expect(mockUpdateState).toHaveBeenCalled();
    // Verify unrelated slice is preserved (updated concurrently)
    expect(mockAppState.npcs).toEqual([{ id: 'npc-2' }]);
    // Verify encounterCombatants (related slice) was restored
    expect(mockAppState.encounterCombatants).toEqual([{ id: 'ec-1', quantity: 1 }]);
  });

  it('updateCombatant on PC with Hasted, Concentrating when setting to Unconscious strips both', async () => {
    vi.mocked(updateCharacterDB).mockResolvedValue(true);
    const c1 = { id: 'c1', characterId: 'char-1', type: 'pc', name: 'PC', maxHp: 10, currentHp: 10, conditions: 'Hasted, Concentrating' };
    mockAppState.combatState.combatants = [c1];
    mockAppState.characters = [ { id: 'char-1', name: 'PC', maxHp: 10, currentHp: 10, conditions: 'Hasted, Concentrating' } ];

    const { result } = renderHook(() => useCombatantMutations());

    await act(async () => {
      await result.current.updateCombatant('c1', { conditions: 'Hasted, Concentrating, Unconscious' });
    });

    // The conditions should now have Unconscious, but Hasted and Concentrating should be stripped
    expect(mockAppState.combatState.combatants[0].conditions).toBe('Unconscious');
  });

  describe('calculateCombatantStateUpdates tempAcModifier delta preservation', () => {
    it('preserves manually-set tempAcModifier when an unrelated condition is added', () => {
      const currentCombatant = {
        id: 'c1',
        type: 'pc' as const,
        name: 'Gimli',
        maxHp: 30,
        currentHp: 25,
        conditions: '',
        tempAcModifier: 3, // manually set via stepper
      };

      const result = calculateCombatantStateUpdates(currentCombatant, {
        conditions: 'poisoned', // unrelated condition with 0 AC modifier
      });

      // The new tempAcModifier should remain 3, meaning no update registered (undefined)
      expect(result.updates.tempAcModifier).toBeUndefined();
    });

    it('correctly applies delta when a condition with AC effects (Hasted) is added on top of manual tempAcModifier, and subtracts it back out when removed', () => {
      const currentCombatant = {
        id: 'c1',
        type: 'pc' as const,
        name: 'Gimli',
        maxHp: 30,
        currentHp: 25,
        conditions: '',
        tempAcModifier: 3, // manually set via stepper
      };

      // Adding Hasted (which has a +2 AC modifier)
      const resultAdd = calculateCombatantStateUpdates(currentCombatant, {
        conditions: 'hasted',
      });

      // Delta should be +2, so new tempAcModifier should be 3 + 2 = 5
      expect(resultAdd.updates.tempAcModifier).toBe(5);

      // Symmetrically, removing Hasted back to empty
      const combatantWithHaste = {
        ...currentCombatant,
        conditions: 'hasted',
        tempAcModifier: 5, // manual 3 + hasted 2
      };

      const resultRemove = calculateCombatantStateUpdates(combatantWithHaste, {
        conditions: '',
      });

      // Delta should be -2, so new tempAcModifier should be 5 - 2 = 3 (the original manual value)
      expect(resultRemove.updates.tempAcModifier).toBe(3);
    });
  });
});
