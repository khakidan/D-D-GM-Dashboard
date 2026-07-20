import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PlayerView } from '../PlayerView';
import { useAppState } from '../../hooks/useAppState';

// Mock the useAppState hook
vi.mock('../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('PlayerView Component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Test 1: When combatState has no active encounter the component renders a waiting/standby message
  it('renders a waiting/standby message when combatState has no active encounter', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        hasInitialSynced: true,
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: null,
          combatants: [],
          activeTurnId: null,
          round: 1,
          concentrationLinks: {},
        },
      },
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);

    render(<PlayerView />);
    expect(screen.getByText(/Waiting for GM to start the encounter/i)).toBeInTheDocument();
    expect(screen.queryByText(/Round/i)).toBeNull();
  });

  it('renders a temp HP pill when tempHp > 0 for PC combatants and does not render it when tempHp is 0, and has no AC content', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        hasInitialSynced: true,
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc1',
          combatants: [
            {
              id: 'pc-with-temphp',
              name: 'Gimli',
              type: 'pc',
              ac: 15,
              maxHp: 30,
              currentHp: 25,
              tempHp: 8,
              initiative: 12,
            },
            {
              id: 'pc-no-temphp',
              name: 'Legolas',
              type: 'pc',
              ac: 16,
              maxHp: 25,
              currentHp: 20,
              tempHp: 0,
              initiative: 15,
            }
          ],
          activeTurnId: 'pc-with-temphp',
          round: 1,
          concentrationLinks: {},
        },
      },
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);

    const { container } = render(<PlayerView />);
    
    // PC Gimli has tempHp: 8. The pill should exist and display '8'.
    const pill = screen.getByTestId('player-temphp-pill');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveTextContent('8');

    // PC Legolas has tempHp: 0. No pill should be rendered.
    const pills = screen.queryAllByTestId('player-temphp-pill');
    expect(pills.length).toBe(1);

    // Confirming no AC-related content (no text like "AC" or "tempAc" is present on the page)
    expect(screen.queryByText(/AC/i)).toBeNull();
    expect(container.textContent).not.toContain('AC');
  });
});
