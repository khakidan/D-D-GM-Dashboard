import { useShallow } from 'zustand/react/shallow';
import { useDashboardStore } from '../../../hooks/dashboardStore';

// Stable, shared reference so combatants with no concentration links (the common case)
// don't get a brand-new empty array every selector call, which would defeat useShallow's
// per-property comparison below and cause unnecessary re-renders.
const EMPTY_CONCENTRATION_LINKS: string[] = [];

export function useCombatantCard(combatantId: string) {
  // Narrow, per-combatant selector — this component only re-renders when one of these
  // specific derived values actually changes for THIS combatantId, not whenever any
  // other combatant's unrelated data (e.g. HP) changes. Previously this hook called
  // useAppState(), which subscribes to the entire app state via a shallow comparison
  // of top-level fields — since combatState is one of those fields, any combatant's
  // update produced a new combatState reference and re-rendered every single
  // CombatantCard, regardless of whether that card's own status actually changed.
  const { isActiveTurn, isSelected, isSelectable, isSyncing, isExpanded, concentrationLinks } = useDashboardStore(
    useShallow((s) => ({
      isActiveTurn: s.combatState?.activeTurnId === combatantId,
      isSelected: (s.combatState?.selectedIds || []).includes(combatantId),
      isSelectable: !!s.combatState?.isSelectionMode,
      isSyncing: (s.combatState?.syncingIds || []).includes(combatantId),
      isExpanded: (s.combatState?.expandedIds || []).includes(combatantId),
      concentrationLinks: (s.combatState?.concentrationLinks || {})[combatantId] || EMPTY_CONCENTRATION_LINKS,
    }))
  );

  // updateState is a stable store action (defined once at store creation, never
  // reassigned) — selecting it directly like this, rather than via useAppState(),
  // avoids subscribing to the whole app state just to get a function reference.
  const updateState = useDashboardStore((s) => s.updateState);

  const toggleExpand = () => {
    updateState(prev => {
      const expanded = new Set(prev.combatState.expandedIds || []);
      if (expanded.has(combatantId)) {
        expanded.delete(combatantId);
      } else {
        expanded.add(combatantId);
      }
      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          expandedIds: Array.from(expanded),
        }
      };
    });
  };

  const toggleSelection = () => {
    updateState(prev => {
      const selected = new Set(prev.combatState.selectedIds || []);
      if (selected.has(combatantId)) {
        selected.delete(combatantId);
      } else {
        selected.add(combatantId);
      }
      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          selectedIds: Array.from(selected),
        }
      };
    });
  };

  return {
    isActiveTurn,
    isSelected,
    isSelectable,
    isSyncing,
    isExpanded,
    concentrationLinks,
    toggleExpand,
    toggleSelection,
  };
}