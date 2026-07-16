import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SettingsPage } from '../SettingsPage';
import { useAppState } from '../../hooks/useAppState';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';

vi.mock('../../hooks/useAppState');
vi.mock('../../context/ThemeContext', () => ({
  useTheme: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock child components to isolate SettingsPage's own inline functions
vi.mock('../SheetConnectionSettings', () => ({
  SheetConnectionSettings: () => <div data-testid="mock-sheet-connection-settings" />
}));
vi.mock('../auth/AuthPortalSettings', () => ({
  AuthPortalSettings: () => <div data-testid="mock-auth-portal-settings" />
}));
vi.mock('../ReferenceDataSeeder', () => ({
  ReferenceDataSeeder: () => <div data-testid="mock-reference-data-seeder" />
}));
vi.mock('../GMTestingTools', () => ({
  GMTestingTools: () => <div data-testid="mock-gm-testing-tools" />
}));

describe('SettingsPage Backup Export/Import', () => {
  const mockUpdateState = vi.fn();
  const mockState = {
    campaignName: 'Test Campaign!',
    characters: [{ id: 'char1' }],
    npcs: [{ id: 'npc1' }],
    encounters: [{ id: 'enc1' }],
    encounterCombatants: [{ id: 'ec1' }]
  };

  const defaultProps = {
    isGoogleConnected: true,
    handleSignIn: vi.fn(),
    handleSignOut: vi.fn(),
    setIsGoogleConnected: vi.fn(),
    handleSyncWithSheets: vi.fn(),
    addLog: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: mockUpdateState
    });

    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
    } as any);

    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('exports campaign data as JSON with correct fields and triggers download', async () => {
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function(this: HTMLAnchorElement) {
      expect(this.href).toContain('blob:mock-url');
      const date = new Date().toISOString().split('T')[0];
      expect(this.download).toBe(`campaign-test-campaign--${date}.json`);
    });

    render(<SettingsPage {...defaultProps} />);
    
    await userEvent.click(screen.getByRole('button', { name: /export/i }));
    
    expect(global.URL.createObjectURL).toHaveBeenCalledOnce();
    const blobArg = vi.mocked(global.URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('application/json');
    
    const text = await blobArg.text();
    const parsed = JSON.parse(text);
    
    expect(parsed.version).toBe('1.0');
    expect(parsed.campaignName).toBe('Test Campaign!');
    expect(parsed.characters).toEqual([{ id: 'char1' }]);
    expect(parsed.npcs).toEqual([{ id: 'npc1' }]);
    expect(parsed.encounters).toEqual([{ id: 'enc1' }]);
    expect(parsed.encounterCombatants).toEqual([{ id: 'ec1' }]);
    
    expect(anchorClickSpy).toHaveBeenCalledOnce();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(toast.success).toHaveBeenCalledWith('Campaign exported successfully');
    
    anchorClickSpy.mockRestore();
  });

  it('imports valid campaign backup file and merges exactly 5 fields into state', async () => {
    render(<SettingsPage {...defaultProps} />);
    
    const importData = {
      version: '1.0',
      exportDate: '2026-07-16T00:00:00.000Z',
      campaignName: 'Imported Campaign',
      characters: [{ id: 'char2' }],
      npcs: [{ id: 'npc2' }],
      encounters: [{ id: 'enc2' }],
      encounterCombatants: [{ id: 'ec2' }]
    };
    
    const file = new File([JSON.stringify(importData)], 'backup.json', { type: 'application/json' });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(fileInput, file);
    
    await waitFor(() => {
      expect(mockUpdateState).toHaveBeenCalledOnce();
    });
    
    const updateFn = mockUpdateState.mock.calls[0][0];
    const prevState = { previousField: true };
    const nextState = updateFn(prevState);
    
    expect(nextState).toEqual({
      previousField: true,
      campaignName: 'Imported Campaign',
      characters: [{ id: 'char2' }],
      npcs: [{ id: 'npc2' }],
      encounters: [{ id: 'enc2' }],
      encounterCombatants: [{ id: 'ec2' }]
    });
    
    expect(nextState.version).toBeUndefined();
    expect(nextState.exportDate).toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith('Campaign data imported successfully');
  });

  it('blocks import of malformed schema and does not update state', async () => {
    render(<SettingsPage {...defaultProps} />);
    
    const invalidData = {
      version: '1.0',
      campaignName: 123,
      characters: "Not an array"
    };
    
    const file = new File([JSON.stringify(invalidData)], 'bad-backup.json', { type: 'application/json' });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(fileInput, file);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Import Failed: Malformed campaign JSON', expect.any(Object));
    });
    
    expect(mockUpdateState).not.toHaveBeenCalled();
  });
});
