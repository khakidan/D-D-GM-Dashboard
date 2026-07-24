// src/services/__tests__/googleAuth.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestAccessToken, clearTokens, checkAndCaptureToken } from '../googleAuth';
import { STORAGE_KEYS } from '../../lib/constants';

describe('googleAuth token management tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.clear();
    clearTokens();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns stored access token when valid', async () => {
    localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'valid-token');
    
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const token = await requestAccessToken();
    expect(token).toBe('valid-token');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refreshes token when expired', async () => {
    localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'refresh-token');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'new-access-token' }))
      )
    );

    const token = await requestAccessToken();
    expect(token).toBe('new-access-token');
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('new-access-token');
  });

  it('clears auth state on refresh failure', async () => {
    localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'refresh-token');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })
      )
    );

    await expect(requestAccessToken()).rejects.toThrow('UNAUTHENTICATED');
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.googleRefreshToken)).toBeNull();
  });
});

describe('checkAndCaptureToken state validation', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.clear();
    clearTokens();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('accepts valid matching state and stores the token (Hash & Code flow)', async () => {
    // 1. Hash/Implicit Flow
    localStorage.setItem(STORAGE_KEYS.oauthState, 'matching-state-123');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback#access_token=hash-token-abc&state=matching-state-123',
      pathname: '/callback',
      search: '',
      hash: '#access_token=hash-token-abc&state=matching-state-123',
      origin: 'http://localhost',
    });
    const replaceStateSpy = vi.fn();
    vi.stubGlobal('history', { replaceState: replaceStateSpy });

    let result = await checkAndCaptureToken();
    expect(result).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('hash-token-abc');
    expect(replaceStateSpy).toHaveBeenCalled();

    // Reset storage & token for the next part
    localStorage.clear();
    localStorage.clear();
    clearTokens();

    // 2. Code Flow
    localStorage.setItem(STORAGE_KEYS.oauthState, 'matching-state-456');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback?code=code-123&state=matching-state-456',
      pathname: '/callback',
      search: '?code=code-123&state=matching-state-456',
      hash: '',
      origin: 'http://localhost',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'code-access-token', refresh_token: 'code-refresh-token' }))
      )
    );

    result = await checkAndCaptureToken();
    expect(result).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('code-access-token');
    expect(localStorage.getItem(STORAGE_KEYS.googleRefreshToken)).toBe('code-refresh-token');
  });

  it('rejects mismatched state and returns false (Hash & Code flow)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 1. Hash Flow
    localStorage.setItem(STORAGE_KEYS.oauthState, 'stored-state');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback#access_token=hash-token-abc&state=attacker-state',
      pathname: '/callback',
      search: '',
      hash: '#access_token=hash-token-abc&state=attacker-state',
      origin: 'http://localhost',
    });
    const replaceStateSpy = vi.fn();
    vi.stubGlobal('history', { replaceState: replaceStateSpy });

    let result = await checkAndCaptureToken();
    expect(result).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
    expect(replaceStateSpy).toHaveBeenCalled();

    // Reset storage & token for the next part
    localStorage.clear();
    localStorage.clear();
    clearTokens();

    // 2. Code Flow
    localStorage.setItem(STORAGE_KEYS.oauthState, 'stored-state');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback?code=code-123&state=attacker-state',
      pathname: '/callback',
      search: '?code=code-123&state=attacker-state',
      hash: '',
      origin: 'http://localhost',
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    result = await checkAndCaptureToken();
    expect(result).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('rejects missing/null stored state (Hash & Code flow)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 1. Hash Flow
    // localStorage has no oauthState
    vi.stubGlobal('location', {
      href: 'http://localhost/callback#access_token=hash-token-abc&state=some-state',
      pathname: '/callback',
      search: '',
      hash: '#access_token=hash-token-abc&state=some-state',
      origin: 'http://localhost',
    });
    const replaceStateSpy = vi.fn();
    vi.stubGlobal('history', { replaceState: replaceStateSpy });

    let result = await checkAndCaptureToken();
    expect(result).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();

    // Reset storage & token for the next part
    localStorage.clear();
    localStorage.clear();
    clearTokens();

    // 2. Code Flow
    // localStorage has no oauthState
    vi.stubGlobal('location', {
      href: 'http://localhost/callback?code=code-123&state=some-state',
      pathname: '/callback',
      search: '?code=code-123&state=some-state',
      hash: '',
      origin: 'http://localhost',
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    result = await checkAndCaptureToken();
    expect(result).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('removes stored state from localStorage after checkAndCaptureToken runs once (regardless of match or mismatch)', async () => {
    // 1. Matching case
    localStorage.setItem(STORAGE_KEYS.oauthState, 'matching-state');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback#access_token=hash-token-abc&state=matching-state',
      pathname: '/callback',
      search: '',
      hash: '#access_token=hash-token-abc&state=matching-state',
      origin: 'http://localhost',
    });
    vi.stubGlobal('history', { replaceState: vi.fn() });

    await checkAndCaptureToken();
    expect(localStorage.getItem(STORAGE_KEYS.oauthState)).toBeNull();

    // Reset storage & token for the next part
    localStorage.clear();
    localStorage.clear();
    clearTokens();

    // 2. Mismatch case
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.oauthState, 'mismatched-state');
    vi.stubGlobal('location', {
      href: 'http://localhost/callback#access_token=hash-token-abc&state=attacker-state',
      pathname: '/callback',
      search: '',
      hash: '#access_token=hash-token-abc&state=attacker-state',
      origin: 'http://localhost',
    });
    vi.stubGlobal('history', { replaceState: vi.fn() });

    await checkAndCaptureToken();
    expect(localStorage.getItem(STORAGE_KEYS.oauthState)).toBeNull();

    consoleErrorSpy.mockRestore();
  });
});

describe('postMessage origin validation', () => {
  beforeEach(() => {
    localStorage.clear();
    clearTokens();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('rejects postMessage from unallowed origin', async () => {
    // Create a mock for checkAndCaptureToken's effect
    const replaceStateSpy = vi.fn();
    vi.stubGlobal('history', { replaceState: replaceStateSpy });
    
    // Create a spy to ensure we don't reload or process the payload
    const reloadSpy = vi.fn();
    vi.stubGlobal('location', {
      origin: 'http://localhost',
      reload: reloadSpy
    });

    // We need to test the event listener that was added in googleAuth.ts
    // The easiest way to test it is to dispatch a message event
    const event = new MessageEvent('message', {
      data: { type: 'OAUTH_REDIRECT_PAYLOAD', url: 'http://localhost/callback?code=evil-code&state=evil-state' },
      origin: 'https://evil.example.com'
    });
    
    // Dispatch the event
    window.dispatchEvent(event);
    
    // Give promises a chance to resolve (though it should return early)
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // reload should not be called, which means checkAndCaptureToken was not called successfully
    // (or not called at all, which is the intended behavior)
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('accepts postMessage from allowed origin', async () => {
    localStorage.setItem(STORAGE_KEYS.oauthState, 'matching-state');
    
    // Create a mock for checkAndCaptureToken's effect
    const replaceStateSpy = vi.fn();
    vi.stubGlobal('history', { replaceState: replaceStateSpy });
    
    const reloadSpy = vi.fn();
    vi.stubGlobal('location', {
      origin: 'http://localhost',
      href: 'http://localhost',
      pathname: '/',
      search: '',
      reload: reloadSpy
    });

    // Mock fetch to simulate successful token exchange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'code-access-token' }))
      )
    );

    const event = new MessageEvent('message', {
      data: { type: 'OAUTH_REDIRECT_PAYLOAD', url: 'http://localhost/callback?code=valid-code&state=matching-state' },
      origin: 'http://localhost'
    });
    
    // Dispatch the event
    window.dispatchEvent(event);
    
    // Give promises a chance to resolve
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // checkAndCaptureToken should be called successfully, which triggers a reload
    expect(reloadSpy).toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('code-access-token');
  });

  it('accepts postMessage from an ALLOWED_ORIGINS entry', async () => {
    localStorage.setItem(STORAGE_KEYS.oauthState, 'matching-state');
    
    // Create a mock for checkAndCaptureToken's effect
    const replaceStateSpy = vi.fn();
    vi.stubGlobal('history', { replaceState: replaceStateSpy });
    
    const reloadSpy = vi.fn();
    vi.stubGlobal('location', {
      origin: 'https://other.origin.com', // different from message origin
      href: 'https://other.origin.com',
      pathname: '/',
      search: '',
      reload: reloadSpy
    });

    // Mock fetch to simulate successful token exchange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'code-access-token' }))
      )
    );

    const event = new MessageEvent('message', {
      data: { type: 'OAUTH_REDIRECT_PAYLOAD', url: 'https://other.origin.com/callback?code=valid-code&state=matching-state' },
      origin: 'https://dnd-gm-dashboard-541768011837.us-west2.run.app'
    });
    
    // Dispatch the event
    window.dispatchEvent(event);
    
    // Give promises a chance to resolve
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // checkAndCaptureToken should be called successfully, which triggers a reload
    expect(reloadSpy).toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('code-access-token');
  });

  it('accepts postMessage from a localhost origin with a port', async () => {
    localStorage.setItem(STORAGE_KEYS.oauthState, 'matching-state');
    
    // Create a mock for checkAndCaptureToken's effect
    const replaceStateSpy = vi.fn();
    vi.stubGlobal('history', { replaceState: replaceStateSpy });
    
    const reloadSpy = vi.fn();
    vi.stubGlobal('location', {
      origin: 'http://localhost', // no port, different from message origin
      href: 'http://localhost',
      pathname: '/',
      search: '',
      reload: reloadSpy
    });

    // Mock fetch to simulate successful token exchange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'code-access-token' }))
      )
    );

    const event = new MessageEvent('message', {
      data: { type: 'OAUTH_REDIRECT_PAYLOAD', url: 'http://localhost/callback?code=valid-code&state=matching-state' },
      origin: 'http://localhost:5173'
    });
    
    // Dispatch the event
    window.dispatchEvent(event);
    
    // Give promises a chance to resolve
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // checkAndCaptureToken should be called successfully, which triggers a reload
    expect(reloadSpy).toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('code-access-token');
  });
});


