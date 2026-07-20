// src/services/__tests__/encounterLogs.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sheetsService from '../sheetsService';
import { deleteEncounterLog, appendEncounterLogEventDB, fetchEncounterLogEventsDB } from '../dbOperations';
import { CombatEvent } from '../../lib/combatLog';

vi.mock('../sheetsService', () => ({
  fetchSheetData: vi.fn(),
  updateSheetData: vi.fn(),
  appendSheetData: vi.fn(),
  batchUpdateSpreadsheet: vi.fn(),
  fetchSpreadsheetMetadata: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-spreadsheet-id'),
  resolveActiveSpreadsheetId: vi.fn().mockReturnValue('mock-spreadsheet-id'),
}));

vi.mock('../writeQueue', () => ({
  queueWrite: vi.fn(),
}));

describe('deleteEncounterLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when log not found', async () => {
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [{ properties: { title: 'EncounterLogs', sheetId: 999 } }],
    } as any);
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    
    await expect(deleteEncounterLog('log-nonexistent')).rejects.toThrow('Encounter log log-nonexistent not found');
  });

  it('resolves correct sheetId and deletes the row', async () => {
    // 1. Mock fetchSpreadsheetMetadata to return EncounterLogs with sheetId 999
    // alongside another sheet to prove it picks the correct one
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [
        { properties: { title: 'Characters', sheetId: 101 } },
        { properties: { title: 'EncounterLogs', sheetId: 999 } },
      ],
    } as any);

    // 2. Mock fetchSheetData so the log is found at row index 0 (which translates to startIndex 1)
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [['log-123', 'encounter-abc', 'Goblin Ambush']],
    });

    // 3. Call deleteEncounterLog
    await deleteEncounterLog('log-123');

    // 4. Assert batchUpdateSpreadsheet is called with the exact sheetId 999
    expect(sheetsService.batchUpdateSpreadsheet).toHaveBeenCalled();
    const batchUpdateCall = vi.mocked(sheetsService.batchUpdateSpreadsheet).mock.calls[0];
    const requests = batchUpdateCall[1] as sheetsService.DeleteDimensionRequest[];
    
    expect(requests).toHaveLength(1);
    expect(requests[0].deleteDimension?.range?.sheetId).toBe(999);
    expect(requests[0].deleteDimension?.range?.startIndex).toBe(1);
    expect(requests[0].deleteDimension?.range?.endIndex).toBe(2);
  });
});

describe('appendEncounterLogEventDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps a CombatEvent correctly to a row and calls appendSheetData', async () => {
    const mockEvent: CombatEvent = {
      id: 'evt-1',
      round: 2,
      timestamp: '2023-10-27T10:00:00.000Z',
      type: 'damage',
      actorId: 'char-1',
      actorName: 'Gimli',
      targetId: 'npc-1',
      targetName: 'Goblin',
      isManualAdjustment: true,
      actionType: 'attack',
      value: 12,
      damageType: 'slashing'
    };

    await appendEncounterLogEventDB('enc-1', mockEvent);

    expect(sheetsService.appendSheetData).toHaveBeenCalled();
    const call = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    // arg 0 is resolved id ('mock-spreadsheet-id')
    expect(call[0]).toBe('mock-spreadsheet-id');
    // arg 1 is range (EncounterLogEvents!A:K)
    expect(call[1]).toBe('EncounterLogEvents!A:K');
    // arg 2 is values array
    const row = call[2][0];
    expect(row[0]).toBe('evt-1'); // Event_ID
    expect(row[1]).toBe('enc-1'); // Encounter_ID
    expect(row[2]).toBe(2); // Round
    expect(row[3]).toBe('2023-10-27T10:00:00.000Z'); // Timestamp
    expect(row[4]).toBe('damage'); // Type
    expect(row[5]).toBe('char-1'); // Actor_ID
    expect(row[6]).toBe('Gimli'); // Actor_Name
    expect(row[7]).toBe('npc-1'); // Target_ID
    expect(row[8]).toBe('Goblin'); // Target_Name
    
    // Details (JSON stringified)
    const detailsObj = JSON.parse(row[9] as string);
    expect(detailsObj.actionType).toBe('attack');
    expect(detailsObj.value).toBe(12);
    expect(detailsObj.damageType).toBe('slashing');

    expect(row[10]).toBe('TRUE'); // Is_Manual_Adjustment
  });
});

describe('fetchEncounterLogEventsDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly filters by encounterId and unpacks details JSON', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [
        // Match for enc-1
        [
          'evt-1', 'enc-1', '1', '2023-10-27', 'damage',
          'char-1', 'Gimli', 'npc-1', 'Goblin',
          JSON.stringify({ value: 10, damageType: 'fire' }), 'FALSE'
        ],
        // Non-match
        [
          'evt-2', 'enc-2', '1', '2023-10-27', 'damage',
          'char-1', 'Gimli', 'npc-2', 'Orc',
          JSON.stringify({ value: 5, damageType: 'piercing' }), 'FALSE'
        ],
        // Match for enc-1, manual adjustment, testing resource fields
        [
          'evt-3', 'enc-1', '2', '2023-10-27', 'resource_usage',
          'char-1', 'Gimli', '', '',
          JSON.stringify({ resourceName: 'Action Surge', resourceBefore: 1, resourceAfter: 0 }), 'TRUE'
        ]
      ]
    });

    const events = await fetchEncounterLogEventsDB('enc-1');

    expect(events).toHaveLength(2);

    // Assert first matched event (evt-1)
    const evt1 = events[0];
    expect(evt1.id).toBe('evt-1');
    expect(evt1.round).toBe(1);
    expect(evt1.type).toBe('damage');
    expect(evt1.actorName).toBe('Gimli'); // direct field
    expect(evt1.targetName).toBe('Goblin'); // direct field
    expect(evt1.value).toBe(10); // details-packed field
    expect(evt1.damageType).toBe('fire'); // details-packed field
    expect(evt1.isManualAdjustment).toBe(false);

    // Assert second matched event (evt-3)
    const evt3 = events[1];
    expect(evt3.id).toBe('evt-3');
    expect(evt3.type).toBe('resource_usage');
    expect(evt3.targetId).toBeNull(); // empty string becomes null for actor/target
    expect(evt3.resourceName).toBe('Action Surge'); // details-packed field
    expect(evt3.resourceBefore).toBe(1); // details-packed field
    expect(evt3.isManualAdjustment).toBe(true);
  });
});
