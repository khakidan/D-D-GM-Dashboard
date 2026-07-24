import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDashboardStore } from '../../hooks/dashboardStore';
import { resolveActiveSpreadsheetId } from '../../services/sheetsService';
import { fetchSpreadsheetMetadata, batchUpdateSpreadsheet } from '../../services/dbOperations/shared';
import { updateNpcFullDB } from '../../services/dbOperations/npcs';
import { reconstructChallengeRating } from '../../lib/challengeRatingRepair';

import { GMTestingTools } from '../GMTestingTools';


vi.mock('../../hooks/dashboardStore', () => ({
  useDashboardStore: vi.fn(),
}));

vi.mock('../../services/sheetsService', () => ({
  resolveActiveSpreadsheetId: vi.fn(),
}));

vi.mock('../../services/dbOperations/shared', () => ({
  fetchSpreadsheetMetadata: vi.fn(),
  batchUpdateSpreadsheet: vi.fn(),
}));

vi.mock('../../services/dbOperations/npcs', () => ({
  updateNpcFullDB: vi.fn(),
}));

vi.mock('../../lib/challengeRatingRepair', () => ({
  reconstructChallengeRating: vi.fn(),
}));

describe('GMTestingTools', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    fireDeathEvent: vi.fn(),
    fireDamageEvent: vi.fn(),
    fireHealEvent: vi.fn(),
    fireUnconsciousEvent: vi.fn(),
    fireRageEvent: vi.fn(),
    fireInitiativeEvent: vi.fn(),
  };

  it('renders all animation testing buttons', () => {
    render(<GMTestingTools {...defaultProps} />);

    expect(screen.getByRole('button', { name: /test death animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test damage animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test heal animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test unconscious animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test rage animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test initiative animation/i })).toBeInTheDocument();
  });

  it('calls expected event handlers with default payloads when clicked', async () => {
    render(<GMTestingTools {...defaultProps} />);

    await userEvent.click(screen.getByRole('button', { name: /test death animation/i }));
    expect(defaultProps.fireDeathEvent).toHaveBeenCalledWith({ characterName: 'Aldric the Brave' });

    await userEvent.click(screen.getByRole('button', { name: /test damage animation/i }));
    expect(defaultProps.fireDamageEvent).toHaveBeenCalledWith({ combatantNames: ['Thorin Ironforge'], damageAmount: 47 });

    await userEvent.click(screen.getByRole('button', { name: /test heal animation/i }));
    expect(defaultProps.fireHealEvent).toHaveBeenCalledWith({ combatantNames: ['Seraphina Brightwell'], healAmount: 34 });

    await userEvent.click(screen.getByRole('button', { name: /test unconscious animation/i }));
    expect(defaultProps.fireUnconsciousEvent).toHaveBeenCalledWith({ characterName: 'Gareth of Stonehaven' });

    await userEvent.click(screen.getByRole('button', { name: /test rage animation/i }));
    expect(defaultProps.fireRageEvent).toHaveBeenCalledWith({ characterName: 'Bjorn the Unbroken' });

    await userEvent.click(screen.getByRole('button', { name: /test initiative animation/i }));
    expect(defaultProps.fireInitiativeEvent).toHaveBeenCalledWith(true);
  });

  describe('Data Repair Tools', () => {
    it('does not execute write-back without explicit user confirmation', async () => {
      const mockUpdateNpc = vi.fn();
      
      vi.mocked(useDashboardStore).mockImplementation((selector: any) => {
        const state = {
          npcs: [
            { id: 'npc1', name: 'Goblin', challengeRating: '46026' }
          ],
          updateState: mockUpdateNpc
        };
        return selector(state);
      });

      vi.mocked(resolveActiveSpreadsheetId).mockReturnValue('test-camp');

      vi.mocked(fetchSpreadsheetMetadata).mockResolvedValue({
        sheets: [{ properties: { title: 'NPCs', sheetId: 12345 } }]
      } as any);

      vi.mocked(batchUpdateSpreadsheet).mockResolvedValue();

      vi.mocked(reconstructChallengeRating).mockReturnValue({ match: '1/4', ambiguous: [] });

      render(<GMTestingTools {...defaultProps} />);
      
      // Click scan
      await userEvent.click(screen.getByRole('button', { name: /Scan for Corrupted CRs/i }));
      
      // Verify candidates shown
      expect(await screen.findByText('Repair Candidates Found (1)')).toBeInTheDocument();
      expect(screen.getByText('Goblin')).toBeInTheDocument();
      
      // Verify no write-back has occurred yet
      expect(updateNpcFullDB).not.toHaveBeenCalled();
      expect(mockUpdateNpc).not.toHaveBeenCalled();
      
      // Click confirm
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      
      // Now verify write-back happened
      expect(updateNpcFullDB).toHaveBeenCalledWith('test-camp', expect.objectContaining({
        id: 'npc1',
        challengeRating: '1/4'
      }));
      expect(mockUpdateNpc).toHaveBeenCalled();
      const updateFn = mockUpdateNpc.mock.calls[0][0];
      const prevState = { npcs: [{ id: 'npc1', name: 'Goblin', challengeRating: '46026' }] };
      const nextState = updateFn({ ...prevState, campaignName: 'Test', hasInitialSynced: true } as any);
      expect(nextState.npcs[0]).toEqual(expect.objectContaining({
        id: 'npc1',
        challengeRating: '1/4'
      }));
    });
  });

});

