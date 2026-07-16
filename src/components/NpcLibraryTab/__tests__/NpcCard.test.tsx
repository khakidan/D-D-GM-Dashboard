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
});
