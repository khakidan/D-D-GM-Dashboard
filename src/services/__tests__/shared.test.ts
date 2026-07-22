// src/services/__tests__/shared.test.ts

import { describe, it, expect, vi } from 'vitest';
import { SHEET_RANGES } from '../../lib/constants';
import { NpcRowSchema, CharacterRowSchema, CHARACTER_HEADERS, NPC_HEADERS } from '../../lib/sheetSchemas';
import { getColumnLetter } from '../../lib/stringUtils';

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

describe('SHEET_RANGES alignment', () => {
  it("SHEET_RANGES.npcs column range aligns with NPC_HEADERS length and NpcRowSchema", () => {
    const rowLength = NPC_HEADERS.length;
    const row = Array(rowLength).fill('');
    row[0] = '1';
    row[1] = 'A';
    row[2] = '10';
    row[3] = '10';
    row[8] = '0';
    row[9] = '0';
    row[10] = '[]';
    row[11] = '{}';
    row[12] = '{}';
    row[17] = '[]';
    row[18] = '[]';
    row[19] = '[]';
    row[20] = '[]';

    expect(NpcRowSchema.parse(row)).toBeDefined();

    const rangeLetterMatch = SHEET_RANGES.npcs.match(/:([A-Z]+)$/);
    expect(rangeLetterMatch).not.toBeNull();
    expect(rangeLetterMatch![1]).toBe(getColumnLetter(rowLength));
  });

  it("SHEET_RANGES.characters column range aligns with CHARACTER_HEADERS length and CharacterRowSchema", () => {
    const rowLength = CHARACTER_HEADERS.length;
    const row = Array(rowLength).fill('');
    row[0] = 'pc-1';
    row[2] = 'A';
    row[3] = '10';
    row[4] = '10';
    row[5] = '0';
    row[6] = '10';
    row[8] = '10';
    row[9] = '1';
    row[10] = '1';
    row[15] = '0';
    row[16] = '0';
    row[17] = '0';
    row[18] = '0';
    row[21] = '{}';
    row[22] = '[]';
    row[23] = '{}';
    row[24] = '{}';
    row[26] = 'FALSE';
    row[27] = '[]';
    row[28] = '[]';
    row[29] = '[]';

    expect(CharacterRowSchema.parse(row)).toBeDefined();

    const rangeLetterMatch = SHEET_RANGES.characters.match(/:([A-Z]+)$/);
    expect(rangeLetterMatch).not.toBeNull();
    expect(rangeLetterMatch![1]).toBe(getColumnLetter(rowLength));
  });
});
