import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SheetConnectionSettings } from '../SheetConnectionSettings';

describe('SheetConnectionSettings', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    tempSpreadsheetId: 'test-sheet-id',
    setTempSpreadsheetId: vi.fn(),
    handleSaveSpreadsheet: vi.fn(),
    handleResetConfiguration: vi.fn(),
    isGoogleConnected: false,
  };

  it('renders correctly with initial spreadsheet ID', () => {
    render(<SheetConnectionSettings {...defaultProps} />);

    expect(screen.getByText('Google Spreadsheet Connection')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Spreadsheet ID')).toHaveValue('test-sheet-id');
  });

  it('calls setTempSpreadsheetId when the spreadsheet ID input changes', async () => {
    const setTempSpreadsheetId = vi.fn();
    render(<SheetConnectionSettings {...defaultProps} setTempSpreadsheetId={setTempSpreadsheetId} />);

    const input = screen.getByPlaceholderText('Enter Spreadsheet ID');
    await userEvent.clear(input);
    await userEvent.type(input, 'new-id');

    expect(setTempSpreadsheetId).toHaveBeenCalled();
  });

  it('calls handleSaveSpreadsheet when clicking Save ID button', async () => {
    const handleSaveSpreadsheet = vi.fn();
    render(<SheetConnectionSettings {...defaultProps} handleSaveSpreadsheet={handleSaveSpreadsheet} />);

    await userEvent.click(screen.getByRole('button', { name: /save id/i }));
    expect(handleSaveSpreadsheet).toHaveBeenCalledTimes(1);
  });

  it('opens confirmation dialog when clicking reset button', async () => {
    render(<SheetConnectionSettings {...defaultProps} />);
    
    expect(screen.queryByText('Reset Spreadsheet Configuration?')).not.toBeInTheDocument();
    
    await userEvent.click(screen.getByRole('button', { name: /reset spreadsheet config/i }));
    
    expect(screen.getByText('Reset Spreadsheet Configuration?')).toBeInTheDocument();
    expect(screen.getByText(/This will disconnect your current Google Spreadsheet link/i)).toBeInTheDocument();
  });

  it('calls handleResetConfiguration and closes dialog when reset is confirmed', async () => {
    const handleResetConfiguration = vi.fn();
    render(<SheetConnectionSettings {...defaultProps} handleResetConfiguration={handleResetConfiguration} />);

    // Open dialog
    await userEvent.click(screen.getByRole('button', { name: /reset spreadsheet config/i }));
    
    // Confirm reset
    await userEvent.click(screen.getByRole('button', { name: /^reset$/i }));
    
    expect(handleResetConfiguration).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Reset Spreadsheet Configuration?')).not.toBeInTheDocument();
  });
});
