import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, CombatState } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { appendEncounterLogEventDB } from '../services/dbOperations';
import {
  ActiveCombatLog,
  CombatEvent,
  PartySnapshot,
  InitiativeEntry,
  generateCombatEventId,
  ActionType,
} from '../lib/combatLog';

// The initial empty state — identical to what 
// useAppState currently returns on first load
const initialCombatState = {
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
} as CombatState & { 
  combatStarted: boolean; 
  actionContext: { sourceOverride: string | null; actionType: ActionType } 
};

const initialState: Omit<AppState, 'combatState'> & { 
  activeCombatLog: ActiveCombatLog | null, 
  combatState: CombatState & { 
    combatStarted: boolean;
    actionContext: { sourceOverride: string | null; actionType: ActionType };
  } 
} = {
  characters: [],
  npcs: [],
  encounters: [],
  encounterCombatants: [],
  conditions: [],
  spells: [],
  statuses: {},
  difficulties: {},
  campaignName: '',
  hasInitialSynced: false,
  openDialog: null,
  combatState: initialCombatState,
  activeCombatLog: null,
};

// The Zustand store type extends AppState with 
// the two methods that useAppState currently 
// exposes — this allows the wrapper to delegate 
// directly to the store
export interface DashboardStore extends Omit<AppState, 'combatState'> {
  activeCombatLog: ActiveCombatLog | null;
  combatState: CombatState & { 
    combatStarted: boolean;
    actionContext: { sourceOverride: string | null; actionType: ActionType };
  };
  setCombatStarted: (value: boolean) => void;
  setActionContext: (sourceOverride: string | null, actionType: ActionType) => void;
  updateState: (
    updater: 
      | ((prev: AppState) => AppState) 
      | Partial<AppState>
  ) => void;
  getSnapshot: () => AppState;
  initCombatLog: (
    encounterId: string,
    encounterName: string,
    location: string,
    partySnapshot: PartySnapshot[],
    initiativeOrder: InitiativeEntry[],
    startingRound: number
  ) => void;
  addCombatEvent: (event: Omit<CombatEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => void;
  logProgressiveEvent: (event: Omit<CombatEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => Promise<void>;
  advanceCombatLogRound: () => void;
  clearCombatLog: () => void;
}

export const useDashboardStore = 
  create<DashboardStore>()(
    persist(
      (set, get) => ({
        ...initialState,

        setCombatStarted: (value: boolean) => {
          set((state) => ({
            combatState: {
              ...state.combatState,
              combatStarted: value,
            }
          }));
        },

        setActionContext: (sourceOverride: string | null, actionType: ActionType) => {
          set((state) => ({
            combatState: {
              ...state.combatState,
              actionContext: {
                sourceOverride,
                actionType,
              }
            }
          }));
        },

        updateState: (updater) => {
          if (typeof updater === 'function') {
            set((state) => updater(state as unknown as AppState) as unknown as Partial<DashboardStore>);
          } else {
            set(updater as unknown as Partial<DashboardStore>);
          }
        },

        getSnapshot: () => {
          // Return only the AppState fields, 
          // not the store methods
          const state = get();
          return {
            characters: state.characters,
            npcs: state.npcs,
            encounters: state.encounters,
            encounterCombatants: state.encounterCombatants,
            conditions: state.conditions,
            spells: state.spells,
            statuses: state.statuses,
            difficulties: state.difficulties,
            campaignName: state.campaignName,
            hasInitialSynced: state.hasInitialSynced,
            openDialog: state.openDialog,
            combatState: state.combatState,
          };
        },

        initCombatLog: (encounterId, encounterName, location, partySnapshot, initiativeOrder, startingRound) => {
          set(() => ({
            activeCombatLog: {
              encounterId,
              encounterName,
              location,
              startedAt: new Date().toISOString(),
              currentRound: startingRound,
              partySnapshot,
              initiativeOrder,
              events: [],
            },
          }));
        },

        addCombatEvent: (event) => {
          set((state) => {
            if (!state.activeCombatLog) return {};
            const newEvent: CombatEvent = {
              ...event,
              id: event.id || generateCombatEventId(),
              timestamp: event.timestamp || new Date().toISOString(),
            };
            return {
              activeCombatLog: {
                ...state.activeCombatLog,
                events: [...state.activeCombatLog.events, newEvent],
              },
            };
          });
        },

        logProgressiveEvent: async (event) => {
          const state = get();
          const { activeCombatLog, encounters } = state;
          
          if (!activeCombatLog) return;
          
          const newEvent: CombatEvent = {
            ...event,
            id: event.id || generateCombatEventId(),
            timestamp: event.timestamp || new Date().toISOString(),
          };
          
          // Commit locally
          get().addCombatEvent(newEvent);
          
          // Check if logging is requested
          const activeEncounter = encounters.find(e => e.id === activeCombatLog.encounterId);
          if (activeEncounter && activeEncounter.loggingRequested) {
            try {
              await appendEncounterLogEventDB(activeCombatLog.encounterId, newEvent);
            } catch (error) {
              console.error('[Store] Failed to append combat event to EncounterLogEvents', error);
            }
          }
        },

        advanceCombatLogRound: () => {
          set((state) => {
            if (!state.activeCombatLog) return {};
            return {
              activeCombatLog: {
                ...state.activeCombatLog,
                currentRound: state.activeCombatLog.currentRound + 1,
              },
            };
          });
        },

        clearCombatLog: () => {
          set(() => ({
            activeCombatLog: null,
          }));
        },
      }),

      {
        name: STORAGE_KEYS.appState,
        storage: createJSONStorage(() => localStorage),

        // Only these fields are persisted to 
        // localStorage between sessions.
        // This matches the existing persistence 
        // rules from the SSOT refactor.
        partialize: (state): any => ({
          campaignName: state.campaignName,
          // hasInitialSynced always stored as 
          // false so every fresh load waits for 
          // sheet sync
          hasInitialSynced: false,
          // combatState IS persisted for cross-tab 
          // sync (PlayerView needs it).
          // We now include overlay events so they sync across tabs,
          // but we will clear them on rehydration to avoid "stale" replays.
          combatState: {
            ...state.combatState,
            // These are now included for live sync
            deathEvent: state.combatState.deathEvent,
            damageEvent: state.combatState.damageEvent,
            healEvent: state.combatState.healEvent,
            rageEvent: state.combatState.rageEvent,
            unconsciousEvent: state.combatState.unconsciousEvent,
            initiativeEvent: state.combatState.initiativeEvent,
            // These stay omitted from long-term persistence 
            // but the storage listener will handle them
            syncingIds: [],
            selectedIds: [],
            isSelectionMode: false,
            expandedIds: [],
          },
          activeCombatLog: state.activeCombatLog,
        }),

        // Clear transient state on rehydration so we don't 
        // replay old overlays on page refresh
        onRehydrateStorage: (state) => {
          return (rehydratedState) => {
            if (rehydratedState) {
              rehydratedState.updateState(prev => ({
                ...prev,
                combatState: {
                  ...prev.combatState,
                  deathEvent: null,
                  damageEvent: null,
                  healEvent: null,
                  rageEvent: null,
                  unconsciousEvent: null,
                  initiativeEvent: false,
                  syncingIds: [],
                  selectedIds: [],
                  isSelectionMode: false,
                }
              }));
            }
          };
        },
      }
    )
  );

// Cross-tab sync — when another tab writes 
// combatState to localStorage (e.g. GM dashboard 
// starts an encounter), this tab receives the 
// storage event and updates its local store.
// This is how PlayerView sees the active encounter.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (
      event.key === STORAGE_KEYS.appState && 
      event.newValue
    ) {
      try {
        const parsed = JSON.parse(event.newValue);
        const incoming = parsed?.state;
        if (!incoming) return;

        const current = useDashboardStore.getState();

        if (incoming.combatState) {
          // Merge incoming global state with current local state.
          // We specifically PRESERVE fields that are tab-local 
          // to prevent ping-pong reverts.
          const nextCombatState = {
            ...current.combatState,
            ...incoming.combatState,
            // Re-apply local fields from CURRENT state
            syncingIds: current.combatState.syncingIds,
            selectedIds: current.combatState.selectedIds,
            isSelectionMode: current.combatState.isSelectionMode,
            expandedIds: current.combatState.expandedIds,
          };

          // Only update if there's a meaningful change in the global parts.
          // This avoids the infinite write-back loop between tabs.
          const currentGlobal = JSON.stringify({
            activeEncounterId: current.combatState.activeEncounterId,
            activeTurnId: current.combatState.activeTurnId,
            round: current.combatState.round,
            combatants: current.combatState.combatants,
            concentrationLinks: current.combatState.concentrationLinks,
            combatStarted: current.combatState.combatStarted,
            actionContext: current.combatState.actionContext,
            deathEvent: current.combatState.deathEvent,
            damageEvent: current.combatState.damageEvent,
            healEvent: current.combatState.healEvent,
            rageEvent: current.combatState.rageEvent,
            unconsciousEvent: current.combatState.unconsciousEvent,
            initiativeEvent: current.combatState.initiativeEvent,
          });

          const incomingGlobal = JSON.stringify({
            activeEncounterId: incoming.combatState.activeEncounterId,
            activeTurnId: incoming.combatState.activeTurnId,
            round: incoming.combatState.round,
            combatants: incoming.combatState.combatants,
            concentrationLinks: incoming.combatState.concentrationLinks,
            combatStarted: incoming.combatState.combatStarted,
            actionContext: incoming.combatState.actionContext,
            deathEvent: incoming.combatState.deathEvent,
            damageEvent: incoming.combatState.damageEvent,
            healEvent: incoming.combatState.healEvent,
            rageEvent: incoming.combatState.rageEvent,
            unconsciousEvent: incoming.combatState.unconsciousEvent,
            initiativeEvent: incoming.combatState.initiativeEvent,
          });

          if (currentGlobal !== incomingGlobal) {
            useDashboardStore.setState({ combatState: nextCombatState });
          }
        }

        if (incoming.campaignName !== undefined && incoming.campaignName !== current.campaignName) {
          useDashboardStore.setState({ campaignName: incoming.campaignName });
        }

        if (incoming.activeCombatLog !== undefined) {
          const currentLogStr = JSON.stringify(current.activeCombatLog);
          const incomingLogStr = JSON.stringify(incoming.activeCombatLog);
          if (currentLogStr !== incomingLogStr) {
            useDashboardStore.setState({ activeCombatLog: incoming.activeCombatLog });
          }
        }
      } catch (error) {
        console.error('[Cross-tab sync error]', error);
      }
    }
  });
}
