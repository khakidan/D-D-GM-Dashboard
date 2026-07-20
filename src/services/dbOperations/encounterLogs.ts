// src/services/dbOperations/encounterLogs.ts

import { BatchRequest } from '../sheetsService';
import { ENCOUNTER_LOG_HEADERS, ENCOUNTER_LOG_EVENT_HEADERS } from '../../lib/sheetSchemas';
import { CombatEvent, CombatEventType } from '../../lib/combatLog';
import {
  resolveSpreadsheetId,
  appendSheetData,
  fetchSheetData,
  getSheetIds,
  findRowIndexById,
  batchUpdateSpreadsheet,
} from './shared';

export async function appendEncounterLog(
  log: {
    id: string;
    encounterId: string;
    encounterName: string;
    location: string;
    date: string;
    durationRounds: number;
    outcome: string;
    partySnapshot: string;
    events: string;
    transcript: string;
  }
): Promise<void>;
export async function appendEncounterLog(
  spreadsheetId: string | undefined,
  log: {
    id: string;
    encounterId: string;
    encounterName: string;
    location: string;
    date: string;
    durationRounds: number;
    outcome: string;
    partySnapshot: string;
    events: string;
    transcript: string;
  }
): Promise<void>;
export async function appendEncounterLog(
  arg1: any,
  arg2?: any
): Promise<void> {
  let spreadsheetId: string | undefined;
  let log: {
    id: string;
    encounterId: string;
    encounterName: string;
    location: string;
    date: string;
    durationRounds: number;
    outcome: string;
    partySnapshot: string;
    events: string;
    transcript: string;
  };
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    log = arg1;
  } else {
    spreadsheetId = arg1;
    log = arg2;
  }
  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowData = [
      log.id,
      log.encounterId,
      log.encounterName,
      log.location,
      log.date,
      log.durationRounds,
      log.outcome,
      log.partySnapshot,
      log.events,
      log.transcript
    ];
    await appendSheetData(resolvedId, `EncounterLogs!A:${String.fromCharCode(64 + ENCOUNTER_LOG_HEADERS.length)}`, [rowData]);
  } catch (err) {
    console.error('[DB] appendEncounterLog failed:', err);
    throw err;
  }
}

export async function readEncounterLogs(spreadsheetId?: string): Promise<any[][]> {
  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const data = await fetchSheetData(resolvedId, `EncounterLogs!A2:${String.fromCharCode(64 + ENCOUNTER_LOG_HEADERS.length)}`);
    return data.values || [];
  } catch (err) {
    console.error('[DB] readEncounterLogs failed:', err);
    throw err;
  }
}

export async function deleteEncounterLog(logId: string): Promise<void>;
export async function deleteEncounterLog(spreadsheetId: string | undefined, logId: string): Promise<void>;
export async function deleteEncounterLog(
  arg1: any,
  arg2?: any
): Promise<void> {
  let spreadsheetId: string | undefined;
  let logId: string;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    logId = arg1;
  } else {
    spreadsheetId = arg1;
    logId = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const ids = await getSheetIds(resolvedId);
    const rowIdx = await findRowIndexById(resolvedId, 'EncounterLogs', logId);
    if (rowIdx === null) {
      throw new Error(`Encounter log ${logId} not found`);
    }

    const requests: BatchRequest[] = [
      {
        deleteDimension: {
          range: {
            sheetId: ids['EncounterLogs'],
            dimension: 'ROWS' as const,
            startIndex: rowIdx,
            endIndex: rowIdx + 1,
          },
        },
      },
    ];

    await batchUpdateSpreadsheet(resolvedId, requests);
  } catch (err) {
    console.error('[DB] deleteEncounterLog failed:', err);
    throw err;
  }
}

export async function appendEncounterLogEventDB(
  spreadsheetId: string | undefined,
  encounterId: string,
  event: CombatEvent
): Promise<void>;
export async function appendEncounterLogEventDB(
  encounterId: string,
  event: CombatEvent
): Promise<void>;
export async function appendEncounterLogEventDB(
  arg1: any,
  arg2: any,
  arg3?: any
): Promise<void> {
  let spreadsheetId: string | undefined;
  let encounterId: string;
  let event: CombatEvent;
  
  if (arg3 === undefined) {
    spreadsheetId = undefined;
    encounterId = arg1;
    event = arg2;
  } else {
    spreadsheetId = arg1;
    encounterId = arg2;
    event = arg3;
  }
  
  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    
    // Group all the optional detail fields into a JSON string
    const detailsObj = {
      actionType: event.actionType,
      value: event.value,
      damageType: event.damageType,
      condition: event.condition,
      hpBefore: event.hpBefore,
      hpAfter: event.hpAfter,
      resourceName: event.resourceName,
      resourceBefore: event.resourceBefore,
      resourceAfter: event.resourceAfter,
      resourceMax: event.resourceMax,
    };
    
    const rowData = [
      event.id,
      encounterId,
      event.round,
      event.timestamp,
      event.type,
      event.actorId || '',
      event.actorName || '',
      event.targetId || '',
      event.targetName || '',
      JSON.stringify(detailsObj),
      event.isManualAdjustment ? 'TRUE' : 'FALSE'
    ];
    
    await appendSheetData(resolvedId, `EncounterLogEvents!A:${String.fromCharCode(64 + ENCOUNTER_LOG_EVENT_HEADERS.length)}`, [rowData]);
  } catch (err) {
    console.error('[DB] appendEncounterLogEventDB failed:', err);
    throw err;
  }
}

export async function fetchEncounterLogEventsDB(
  spreadsheetId: string | undefined,
  encounterId: string
): Promise<CombatEvent[]>;
export async function fetchEncounterLogEventsDB(
  encounterId: string
): Promise<CombatEvent[]>;
export async function fetchEncounterLogEventsDB(
  arg1: any,
  arg2?: any
): Promise<CombatEvent[]> {
  let spreadsheetId: string | undefined;
  let encounterId: string;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    encounterId = arg1;
  } else {
    spreadsheetId = arg1;
    encounterId = arg2;
  }
  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const data = await fetchSheetData(resolvedId, `EncounterLogEvents!A2:${String.fromCharCode(64 + ENCOUNTER_LOG_EVENT_HEADERS.length)}`);
    const rows = data.values || [];
    
    return rows
      .filter((row: any[]) => String(row[1]).trim() === String(encounterId).trim())
      .map((row: any[]) => {
        const [
          id, encId, round, timestamp, type,
          actorId, actorName, targetId, targetName,
          details, isManualAdjustment
        ] = row;
        
        let detailsObj: any = {};
        try {
          if (details) {
            detailsObj = JSON.parse(String(details));
          }
        } catch (e) {
          console.warn('[DB] Failed to parse details for event', id, e);
        }
        
        return {
          id: String(id || ''),
          round: Number(round) || 0,
          timestamp: String(timestamp || ''),
          type: type as CombatEventType,
          actorId: actorId ? String(actorId) : null,
          actorName: actorName ? String(actorName) : null,
          targetId: targetId ? String(targetId) : null,
          targetName: targetName ? String(targetName) : null,
          isManualAdjustment: isManualAdjustment === 'TRUE' || isManualAdjustment === true || isManualAdjustment === 'true',
          actionType: detailsObj.actionType,
          value: detailsObj.value,
          damageType: detailsObj.damageType,
          condition: detailsObj.condition,
          hpBefore: detailsObj.hpBefore,
          hpAfter: detailsObj.hpAfter,
          resourceName: detailsObj.resourceName,
          resourceBefore: detailsObj.resourceBefore,
          resourceAfter: detailsObj.resourceAfter,
          resourceMax: detailsObj.resourceMax,
        };
      });
  } catch (err) {
    console.error('[DB] fetchEncounterLogEventsDB failed:', err);
    throw err;
  }
}
