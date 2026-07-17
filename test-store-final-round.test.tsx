import { renderHook } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import React from 'react';

vi.mock('./src/services/sheetsService', () => ({
  getSpreadsheetId: () => 'test-sheet-id'
}));
vi.mock('./src/services/dbOperations', () => ({
  updateInitiativeDB: async () => {},
  appendEncounterLog: async (id, log) => {
    console.log("APPENDED LOG TO DB:\n" + log.transcript);
  },
  updateEncounterStateDB: async () => {},
}));

describe('Final round logging', () => {
  it('should log single target actions in the final round', async () => {
    const { useDashboardStore } = await import('./src/hooks/dashboardStore');
    
    useDashboardStore.setState({
      activeCombatLog: {
        encounterId: 'e1',
        encounterName: 'Test Encounter',
        location: 'Location',
        startedAt: new Date().toISOString(),
        currentRound: 3,
        partySnapshot: [
          { id: 'npc1', name: 'Goblin', type: 'npc', startingHp: 10, currentHp: 10 }
        ],
        initiativeOrder: [],
        events: []
      },
      combatState: {
        combatStarted: true,
        round: 3,
        activeTurnId: 'pc1',
        actionContext: { sourceOverride: null, actionType: 'attack' },
        combatants: [
          { id: 'pc1', name: 'Hero', type: 'pc', currentHp: 10, maxHp: 10, initiative: 10 },
          { id: 'npc1', name: 'Goblin', type: 'npc', currentHp: 10, maxHp: 10, initiative: 5 }
        ]
      }
    });

    const { useHealthChange } = await import('./src/components/ActiveEncounterTab/hooks/useHealthChange');
    const { useCombatLifecycle } = await import('./src/components/ActiveEncounterTab/hooks/useCombatLifecycle');
    
    let resultHealthChange: any;
    let resultLifecycle: any;
    
    function TestWrapper() {
      resultHealthChange = useHealthChange(new Set(), async () => {});
      resultLifecycle = useCombatLifecycle();
      return null;
    }
    
    const { render } = await import('@testing-library/react');
    render(<TestWrapper />);

    // Apply damage
    await resultHealthChange.handleHealthChange(
      'npc1',
      useDashboardStore.getState().combatState.combatants[1],
      true, // isDamage
      'slashing',
      10, // amount
      false, // isCritical
      false // skipOverlay
    );

    // End combat
    resultLifecycle.resetCombat();
  });
});
