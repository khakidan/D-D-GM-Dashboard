import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReferenceDataSeeder } from '../ReferenceDataSeeder';
import { useReferenceDataSeeder } from '../../hooks/useReferenceDataSeeder';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../../hooks/useReferenceDataSeeder');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

describe('ReferenceDataSeeder', () => {
  const mockSeeder = {
    fetchSpreadsheetMetadata: vi.fn(),
    fetchSheetData: vi.fn(),
    batchUpdateSpreadsheet: vi.fn(),
    updateSheetData: vi.fn(),
    appendSheetData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    vi.mocked(useReferenceDataSeeder).mockReturnValue(mockSeeder);

    // Mock fetch for Open5e API
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('conditions')) {
        return {
          ok: true,
          json: async () => ({
            results: [
              { name: 'Blinded', desc: 'Can\'t see.', document__title: 'SRD' }
            ]
          })
        };
      }
      if (url.includes('spells')) {
        return {
          ok: true,
          json: async () => ({
            results: [
              { 
                name: 'Fireball',
                level_int: 3,
                school: 'Evocation',
                casting_time: '1 action',
                range: '150 feet',
                components: 'V, S, M',
                duration: 'Instantaneous',
                concentration: 'no',
                desc: 'A bright streak...',
                higher_level: 'More damage',
                classes: ['Sorcerer', 'Wizard'],
                document__title: 'SRD'
              }
            ],
            next: null // Ensures loop terminates
          })
        };
      }
      throw new Error(`Unhandled fetch mock for url: ${url}`);
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('displays warning toast and blocks seeding if Google connection is inactive', async () => {
    render(<ReferenceDataSeeder isGoogleConnected={false} />);
    
    await userEvent.click(screen.getByRole('button', { name: /seed srd reference data/i }));
    
    expect(toast.error).toHaveBeenCalledWith('Google Sheets Connection Required', expect.any(Object));
    expect(mockSeeder.fetchSpreadsheetMetadata).not.toHaveBeenCalled();
  });

  it('displays idle state with database icon and seed button', () => {
    render(<ReferenceDataSeeder isGoogleConnected={true} />);
    
    expect(screen.getByText('Reference Data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /seed srd reference data/i })).toBeInTheDocument();
  });

  it('seeds conditions and spells, terminating the spells loop after one page, and displays success toast', async () => {
    // Mock metadata missing sheets to trigger creation
    mockSeeder.fetchSpreadsheetMetadata.mockResolvedValue({
      sheets: [{ properties: { title: 'Characters' } }] // Missing Conditions and Spells
    });
    
    // Mock sheet data empty to trigger seeding
    mockSeeder.fetchSheetData.mockResolvedValue([]);
    mockSeeder.batchUpdateSpreadsheet.mockResolvedValue({});
    mockSeeder.updateSheetData.mockResolvedValue({});
    mockSeeder.appendSheetData.mockResolvedValue({});

    render(<ReferenceDataSeeder isGoogleConnected={true} />);
    
    await userEvent.click(screen.getByRole('button', { name: /seed srd reference data/i }));
    
    // Validates metadata was fetched
    expect(mockSeeder.fetchSpreadsheetMetadata).toHaveBeenCalled();
    
    // Validates batch update to create missing sheets was called
    expect(mockSeeder.batchUpdateSpreadsheet).toHaveBeenCalled();
    
    // Expect multiple updates for headers and data
    expect(mockSeeder.updateSheetData).toHaveBeenCalled();
    
    // Validates the API was fetched for conditions and spells
    expect(global.fetch).toHaveBeenCalledWith('https://api.open5e.com/v1/conditions/?document__slug=wotc-srd&limit=100');
    expect(global.fetch).toHaveBeenCalledWith('https://api.open5e.com/v1/spells/?document__slug=wotc-srd&limit=400');
    
    // Validates success toast
    expect(toast.success).toHaveBeenCalledWith('Reference data seeded', expect.any(Object));
  });

  it('displays success toast and skips seeding when sheets already contain data', async () => {
    // Mock metadata with existing sheets
    mockSeeder.fetchSpreadsheetMetadata.mockResolvedValue({
      sheets: [
        { properties: { title: 'Characters' } },
        { properties: { title: 'Conditions' } },
        { properties: { title: 'Spells' } }
      ]
    });
    
    // Mock sheet data to return populated rows (length > 1 means headers + data exist)
    mockSeeder.fetchSheetData.mockResolvedValue({
      values: [
        ['Name', 'Desc'],
        ['Condition 1', 'Desc 1'],
      ]
    });

    render(<ReferenceDataSeeder isGoogleConnected={true} />);
    
    await userEvent.click(screen.getByRole('button', { name: /seed srd reference data/i }));
    
    // Validates metadata was fetched
    expect(mockSeeder.fetchSpreadsheetMetadata).toHaveBeenCalled();
    
    // Validates sheet data was checked
    expect(mockSeeder.fetchSheetData).toHaveBeenCalled();
    
    // Validates that it was skipped
    expect(mockSeeder.appendSheetData).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Validates success toast
    expect(toast.success).toHaveBeenCalledWith('Reference data already seeded', expect.any(Object));
  });

  it('displays error toast and reverts loading state if any seeding step fails', async () => {
    // Mock metadata to throw an error
    mockSeeder.fetchSpreadsheetMetadata.mockRejectedValue(new Error('API Error'));

    render(<ReferenceDataSeeder isGoogleConnected={true} />);
    
    const button = screen.getByRole('button', { name: /seed srd reference data/i });
    await userEvent.click(button);
    
    // Validates error toast
    expect(toast.error).toHaveBeenCalledWith('Failed to seed reference data', expect.any(Object));
    
    // Verify loading state reverted (button is enabled and back to idle text)
    expect(button).toBeEnabled();
    expect(screen.getByText(/seed srd reference data/i)).toBeInTheDocument();
  });
});
