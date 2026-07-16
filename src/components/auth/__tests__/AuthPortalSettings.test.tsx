import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthPortalSettings } from '../AuthPortalSettings';

describe('AuthPortalSettings', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    isGoogleConnected: false,
    handleSignIn: vi.fn(),
    handleSignOutWithClear: vi.fn(),
    showAdvancedAuth: false,
    setShowAdvancedAuth: vi.fn(),
    manualToken: '',
    setManualTokenState: vi.fn(),
    handleApplyManualToken: vi.fn(),
  };

  it('displays sign-in prompt and button when offline', () => {
    render(<AuthPortalSettings {...defaultProps} />);

    expect(screen.getByText('Offline / Local-Only')).toBeInTheDocument();
    expect(screen.getByText(/Log in to securely store/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('calls handleSignIn when sign in button is clicked', async () => {
    const handleSignIn = vi.fn();
    render(<AuthPortalSettings {...defaultProps} handleSignIn={handleSignIn} />);

    await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    expect(handleSignIn).toHaveBeenCalledTimes(1);
  });

  it('displays disconnect button and active state when connected', () => {
    render(<AuthPortalSettings {...defaultProps} isGoogleConnected={true} />);

    expect(screen.getByText('Connected to Google')).toBeInTheDocument();
    expect(screen.getByText(/Google sync is live!/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disconnect account/i })).toBeInTheDocument();
  });

  it('calls handleSignOutWithClear when disconnect button is clicked', async () => {
    const handleSignOutWithClear = vi.fn();
    render(<AuthPortalSettings {...defaultProps} isGoogleConnected={true} handleSignOutWithClear={handleSignOutWithClear} />);

    await userEvent.click(screen.getByRole('button', { name: /disconnect account/i }));
    expect(handleSignOutWithClear).toHaveBeenCalledTimes(1);
  });

  it('calls setShowAdvancedAuth when configure manual token button is clicked', async () => {
    const setShowAdvancedAuth = vi.fn();
    render(<AuthPortalSettings {...defaultProps} setShowAdvancedAuth={setShowAdvancedAuth} />);

    await userEvent.click(screen.getByRole('button', { name: /configure manual token/i }));
    expect(setShowAdvancedAuth).toHaveBeenCalledWith(true);
  });

  it('updates manual token input and calls handleApplyManualToken when apply button is clicked', async () => {
    const setManualTokenState = vi.fn();
    const handleApplyManualToken = vi.fn();
    
    render(
      <AuthPortalSettings 
        {...defaultProps} 
        showAdvancedAuth={true} 
        manualToken="test-token"
        setManualTokenState={setManualTokenState}
        handleApplyManualToken={handleApplyManualToken}
      />
    );

    const input = screen.getByPlaceholderText(/paste google refresh token/i);
    await userEvent.type(input, '123');
    
    // Depending on the exact typing, we just verify the change handler is called
    expect(setManualTokenState).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /apply token/i }));
    expect(handleApplyManualToken).toHaveBeenCalledTimes(1);
  });
});

