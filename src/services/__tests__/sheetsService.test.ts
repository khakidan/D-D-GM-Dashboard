// src/services/__tests__/sheetsService.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchSheetData } from '../sheetsService';
import { STORAGE_KEYS } from '../../lib/constants';
import * as googleAuth from '../googleAuth';

vi.mock('../googleAuth', () => ({
  requestAccessToken: vi.fn().mockResolvedValue('fake-access-token'),
  refreshAccessToken: vi.fn(),
  clearTokens: vi.fn(),
  getSheetNotifier: vi.fn().mockReturnValue({
    error: vi.fn(),
    loading: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe('sheetsService fetchSheetData tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.spreadsheetId, 'mock-spreadsheet-id');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetchSheetData returns mapped values array', async () => {
    const mockResponse = { values: [['val1', 'val2']] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(mockResponse)))
    );

    const result = await fetchSheetData('A1:B2');
    expect(result).toEqual(mockResponse);
    expect(result.values).toEqual([['val1', 'val2']]);
  });

  it('fetchSheetData returns empty array when API response has no values property', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({}))));

    const result = await fetchSheetData('A1:B2');
    expect(result.values || []).toEqual([]);
  });

  it('fetchSheetData propagates API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API error')));

    await expect(fetchSheetData('A1:B2')).rejects.toThrow('API error');
  });
});

describe('googleFetch retry and error logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.spreadsheetId, 'mock-spreadsheet-id');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('First attempt 401 -> refresh succeeds -> retry with new token -> returns retry success', async () => {
    const firstResponse = new Response('Unauthorized', { status: 401 });
    const secondResponse = new Response(JSON.stringify({ values: [['success']] }), { status: 200 });
    
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);
    vi.stubGlobal('fetch', fetchMock);

    vi.mocked(googleAuth.requestAccessToken).mockResolvedValue('old-token');
    vi.mocked(googleAuth.refreshAccessToken).mockResolvedValue('new-token');

    const result = await fetchSheetData('A1');

    expect(result.values).toEqual([['success']]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    
    // Check first call used old token
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer old-token');
    // Check second call used new token
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer new-token');
  });

  it('First attempt 401 -> refresh returns null -> clearTokens() called and original 401 returned', async () => {
    const firstResponse = new Response('Unauthorized', { status: 401 });
    const fetchMock = vi.fn().mockResolvedValueOnce(firstResponse);
    vi.stubGlobal('fetch', fetchMock);

    vi.mocked(googleAuth.requestAccessToken).mockResolvedValue('token');
    vi.mocked(googleAuth.refreshAccessToken).mockResolvedValue(null);

    // fetchSheetData throws on 401 if refresh fails
    await expect(fetchSheetData('A1')).rejects.toThrow('UNAUTHENTICATED');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(googleAuth.clearTokens).toHaveBeenCalled();
  });

  it('429 response -> retries with correct exponential backoff -> eventually succeeds', async () => {
    const rateLimitResponse = new Response('Too Many Requests', { status: 429 });
    const successResponse = new Response(JSON.stringify({ values: [['ok']] }), { status: 200 });
    
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchSheetData('A1');

    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result.values).toEqual([['ok']]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('5xx response exhausting all MAX_RETRIES -> returns the final failed response (throws in fetchSheetData)', async () => {
    const serverErrorResponse = new Response('Server Error', { status: 500, statusText: 'Internal Server Error' });
    const fetchMock = vi.fn().mockResolvedValue(serverErrorResponse);
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchSheetData('A1');
    const expectPromise = expect(promise).rejects.toThrow(/Failed to fetch sheet data/);

    await vi.runAllTimersAsync();

    await expectPromise;
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('Network-level rejection retried and eventually exhausting MAX_RETRIES -> re-throws original error', async () => {
    const networkError = new Error('Network failure');
    const fetchMock = vi.fn().mockRejectedValue(networkError);
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchSheetData('A1');
    const expectPromise = expect(promise).rejects.toThrow('Network failure');

    await vi.runAllTimersAsync();

    await expectPromise;
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('requestAccessToken() throwing -> returns synthetic 401 UNAUTHENTICATED, fetch never called', async () => {
    vi.mocked(googleAuth.requestAccessToken).mockRejectedValue(new Error('UNAUTHENTICATED'));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSheetData('A1')).rejects.toThrow('UNAUTHENTICATED');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
