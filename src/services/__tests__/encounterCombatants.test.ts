// src/services/__tests__/encounterCombatants.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sheetsService from '../sheetsService';
import { addEncounterCombatantDB } from '../dbOperations';

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

describe('addEncounterCombatantDB — concurrent ID-collision safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates distinct IDs when addEncounterCombatantDB is called concurrently (simulating the unawaited PC-add loop)', async () => {
    // Fire multiple independent addEncounterCombatantDB calls concurrently, exactly the way
    // useEncounterLifecycle.ts's PC auto-add loop does (no await between calls).
    // Under the old getNextId-based scheme, this would produce duplicate IDs because all
    // concurrent calls would read the same "max ID" from the mocked sheet before any of them had
    // appended their new row.
    await Promise.all([
      addEncounterCombatantDB('enc-1', 'pc-1', null, 1),
      addEncounterCombatantDB('enc-1', 'pc-2', null, 1),
      addEncounterCombatantDB('enc-1', 'pc-3', null, 1),
    ]);

    // Assert on the actual rows written, not just the returned IDs.
    // This verifies the exact data reaching appendSheetData, at the correct column indexes.
    expect(sheetsService.appendSheetData).toHaveBeenCalledTimes(3);

    const writtenIds = vi.mocked(sheetsService.appendSheetData).mock.calls.map(
      (call: any[]) => call[2][0][0] // Index 0 of rowData represents finalId
    );
    const uniqueIds = new Set(writtenIds);
    expect(uniqueIds.size).toBe(3);

    // Also confirm the correct playerId landed in the correct column (Index 2) for each call.
    const writtenPlayerIds = vi.mocked(sheetsService.appendSheetData).mock.calls.map(
      (call: any[]) => call[2][0][2] // Index 2 of rowData represents playerId
    );
    expect(new Set(writtenPlayerIds)).toEqual(new Set(['pc-1', 'pc-2', 'pc-3']));
  });
});
