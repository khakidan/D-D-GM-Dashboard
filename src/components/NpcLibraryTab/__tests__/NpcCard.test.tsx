import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import { NpcCard } from '../NpcCard';
import { NPC } from '../../../types';
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('NpcCard', () => {
  afterEach(() => cleanup());

  it('adds a new trait with a synthetic _key', () => {
    const mockNpc: NPC = {
      id: 'npc-1',
      name: 'Goblin',
      ac: 15,
      maxHp: 7,
      notes: '',
      abilityScores: JSON.stringify({ STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 10, CHA: 8 }),
      proficiencies: JSON.stringify({}),
      speed: '30ft.',
      senses: '',
      languages: '',
      challengeRating: '0.25',
      traits: JSON.stringify([{ name: 'Nimble', description: 'Moves quickly' }]),
      actions: '[]',
      reactions: '[]',
      legendaryActionsList: '[]',
    };
    
    let updatedNpc: any = null;
    const onUpdate = (data: Partial<NPC>) => { updatedNpc = data; };

    // Use a wrapper component to manage expansion state
    const TestWrapper = () => {
      const [expanded, setExpanded] = React.useState(false);
      return (
        <NpcCard 
          npc={mockNpc} 
          isSyncing={false} 
          isExpanded={expanded} 
          onToggleExpand={() => setExpanded(!expanded)} 
          onUpdate={onUpdate} 
          onDelete={vi.fn()} 
        />
      );
    };

    const { getByLabelText, getByRole } = render(<TestWrapper />);

    // Expand NpcCard
    const expandButton = getByLabelText('Expand NPC card');
    fireEvent.click(expandButton);

    // Click "Add Trait" button
    const addTraitButton = getByRole('button', { name: /Add Trait/i });
    fireEvent.click(addTraitButton);

    // Verify new trait is added and has a _key
    expect(updatedNpc).not.toBeNull();
    const updatedTraits = JSON.parse(updatedNpc.traits);
    const newTrait = updatedTraits[updatedTraits.length - 1];
    
    expect(newTrait.name).toBe(''); // Default empty item
    expect(newTrait._key).toBeDefined();
    expect(typeof newTrait._key).toBe('string');
    expect(newTrait._key!.length).toBeGreaterThan(0);
  });

  it('supports adding, editing, and deleting actions inside NpcCard', () => {
    const mockNpc: NPC = {
      id: 'npc-1',
      name: 'Goblin',
      ac: 15,
      maxHp: 7,
      notes: '',
      abilityScores: JSON.stringify({ STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 10, CHA: 8 }),
      proficiencies: JSON.stringify({}),
      speed: '30ft.',
      senses: '',
      languages: '',
      challengeRating: '0.25',
      traits: '[]',
      actions: JSON.stringify([
        {
          name: 'Bite',
          description: 'Sharp teeth.',
          recharge: 'Recharge 5–6',
          attackBonus: 5,
          damage: '1d6+3',
        }
      ]),
      reactions: '[]',
      legendaryActionsList: '[]',
    };

    let updatedNpcUpdates: any = null;
    const onUpdate = (updates: Partial<NPC>) => {
      updatedNpcUpdates = updates;
    };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Verify action name and recharge are shown
    const biteInput = screen.getByDisplayValue('Bite');
    expect(biteInput).toBeInTheDocument();

    const rechargeInput = screen.getByPlaceholderText('e.g. Recharge 5–6');
    expect(rechargeInput).toHaveValue('Recharge 5–6');
    expect(screen.queryByText('Cost')).not.toBeInTheDocument();

    // Edit recharge
    fireEvent.change(rechargeInput, { target: { value: 'Recharge 6' } });
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedActionsAfterEdit = JSON.parse(updatedNpcUpdates.actions || '[]');
    expect(parsedActionsAfterEdit[0].recharge).toBe('Recharge 6');

    // Click Add Action
    const addActionBtn = screen.getByRole('button', { name: /Add Action/i });
    fireEvent.click(addActionBtn);
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedActionsAfterAdd = JSON.parse(updatedNpcUpdates.actions || '[]');
    expect(parsedActionsAfterAdd.length).toBe(2);

    // Click Remove Action
    const removeBtns = screen.getAllByRole('button', { name: /Remove Action/i });
    fireEvent.click(removeBtns[0]);
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedActionsAfterRemove = JSON.parse(updatedNpcUpdates.actions || '[]');
    expect(parsedActionsAfterRemove.length).toBe(0);
  });

  it('supports adding, editing, and deleting legendary actions inside NpcCard', () => {
    const mockNpc: NPC = {
      id: 'npc-1',
      name: 'Dragon',
      ac: 19,
      maxHp: 200,
      notes: '',
      abilityScores: JSON.stringify({ STR: 20, DEX: 10, CON: 20, INT: 10, WIS: 10, CHA: 10 }),
      proficiencies: JSON.stringify({}),
      speed: '40ft.',
      senses: '',
      languages: '',
      challengeRating: '10',
      traits: '[]',
      actions: '[]',
      reactions: '[]',
      legendaryActionsList: JSON.stringify([
        {
          name: 'Wing Attack',
          description: 'Beats wings.',
          cost: 2,
        }
      ]),
    };

    let updatedNpcUpdates: any = null;
    const onUpdate = (updates: Partial<NPC>) => {
      updatedNpcUpdates = updates;
    };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Verify legendary action name, Cost label, and cost input are shown
    const wingInput = screen.getByDisplayValue('Wing Attack');
    expect(wingInput).toBeInTheDocument();

    expect(screen.getByText('Cost')).toBeInTheDocument();
    const costInput = screen.getByPlaceholderText('Cost (1-3)');
    expect(costInput).toHaveValue(2);

    // Edit cost
    fireEvent.change(costInput, { target: { value: '3' } });
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedLegendaryAfterEdit = JSON.parse(updatedNpcUpdates.legendaryActionsList || '[]');
    expect(parsedLegendaryAfterEdit[0].cost).toBe(3);

    // Click Add Legendary Action
    const addLegendaryBtn = screen.getByRole('button', { name: /Add Legendary Action/i });
    fireEvent.click(addLegendaryBtn);
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedLegendaryAfterAdd = JSON.parse(updatedNpcUpdates.legendaryActionsList || '[]');
    expect(parsedLegendaryAfterAdd.length).toBe(2);

    // Click Remove Legendary Action
    const removeBtns = screen.getAllByRole('button', { name: /Remove Legendary Action/i });
    fireEvent.click(removeBtns[0]);
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedLegendaryAfterRemove = JSON.parse(updatedNpcUpdates.legendaryActionsList || '[]');
    expect(parsedLegendaryAfterRemove.length).toBe(0);
  });

  const mockNpcForMemoTests: NPC = {
    id: 'npc-memo-1',
    name: 'Kobold',
    ac: 12,
    maxHp: 5,
    notes: '',
    abilityScores: JSON.stringify({ STR: 7, DEX: 15, CON: 9, INT: 8, WIS: 7, CHA: 8 }),
    proficiencies: JSON.stringify({}),
    speed: '30ft.',
    senses: '',
    languages: '',
    challengeRating: '0.125',
    traits: '[]',
    actions: '[]',
    reactions: '[]',
    legendaryActionsList: '[]',
  };

  it('does not re-render when only callback props change reference (same npc/isSyncing/isExpanded)', async () => {
    const abilityScores = await import('../../../lib/abilityScores');
    const spy = vi.spyOn(abilityScores, 'parseAbilityScores');
    spy.mockClear();

    function Wrapper() {
      // Fresh callback references every render, exactly like NpcLibraryTab.tsx's real
      // .map() call site does — this is the scenario the custom comparator is
      // specifically meant to ignore.
      return (
        <NpcCard
          npc={mockNpcForMemoTests}
          isSyncing={false}
          isExpanded={false}
          onToggleExpand={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      );
    }

    const { rerender } = render(<Wrapper />);
    const callsAfterFirstRender = spy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    rerender(<Wrapper />);

    // parseAbilityScores is called at the top of NpcCard's own function body on
    // every actual execution — if the memo comparator correctly bailed out, this
    // spy's call count must not have increased at all.
    expect(spy.mock.calls.length).toBe(callsAfterFirstRender);

    spy.mockRestore();
  });

  it('does re-render when npc reference actually changes', async () => {
    const abilityScores = await import('../../../lib/abilityScores');
    const spy = vi.spyOn(abilityScores, 'parseAbilityScores');
    spy.mockClear();

    const updatedNpc = { ...mockNpcForMemoTests, maxHp: 8 };

    function Wrapper({ npc }: { npc: NPC }) {
      return (
        <NpcCard
          npc={npc}
          isSyncing={false}
          isExpanded={false}
          onToggleExpand={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      );
    }

    const { rerender } = render(<Wrapper npc={mockNpcForMemoTests} />);
    const callsAfterFirstRender = spy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    rerender(<Wrapper npc={updatedNpc} />);

    // A genuinely different npc object (the one actually being updated) must still
    // cause a real re-render — the comparator must not over-suppress this.
    expect(spy.mock.calls.length).toBeGreaterThan(callsAfterFirstRender);

    spy.mockRestore();
  });

  it('auto-collapses empty sections in display context (NpcCard)', () => {
    const mockNpcWithEmptyTraits: NPC = {
      ...mockNpcForMemoTests,
      id: 'npc-empty-traits',
      traits: '[]',
      actions: JSON.stringify([{ name: 'Attack', description: 'Hit stuff' }]),
    };

    render(
      <NpcCard
        npc={mockNpcWithEmptyTraits}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Actions section has items, so it should be expanded
    expect(screen.getByText('Add Action')).toBeInTheDocument();

    // Traits section is empty, so it should be collapsed by defaultExpanded={traits.length > 0}
    expect(screen.queryByText('Add Trait')).not.toBeInTheDocument();

    // Clicking Traits header should expand it
    fireEvent.click(screen.getByText('Traits'));
    expect(screen.getByText('Add Trait')).toBeInTheDocument();
  });

  it('legendary pip trackers stay visible even when Legendary Actions list is collapsed', () => {
    const mockNpcWithLegendary: NPC = {
      ...mockNpcForMemoTests,
      id: 'npc-legendary',
      legendaryActions: 3,
      legendaryResistances: 3,
      legendaryActionsList: JSON.stringify([{ name: 'Tail Swipe', description: 'Hits back', cost: 1 }]),
    };

    render(
      <NpcCard
        npc={mockNpcWithLegendary}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Initially expanded
    expect(screen.getByDisplayValue('Tail Swipe')).toBeInTheDocument();
    // Pip trackers (NpcLegendarySection) should be visible
    expect(screen.getAllByText(/Legendary Actions/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Resistances/i)).toBeInTheDocument();

    // Click the "Legendary Actions" list header to collapse it
    // We need to be careful because there are two "Legendary Actions" texts:
    // 1. The pip tracker label
    // 2. The NpcListEditor title
    // In NpcCard, the list editor title is what has the click handler.
    const listHeader = screen.getAllByText('Legendary Actions').find(el => el.closest('div')?.classList.contains('cursor-pointer'));
    expect(listHeader).toBeDefined();
    fireEvent.click(listHeader!);

    // List content should be gone
    expect(screen.queryByDisplayValue('Tail Swipe')).not.toBeInTheDocument();

    // BUT pip trackers (NpcLegendarySection) must still be visible per resolved design
    expect(screen.getAllByText(/Legendary Actions/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Resistances/i)).toBeInTheDocument();
  });
});
