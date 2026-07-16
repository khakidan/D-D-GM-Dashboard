import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { AuthRelay } from '../AuthRelay';
import { STORAGE_KEYS } from '../../../lib/constants';

const mockSignInWithRedirect = vi.fn();
const mockSignInWithToken = vi.fn();

vi.mock('../../../hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    signInWithRedirect: mockSignInWithRedirect,
    signInWithToken: mockSignInWithToken,
  }),
}));

describe('AuthRelay Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // 1. Render Sync Authentication (not logged in) screen when no tokens are in localStorage
  it('should render Sync Authentication (not logged in) screen when no tokens are in localStorage', () => {
    render(<AuthRelay />);
    expect(screen.getByRole('heading', { name: /Sync Authentication/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Troubleshooting Login Issues/i })).toBeInTheDocument();
  });

  // 2. Trigger redirect login when clicking 'Sign In with Google'
  it("should trigger redirect login when clicking 'Sign In with Google'", () => {
    render(<AuthRelay />);
    const signInBtn = screen.getByRole('button', { name: /Sign In with Google/i });
    fireEvent.click(signInBtn);
    expect(mockSignInWithRedirect).toHaveBeenCalledTimes(1);
  });

  // 3. Render troubleshooting section when clicking troubleshooting button
  it('should render troubleshooting section when clicking troubleshooting button', () => {
    render(<AuthRelay />);
    
    // Troubleshooting should not be visible initially
    expect(screen.queryByText('1. Authorized Redirect URI')).not.toBeInTheDocument();

    const troubleshootingBtn = screen.getByRole('button', { name: /Troubleshooting Login Issues/i });
    fireEvent.click(troubleshootingBtn);

    // Now it should be visible
    expect(screen.getByText('1. Authorized Redirect URI')).toBeInTheDocument();
    expect(screen.getByText(/Missing Refresh Token\?/i)).toBeInTheDocument();
    expect(screen.getByText(/400: redirect_uri_mismatch/i)).toBeInTheDocument();

    // Toggle it off
    fireEvent.click(troubleshootingBtn);
    expect(screen.queryByText('1. Authorized Redirect URI')).not.toBeInTheDocument();
  });

  // 4. Render logged-in state with both access and refresh tokens
  it('should render logged-in state with both access and refresh tokens', () => {
    localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'mock-access-token');
    localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'mock-refresh-token');

    render(<AuthRelay />);

    expect(screen.getByRole('heading', { name: /Login Successful!/i })).toBeInTheDocument();
    expect(screen.getByText(/Persistent Sync Code \(Refresh Token\):/i)).toBeInTheDocument();
    
    // Verify the tokens are in the textareas
    const textareas = screen.getAllByRole('textbox');
    const values = textareas.map(t => (t as HTMLTextAreaElement).value);
    expect(values).toContain('mock-access-token');
    expect(values).toContain('mock-refresh-token');
  });

  // 5. Render persistence error state when access token is present but refresh token is missing
  it('should render persistence error state when access token is present but refresh token is missing', () => {
    localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'mock-access-token');

    render(<AuthRelay />);

    expect(screen.getByRole('heading', { name: /Login Successful!/i })).toBeInTheDocument();
    expect(screen.getByText(/Persistence ERROR/i)).toBeInTheDocument();
    expect(screen.getByText(/Google did not return a/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Out & Try Again/i })).toBeInTheDocument();
  });

  // 6. Clear tokens and update UI when clicking 'Sign Out & Clear Session'
  it("should clear tokens and update UI when clicking 'Sign Out & Clear Session'", () => {
    localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'mock-access-token');
    localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'mock-refresh-token');

    render(<AuthRelay />);

    expect(screen.getByRole('heading', { name: /Login Successful!/i })).toBeInTheDocument();

    const signOutBtn = screen.getByRole('button', { name: /Sign Out & Clear Session/i });
    fireEvent.click(signOutBtn);

    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.googleRefreshToken)).toBeNull();

    // Should transition back to login screen
    expect(screen.getByRole('heading', { name: /Sync Authentication/i })).toBeInTheDocument();
  });

  // 7. Update state and render logged-in view when storage events are dispatched (cross-tab sync)
  it('should update state and render logged-in view when storage events are dispatched (cross-tab sync)', async () => {
    render(<AuthRelay />);

    expect(screen.getByRole('heading', { name: /Sync Authentication/i })).toBeInTheDocument();

    // Simulate StorageEvent for Access Token
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEYS.googleAccessToken,
          newValue: 'new-storage-access-token',
        })
      );
    });

    // Let's also dispatch Refresh Token
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEYS.googleRefreshToken,
          newValue: 'new-storage-refresh-token',
        })
      );
    });

    // Should transition to logged in successful
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Login Successful!/i })).toBeInTheDocument();
    });

    const textareas = screen.getAllByRole('textbox');
    const values = textareas.map(t => (t as HTMLTextAreaElement).value);
    expect(values).toContain('new-storage-access-token');
    expect(values).toContain('new-storage-refresh-token');
  });

  // 8. Poll localStorage on interval and transition to logged-in state when tokens appear
  it('should poll localStorage on interval and transition to logged-in state when tokens appear', () => {
    vi.useFakeTimers();

    render(<AuthRelay />);
    expect(screen.getByRole('heading', { name: /Sync Authentication/i })).toBeInTheDocument();

    // Now set tokens in localStorage
    localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'polled-access-token');
    localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'polled-refresh-token');

    // Advance the timers by 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should now show Login Successful
    expect(screen.getByRole('heading', { name: /Login Successful!/i })).toBeInTheDocument();

    vi.useRealTimers();
  });

  // 9. Handle copying refresh token with auto-dismissing visual confirmation and handle timer race conditions
  it('should handle copying refresh token with auto-dismissing visual confirmation and handle timer race conditions', () => {
    vi.useFakeTimers();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'mock-access-token');
    localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'mock-refresh-token');

    render(<AuthRelay />);

    const copyBtn = screen.getByRole('button', { name: /Copy Refresh Token/i });
    expect(copyBtn).toBeInTheDocument();

    // Click copy
    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenLastCalledWith('mock-refresh-token');
    expect(screen.getByRole('button', { name: /Copied!/i })).toBeInTheDocument();

    // Advance by 1000ms (halfway)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Still copied
    expect(screen.getByRole('button', { name: /Copied!/i })).toBeInTheDocument();

    // Click copy again to trigger race condition reset
    fireEvent.click(copyBtn);

    // Advance by another 1500ms. If the first timer was not cancelled, it would have fired at 2000ms total (reverting it).
    // But since we reset it, it should stay "Copied!" until 1500ms + 1000ms = 2500ms from the second click, which is 3500ms total.
    act(() => {
      vi.advanceTimersByTime(1500); // This takes total time to 2500ms. First timer would have fired at 2000ms.
    });
    expect(screen.getByRole('button', { name: /Copied!/i })).toBeInTheDocument();

    // Now advance another 500ms (taking second timer to 2000ms total, bringing us to 3000ms total time)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    // Reverts back
    expect(screen.queryByRole('button', { name: /Copied!/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Refresh Token/i })).toBeInTheDocument();

    vi.useRealTimers();
  });
});
