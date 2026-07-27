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

  it('supports pagination, page size switching, navigation, and auto-resetting to page 1 on filter/size changes', async () => {
    const mockNpcs = Array.from({ length: 15 }, (_, i) => ({
      id: `npc-${i + 1}`,
      name: `NPC-${i + 1}`,
      challengeRating: '1',
      resistances: '',
      ac: 10 + i,
      maxHp: 10 + i,
    }));

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

    // 1. Confirm page indicator displays "Page 1 of 2"
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 1 of 2');

    // 2. Confirm only the first 10 render (NPC-1 through NPC-10) and NPC-11 is absent
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByDisplayValue(`NPC-${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByDisplayValue('NPC-11')).not.toBeInTheDocument();

    // 3. Confirm Previous is disabled, Next is enabled
    const prevBtn = screen.getByTestId('prev-page-btn');
    const nextBtn = screen.getByTestId('next-page-btn');
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // 4. Click Next to go to Page 2
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 2 of 2');

    // Confirm first 10 are now hidden, and remaining 5 (NPC-11 through NPC-15) are rendered
    for (let i = 1; i <= 10; i++) {
      expect(screen.queryByDisplayValue(`NPC-${i}`)).not.toBeInTheDocument();
    }
    for (let i = 11; i <= 15; i++) {
      expect(screen.getByDisplayValue(`NPC-${i}`)).toBeInTheDocument();
    }

    // Confirm Previous is now enabled, Next is disabled
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();

    // 5. Change page size to 25
    const pageSizeSelect = screen.getByTestId('page-size-select');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });

    // Confirm resets to page 1 and all 15 NPCs render
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 1 of 1');
    for (let i = 1; i <= 15; i++) {
      expect(screen.getByDisplayValue(`NPC-${i}`)).toBeInTheDocument();
    }

    // Previous and Next should be disabled since we are on the only page
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeDisabled();

    // 6. Set page size back to 10 and navigate to page 2 again
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 1 of 2');
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 2 of 2');

    // 7. Apply a filter that narrows the search to "NPC-3"
    const searchInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(searchInput, { target: { value: 'NPC-3' } });

    // Confirm page reset back to page 1 and only "NPC-3" renders
    await waitFor(() => {
      const pi = screen.getByTestId('page-indicator');
      expect(pi).toHaveTextContent('Page 1 of 1');
      // The name appears both in the search input and in the filtered card
      expect(screen.getAllByDisplayValue('NPC-3')).toHaveLength(2);
      expect(screen.queryByDisplayValue('NPC-1')).not.toBeInTheDocument();
    });
  });
});
