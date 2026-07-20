// src/services/__tests__/encounters.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sheetsService from '../sheetsService';
import { deleteEncounterFully, updateEncounterLoggingRequestedDB } from '../dbOperations';

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

describe('deleteEncounterFully — cascade delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes encounter, encounter combatants, and associated logs', async () => {
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [
        { properties: { title: 'Encounters', sheetId: 1 } },
        { properties: { title: 'Encounter_Combatants', sheetId: 2 } },
        { properties: { title: 'EncounterLogs', sheetId: 3 } },
      ],
    } as any);

    // Mock findRowIndexById for Encounters
    vi.mocked(sheetsService.fetchSheetData).mockImplementation(async (_, range) => {
      if (range === 'Encounters!A2:Z') {
        return { values: [['enc-1', 'Test', 'Loc', 1, '', 0, '']] };
      }
      if (range === 'Encounter_Combatants!A2:Z') {
        return { values: [['ec-1', 'enc-1', '', '', 1, 0, '', -1, 0, '', 0]] };
      }
      if (range === 'EncounterLogs!A2:J') {
        return { values: [['log-1', 'enc-1', 'Name', 'Loc', 'date', 0, 'Win', '{}', '[]', 'transcript'], ['log-2', 'enc-2', 'Name2', 'Loc2', 'date2', 0, 'Win', '{}', '[]', 'transcript2']] };
      }
      return { values: [] };
    });

    const result = await deleteEncounterFully('enc-1');

    expect(result).toEqual({ success: true, logsCleanupFailed: false });
    expect(sheetsService.batchUpdateSpreadsheet).toHaveBeenCalled();
    const batchUpdateCall = vi.mocked(sheetsService.batchUpdateSpreadsheet).mock.calls[0];
    const requests = batchUpdateCall[1] as sheetsService.DeleteDimensionRequest[];

    // Expect 3 deletes: 1 Encounters, 1 Encounter_Combatants, 1 EncounterLogs (only enc-1)
    expect(requests).toHaveLength(3);
    
    // Validate Encounters row index (startIndex 1)
    expect(requests.some(r => r.deleteDimension?.range?.sheetId === 1 && r.deleteDimension?.range?.startIndex === 1)).toBe(true);
    // Validate Encounter_Combatants row index (startIndex 1)
    expect(requests.some(r => r.deleteDimension?.range?.sheetId === 2 && r.deleteDimension?.range?.startIndex === 1)).toBe(true);
    // Validate EncounterLogs row index (startIndex 1)
    expect(requests.some(r => r.deleteDimension?.range?.sheetId === 3 && r.deleteDimension?.range?.startIndex === 1)).toBe(true);
  });

  it('succeeds encounter deletion even if log cleanup fails', async () => {
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [
        { properties: { title: 'Encounters', sheetId: 1 } },
        { properties: { title: 'Encounter_Combatants', sheetId: 2 } },
        { properties: { title: 'EncounterLogs', sheetId: 3 } },
      ],
    } as any);

    vi.mocked(sheetsService.fetchSheetData).mockImplementation(async (_, range) => {
      if (range === 'Encounters!A2:Z') return { values: [['enc-1', 'Test', 'Loc', 1, '', 0, '']] };
      if (range === 'Encounter_Combatants!A2:Z') return { values: [] };
      if (range === 'EncounterLogs!A2:J') throw new Error('Failed to fetch logs');
      return { values: [] };
    });

    const result = await deleteEncounterFully('enc-1');

    expect(result).toEqual({ success: true, logsCleanupFailed: true });

    // Should still have been called for Encounters and Encounter_Combatants
    expect(sheetsService.batchUpdateSpreadsheet).toHaveBeenCalled();
  });

  it('handles multiple logs for the same encounter and deletes in descending index order without affecting other encounter logs', async () => {
    vi.mocked(sheetsService.fetchSpreadsheetMetadata).mockResolvedValue({
      sheets: [
        { properties: { title: 'Encounters', sheetId: 1 } },
        { properties: { title: 'Encounter_Combatants', sheetId: 2 } },
        { properties: { title: 'EncounterLogs', sheetId: 3 } },
      ],
    } as any);

    vi.mocked(sheetsService.fetchSheetData).mockImplementation(async (_, range) => {
      if (range === 'Encounters!A2:Z') {
        return { values: [['enc-1', 'Test', 'Loc', 1, '', 0, '']] };
      }
      if (range === 'Encounter_Combatants!A2:Z') {
        return { values: [] };
      }
      if (range === 'EncounterLogs!A2:J') {
        return {
          values: [
            ['log-1', 'enc-1', 'Name', 'Loc', 'date', 0, 'Win', '{}', '[]', 'transcript'], // index 1 in Sheet
            ['log-2', 'enc-2', 'Name2', 'Loc2', 'date2', 0, 'Win', '{}', '[]', 'transcript2'], // index 2 in Sheet
            ['log-3', 'enc-1', 'Name3', 'Loc3', 'date3', 0, 'Win', '{}', '[]', 'transcript3'], // index 3 in Sheet
          ],
        };
      }
      return { values: [] };
    });

    const result = await deleteEncounterFully('enc-1');

    expect(result).toEqual({ success: true, logsCleanupFailed: false });

    expect(sheetsService.batchUpdateSpreadsheet).toHaveBeenCalled();
    const batchUpdateCall = vi.mocked(sheetsService.batchUpdateSpreadsheet).mock.calls[0];
    const requests = batchUpdateCall[1] as sheetsService.DeleteDimensionRequest[];

    // Find all EncounterLogs delete requests
    const logDeletes = requests.filter(r => r.deleteDimension?.range?.sheetId === 3);
    expect(logDeletes).toHaveLength(2);

    // Verify they are sorted descending: startIndex 3 (log-3) should be deleted first, then startIndex 1 (log-1)
    expect(logDeletes[0].deleteDimension?.range?.startIndex).toBe(3);
    expect(logDeletes[1].deleteDimension?.range?.startIndex).toBe(1);
  });
});

describe('updateEncounterLoggingRequestedDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly finds the row and writes TRUE/FALSE to the right column', async () => {
    // Mock fetchSheetData so findRowIndexById finds the encounter at row index 1 (A3)
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [
        ['enc-0', 'Test 0'],
        ['enc-1', 'Test 1'] // This is row index 1.
      ]
    });

    await updateEncounterLoggingRequestedDB('enc-1', true);

    expect(sheetsService.updateSheetData).toHaveBeenCalled();
    const call1 = vi.mocked(sheetsService.updateSheetData).mock.calls[0];
    expect(call1[0]).toBe('mock-spreadsheet-id');
    // Row index 1 + 2 = A3. A1 row is 3. Column is H.
    expect(call1[1]).toBe('Encounters!H3:H3');
    expect(call1[2]).toEqual([['TRUE']]);

    // Test false case
    vi.clearAllMocks();
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [
        ['enc-0', 'Test 0'],
        ['enc-1', 'Test 1'] 
      ]
    });

    await updateEncounterLoggingRequestedDB('enc-1', false);
    
    expect(sheetsService.updateSheetData).toHaveBeenCalled();
    const call2 = vi.mocked(sheetsService.updateSheetData).mock.calls[0];
    expect(call2[1]).toBe('Encounters!H3:H3');
    expect(call2[2]).toEqual([['FALSE']]);
  });
});
