// src/server/routes/campaigns.ts

import { Router } from 'express';
import { sheets_v4 } from 'googleapis';
import { createRateLimiter } from '../rateLimiter';
import { requireBody } from '../bodyValidation';
import {
  CHARACTER_HEADERS,
  NPC_HEADERS,
  ENCOUNTER_HEADERS,
  ENCOUNTER_COMBATANT_HEADERS
} from '../../lib/sheetSchemas';

const router = Router();

function getGoogleAuthHeaders(token: string) {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

const campaignCreateLimiter = createRateLimiter({
  error: 'TOO_MANY_REQUESTS',
  message: 'Too many campaign creation attempts. Please try again in 15 minutes.'
});

router.post('/create', campaignCreateLimiter, requireBody, async (req, res) => {
  try {
    const { title } = req.body;
    const authHeader = req.headers.authorization;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Spreadsheet title is required.' });
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Bearer access token is required.' });
    }
    const token = authHeader.substring(7);

    // 1. Create Spreadsheet with title
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: getGoogleAuthHeaders(token),
      body: JSON.stringify({
        properties: {
          title
        }
      })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      let createData;
      try {
        createData = JSON.parse(errorText);
      } catch (e) {
        createData = { error: { message: errorText } };
      }
      console.error('[Server] Failed to create spreadsheet:', errorText);
      return res.status(createRes.status).json({
        error: 'GOOGLE_API_ERROR',
        message: createData?.error?.message || 'Google Sheets API rejected the request.',
        details: createData
      });
    }

    const createData = await createRes.json() as any;

    const { spreadsheetId, spreadsheetUrl } = createData;

    const requiredSheets = [
      {
        title: 'Characters',
        headers: [...CHARACTER_HEADERS],
        rows: []
      },
      {
        title: 'NPCs',
        headers: [...NPC_HEADERS],
        rows: []
      },
      {
        title: 'Encounters',
        headers: [...ENCOUNTER_HEADERS],
        rows: []
      },
      {
        title: 'Encounter_Combatants',
        headers: [...ENCOUNTER_COMBATANT_HEADERS],
        rows: []
      },
      {
        title: 'Status',
        headers: ['Status_ID', 'Status_Name'],
        rows: [
          ['1', 'Active'],
          ['2', 'Inactive'],
          ['3', 'Deceased']
        ]
      },
      {
        title: 'Difficulty_Level',
        headers: ['Difficulty_ID', 'Difficulty_Name'],
        rows: [
          ['1', 'Easy'],
          ['2', 'Medium'],
          ['3', 'Hard'],
          ['4', 'Deadly']
        ]
      },
      {
        title: 'EncounterLogs',
        headers: [
          'id', 'encounterId', 'encounterName',
          'location', 'date', 'durationRounds',
          'outcome', 'partySnapshot', 'events',
          'transcript'
        ],
        rows: []
      }
    ];

    const defaultSheetId = createData.sheets?.[0]?.properties?.sheetId ?? 0;

    const batchRequests: sheets_v4.Schema$Request[] = [];
    for (const sheet of requiredSheets) {
      batchRequests.push({
        addSheet: {
          properties: {
            title: sheet.title
          }
        }
      });
    }
    batchRequests.push({
      deleteSheet: {
        sheetId: defaultSheetId
      }
    });

    const sheetsUpdateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: getGoogleAuthHeaders(token),
      body: JSON.stringify({ requests: batchRequests })
    });

    if (!sheetsUpdateRes.ok) {
      const errorText = await sheetsUpdateRes.text();
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          errorDetail = errorJson.error.message;
        }
      } catch (e) {
        // fallback to raw text
      }
      console.error('[Server] Failed sheet structure batch update:', errorText);
      return res.status(sheetsUpdateRes.status).json({
        error: 'SHEET_STRUCTURE_FAILED',
        message: 'Spreadsheet was created but sheet tabs could not be provisioned: ' + errorDetail,
        spreadsheetId,
        spreadsheetUrl
      });
    }

    const valueData = requiredSheets.map(sheet => {
      const rowsToWrite = [sheet.headers, ...sheet.rows];
      return {
        range: `${sheet.title}!A1:Z${rowsToWrite.length}`,
        values: rowsToWrite
      };
    });

    const headersRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: getGoogleAuthHeaders(token),
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueData
      })
    });

    if (!headersRes.ok) {
      const errorText = await headersRes.text();
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          errorDetail = errorJson.error.message;
        }
      } catch (e) {
        // fallback to raw text
      }
      console.error('[Server] Failed headers batch update:', errorText);
      return res.status(headersRes.status).json({
        error: 'HEADERS_FAILED',
        message: 'Spreadsheet and sheet tabs were created but column headers could not be written: ' + errorDetail,
        spreadsheetId,
        spreadsheetUrl
      });
    }

    res.json({
      spreadsheetId,
      spreadsheetUrl,
      name: title
    });

  } catch (error: any) {
    console.error('[Server] Exception creating campaign spreadsheet:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
});

export default router;
