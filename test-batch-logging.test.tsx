import { renderHook } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import React from 'react';

vi.mock('./src/services/sheetsService', () => ({
  getSpreadsheetId: () => 'test-sheet-id'
}));
vi.mock('./src/services/dbOperations', () => ({
  updateInitiativeDB: async () => {},
  appendEncounterLog: async (id, log) => {},
  updateEncounterStateDB: async () => {},
  updateEncounterCombatantQuantityDB: async () => {},
  deleteEncounterCombatantDB: async () => {}
}));

describe('Batch action logging', () => {
  it('should log individual events per target for batch actions', async () => {
    const { useDashboardStore } = await import('./src/hooks/dashboardStore');
    
    useDashboardStore.setState({
      activeCombatLog: {
        encounterId: 'e1',
        encounterName: 'Test Encounter',
        location: 'Location',
        startedAt: new Date().toISOString(),
        currentRound: 3,
        partySnapshot: [
          { id: 'npc1', name: 'Goblin 1', type: 'npc', startingHp: 10, currentHp: 10 },
          { id: 'npc2', name: 'Goblin 2', type: 'npc', startingHp: 12, currentHp: 12 }
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
          { id: 'npc1', name: 'Goblin 1', type: 'npc', currentHp: 10, maxHp: 10, initiative: 5 },
          { id: 'npc2', name: 'Goblin 2', type: 'npc', currentHp: 12, maxHp: 12, initiative: 4 }
        ]
      }
    });

    const { useBatchActions } = await import('./src/components/ActiveEncounterTab/hooks/useBatchActions');
    
    let resultBatchActions: any;
    
    function TestWrapper() {
      resultBatchActions = useBatchActions({
        selectedIds: new Set(['npc1', 'npc2']),
        combatants: useDashboardStore.getState().combatState.combatants,
        onSuccess: () => {}
      });
      return null;
    }
    
    const { render } = await import('@testing-library/react');
    render(<TestWrapper />);

    // Apply batch damage
    await resultBatchActions.handleApplyMultiDamage(10, 'fire');

    const log = useDashboardStore.getState().activeCombatLog;
    console.log("EVENTS:", JSON.stringify(log.events, null, 2));

    expect(log.events.length).toBeGreaterThanOrEqual(2);
    
    const damageEvents = log.events.filter(e => e.type === 'damage');
    expect(damageEvents.length).toBe(2);
    
    expect(damageEvents[0].targetId).toBe('npc1');
    expect(damageEvents[0].value).toBe(10);
    expect(damageEvents[0].hpBefore).toBe(10);
    expect(damageEvents[0].hpAfter).toBe(0);
    expect(damageEvents[0].damageType).toBe('fire');
    
    expect(damageEvents[1].targetId).toBe('npc2');
    expect(damageEvents[1].value).toBe(10);
    expect(damageEvents[1].hpBefore).toBe(12);
    expect(damageEvents[1].hpAfter).toBe(2);
    expect(damageEvents[1].damageType).toBe('fire');
  });
});
