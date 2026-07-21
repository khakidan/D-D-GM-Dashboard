import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCombatantCard } from '../hooks/useCombatantCard';
import { useDashboardStore } from '../../../hooks/useAppState';

describe('useCombatantCard Hook', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    act(() => {
      useDashboardStore.setState({
        combatState: {
          activeEncounterId: null,
          activeTurnId: null,
          round: 1,
          combatants: [],
          concentrationLinks: {},
          selectedIds: [],
          isSelectionMode: false,
          syncingIds: [],
          expandedIds: [],
          combatStarted: false,
          actionContext: { sourceOverride: null, actionType: 'attack' },
        },
      });
    });
  });

  it('expanding a card adds its id to expandedIds in the store', () => {
    const { result } = renderHook(() => useCombatantCard('c1'));

    expect(result.current.isExpanded).toBe(false);

    act(() => {
      result.current.toggleExpand();
    });

    expect(result.current.isExpanded).toBe(true);
    expect(useDashboardStore.getState().combatState.expandedIds).toContain('c1');
  });

  it('collapsing a card removes its id from expandedIds', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          expandedIds: ['c1']
        }
      }));
    });

    const { result } = renderHook(() => useCombatantCard('c1'));

    expect(result.current.isExpanded).toBe(true);

    act(() => {
      result.current.toggleExpand();
    });

    expect(result.current.isExpanded).toBe(false);
    expect(useDashboardStore.getState().combatState.expandedIds).not.toContain('c1');
  });

  it('toggling selection adds/removes id from selectedIds', () => {
    const { result } = renderHook(() => useCombatantCard('c1'));

    expect(result.current.isSelected).toBe(false);

    act(() => {
      result.current.toggleSelection();
    });

    expect(result.current.isSelected).toBe(true);
    expect(useDashboardStore.getState().combatState.selectedIds).toContain('c1');

    act(() => {
      result.current.toggleSelection();
    });

    expect(result.current.isSelected).toBe(false);
    expect(useDashboardStore.getState().combatState.selectedIds).not.toContain('c1');
  });

  it('does not recompute when an unrelated combatant changes and this combatant\'s own derived status stays the same', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c2',
          combatants: [
            { id: 'c1', name: 'PC 1', type: 'pc', currentHp: 10, maxHp: 10, ac: 15, initiative: 10, passivePerception: 10 },
            { id: 'c2', name: 'NPC 1', type: 'npc', currentHp: 10, maxHp: 10, ac: 15, initiative: 5, passivePerception: 10 },
          ],
        },
      }));
    });

    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useCombatantCard('c1');
    });

    const rendersAfterMount = renderCount;
    expect(result.current.isActiveTurn).toBe(false); // c2 is the active turn, not c1

    // Change c2's HP — a real, unrelated combatant update that changes the combatants
    // array reference (the same way updateCombatant does in real usage), but doesn't
    // change anything about c1's own isActiveTurn/isSelected/isSyncing/isExpanded/
    // concentrationLinks status.
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState.combatants.map(c =>
            c.id === 'c2' ? { ...c, currentHp: 5 } : c
          ),
        },
      }));
    });

    // Before the narrow-selector fix, this hook subscribed to the whole app state via
    // useAppState(), so any combatant update — even to a totally different combatant —
    // would cause this hook to recompute. With the fix, it should not.
    expect(renderCount).toBe(rendersAfterMount);
    expect(result.current.isActiveTurn).toBe(false);
  });
});
