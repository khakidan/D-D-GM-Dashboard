import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcLibraryTab } from '../../NpcLibraryTab';
import { useAppState } from '../../../hooks/useAppState';
import { useNpcLibrary } from '../hooks/useNpcLibrary';

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

vi.mock('../hooks/useNpcLibrary', () => ({
  useNpcLibrary: vi.fn(),
}));

describe('NpcLibraryTab', () => {
  afterEach(() => cleanup());

  it('renders without crashing', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: { npcs: [], combatState: { combatants: [] } },
      updateState: vi.fn(),
    } as any);

    vi.mocked(useNpcLibrary).mockReturnValue({
      state: { npcs: [] },
      syncingId: null,
      globalError: null,
      handleAddNpc: vi.fn(),
      handleUpdateNpc: vi.fn(),
      handleDeleteNpc: vi.fn(),
    } as any);

    render(<NpcLibraryTab />);
    expect(screen.getByText(/NPC Library/i)).toBeInTheDocument();
  });

  it('filters by name and CR correctly', async () => {
    const mockNpcs = [
      { id: '1', name: 'Goblin', challengeRating: '1/4', resistances: 'poison', ac: 15, maxHp: 7 },
      { id: '2', name: 'Orc', challengeRating: '1/2', resistances: '', ac: 13, maxHp: 15 },
      { id: '3', name: 'Dragon', challengeRating: '10', resistances: 'fire', ac: 19, maxHp: 200 },
    ];
    vi.mocked(useAppState).mockReturnValue({
      state: { npcs: mockNpcs, combatState: { combatants: [] } },
      updateState: vi.fn(),
    } as any);

    vi.mocked(useNpcLibrary).mockReturnValue({
      state: { npcs: mockNpcs },
      syncingId: null,
      globalError: null,
      handleAddNpc: vi.fn(),
      handleUpdateNpc: vi.fn(),
      handleDeleteNpc: vi.fn(),
    } as any);

    render(<NpcLibraryTab />);
    
    // Check options are populated and sorted
    const crSelect = screen.getByTestId('cr-filter');
    const options = Array.from(crSelect.querySelectorAll('option')).map(o => o.value);
    expect(options).toContain('1/4');
    expect(options).toContain('1/2');
    expect(options).toContain('10');
    // Basic sorting check (1/4 < 1/2 < 10)
    const crValues = options.filter(o => o !== '').map(o => o === '1/4' ? 0.25 : o === '1/2' ? 0.5 : 10);
    expect(crValues[0]).toBeLessThan(crValues[1]);
    expect(crValues[1]).toBeLessThan(crValues[2]);

    // Filter by CR
    fireEvent.change(crSelect, { target: { value: '1/4' } });
    
    // Check if only Goblin is rendered
    await waitFor(() => {
      expect(screen.getByDisplayValue('Goblin')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Orc')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Dragon')).not.toBeInTheDocument();
    });

    // Combination filter (CR 1/4 + Resist Fire - should show nothing)
    const resistSelect = screen.getByTestId('resist-filter');
    fireEvent.change(resistSelect, { target: { value: 'fire' } });
    await waitFor(() => {
      expect(screen.queryByDisplayValue('Goblin')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Orc')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Dragon')).not.toBeInTheDocument();
    });

    // Reset CR filter to 10 + Resist Fire -> should show Dragon
    fireEvent.change(crSelect, { target: { value: '10' } });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Dragon')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Goblin')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Orc')).not.toBeInTheDocument();
    });
  });
});
