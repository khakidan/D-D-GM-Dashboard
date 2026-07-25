import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CampaignSelector } from '../CampaignSelector';
import { Campaign } from '../../hooks/useCampaign';

let mockIsGoogleConnected = true;

vi.mock('../../hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    isGoogleConnected: mockIsGoogleConnected,
    handleSignIn: vi.fn(),
    clearTokens: vi.fn(),
  }),
}));

describe('CampaignSelector Component Tests', () => {
  const defaultProps = {
    campaigns: [] as Campaign[],
    isLoading: false,
    error: null as string | null,
    onCreateCampaign: vi.fn(),
    onConnectCampaign: vi.fn(),
    onOpenCampaign: vi.fn(),
    onDeleteCampaign: vi.fn(),
    onClearError: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    mockIsGoogleConnected = true;
  });

  it('renders empty state correctly when campaigns list is empty', () => {
    render(<CampaignSelector {...defaultProps} />);
    expect(screen.getByText('No campaigns yet.')).toBeInTheDocument();
    expect(screen.getByText('Create New Campaign')).toBeInTheDocument();
    expect(screen.getByText('Connect Existing Spreadsheet')).toBeInTheDocument();
  });

  it('renders Google Connection Required screen when not connected', () => {
    mockIsGoogleConnected = false;
    render(<CampaignSelector {...defaultProps} />);
    expect(screen.getByText('Google Connection Required')).toBeInTheDocument();
    expect(screen.getByText('Connect with Google')).toBeInTheDocument();
    expect(screen.queryByText('No campaigns yet.')).not.toBeInTheDocument();
  });

  it('renders corrupted campaigns warning card when hasParseError is true', () => {
    render(<CampaignSelector {...defaultProps} hasParseError={true} />);
    expect(screen.getByText('Local Campaigns Corrupted')).toBeInTheDocument();
    expect(screen.getByText(/Some or all of your saved campaigns could not be parsed/)).toBeInTheDocument();
  });

  it('does not render corrupted campaigns warning card when hasParseError is false or omitted', () => {
    render(<CampaignSelector {...defaultProps} />);
    expect(screen.queryByText('Local Campaigns Corrupted')).not.toBeInTheDocument();
  });

  it('submitting Create Campaign with a valid name calls onCreateCampaign', async () => {
    const onCreateCampaign = vi.fn().mockResolvedValue({ id: 'new-camp' } as Campaign);
    render(<CampaignSelector {...defaultProps} onCreateCampaign={onCreateCampaign} />);
    
    fireEvent.click(screen.getByText('Create New Campaign'));
    
    const input = screen.getByPlaceholderText('e.g. Curse of Strahd');
    fireEvent.change(input, { target: { value: 'Curse of Strahd' } });
    
    fireEvent.click(screen.getByText('Create Campaign →'));
    expect(onCreateCampaign).toHaveBeenCalledWith('Curse of Strahd');
  });

  it('submitting Create Campaign with empty name shows validation error and does not call callback', () => {
    const onCreateCampaign = vi.fn();
    render(<CampaignSelector {...defaultProps} onCreateCampaign={onCreateCampaign} />);
    
    fireEvent.click(screen.getByText('Create New Campaign'));
    fireEvent.click(screen.getByText('Create Campaign →'));
    
    expect(onCreateCampaign).not.toHaveBeenCalled();
    expect(screen.getByText('Campaign name is required.')).toBeInTheDocument();
  });

  it('submitting Connect Campaign with valid data calls onConnectCampaign', async () => {
    const onConnectCampaign = vi.fn().mockResolvedValue({ id: 'connected-camp' } as Campaign);
    render(<CampaignSelector {...defaultProps} onConnectCampaign={onConnectCampaign} />);
    
    fireEvent.click(screen.getByText('Connect Existing Spreadsheet'));
    
    const nameInput = screen.getByPlaceholderText('e.g. Curse of Strahd');
    fireEvent.change(nameInput, { target: { value: 'Connected Campaign' } });
    
    const sheetInput = screen.getByPlaceholderText('Paste spreadsheet ID or full Google Sheets URL');
    fireEvent.change(sheetInput, { target: { value: 'sheet-id-123' } });
    
    fireEvent.click(screen.getByText('Connect →'));
    expect(onConnectCampaign).toHaveBeenCalledWith('Connected Campaign', 'sheet-id-123');
  });

  it('submitting Connect Campaign with missing spreadsheet ID shows validation error', () => {
    const onConnectCampaign = vi.fn();
    render(<CampaignSelector {...defaultProps} onConnectCampaign={onConnectCampaign} />);
    
    fireEvent.click(screen.getByText('Connect Existing Spreadsheet'));
    
    const nameInput = screen.getByPlaceholderText('e.g. Curse of Strahd');
    fireEvent.change(nameInput, { target: { value: 'Connected Campaign' } });
    
    fireEvent.click(screen.getByText('Connect →'));
    expect(onConnectCampaign).not.toHaveBeenCalled();
    expect(screen.getByText('Spreadsheet ID or URL is required.')).toBeInTheDocument();
  });

  const sampleCampaign: Campaign = {
    id: 'camp-123',
    name: 'Test Campaign',
    spreadsheetId: 'sheet-123',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet-123',
    lastOpenedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  it('clicking delete on a campaign shows confirmation UI without calling onDeleteCampaign', () => {
    const onDeleteCampaign = vi.fn();
    render(<CampaignSelector {...defaultProps} campaigns={[sampleCampaign]} onDeleteCampaign={onDeleteCampaign} />);
    
    fireEvent.click(screen.getByTitle('Remove Campaign from Dashboard'));
    
    expect(screen.getByText(/Remove 'Test Campaign'\?/)).toBeInTheDocument();
    expect(onDeleteCampaign).not.toHaveBeenCalled();
  });

  it('confirming delete calls onDeleteCampaign with correct ID', () => {
    const onDeleteCampaign = vi.fn();
    render(<CampaignSelector {...defaultProps} campaigns={[sampleCampaign]} onDeleteCampaign={onDeleteCampaign} />);
    
    fireEvent.click(screen.getByTitle('Remove Campaign from Dashboard'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    
    expect(onDeleteCampaign).toHaveBeenCalledWith('camp-123');
  });

  it('cancelling delete hides confirmation UI and does not call onDeleteCampaign', () => {
    const onDeleteCampaign = vi.fn();
    render(<CampaignSelector {...defaultProps} campaigns={[sampleCampaign]} onDeleteCampaign={onDeleteCampaign} />);
    
    fireEvent.click(screen.getByTitle('Remove Campaign from Dashboard'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    expect(screen.queryByText(/Remove 'Test Campaign'\?/)).not.toBeInTheDocument();
    expect(onDeleteCampaign).not.toHaveBeenCalled();
  });
});
