import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CharacterCardExpanded } from '../CharacterCardExpanded';

describe('CharacterCardExpanded', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const defaultCharacter = {
    id: 'pc-1',
    playerName: 'Alice',
    characterName: 'Thor',
    ac: 15,
    maxHp: 20,
    tempHp: 0,
    currentHp: 20,
    conditions: '',
    passivePerception: 14,
    level: 2, // Paladin gets spellcasting at level 2
    statusId: 1,
    statusName: 'Active',
    notes: '',
    isActive: true,
    class: 'Paladin',
    hitDiceConfig: '1d10',
    hitDiceUsed: '{}',
    abilityScores: '{}',
    proficiencies: '{}',
  };

  const defaultProps = {
    character: defaultCharacter,
    isSyncing: false,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders without crashing with full character data', () => {
    const { container } = render(<CharacterCardExpanded {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('clamps current HP to effective max HP (exhaustion-halved scenario) on blur', () => {
    const onUpdateMock = vi.fn();
    const testCharacter = {
      ...defaultCharacter,
      maxHp: 40,
      tempHpMax: 20, // effectiveMaxHp is 20
      currentHp: 17,
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={testCharacter}
        onUpdate={onUpdateMock}
      />
    );

    const hpInput = screen.getByDisplayValue('17');
    expect(hpInput).toBeInTheDocument();

    // Type a value above the effective max HP (20)
    fireEvent.change(hpInput, { target: { value: '35' } });
    
    // Trigger blur to commit the value
    fireEvent.blur(hpInput);

    expect(onUpdateMock).toHaveBeenCalledWith({ currentHp: 20 });
  });

  it('handles GM-Controlled character toggle and displays/updates traits, actions, and reactions when enabled', () => {
    const onUpdateMock = vi.fn();

    // 1. Render with default character where gmControlled is false/undefined
    const { rerender } = render(
      <CharacterCardExpanded
        {...defaultProps}
        onUpdate={onUpdateMock}
      />
    );

    // Assert the three Traits/Actions/Reactions sections are NOT present
    expect(screen.queryByRole('heading', { name: /^traits$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^actions$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^reactions$/i })).not.toBeInTheDocument();

    // 2. Click "GM-Controlled Character" checkbox and assert onUpdate is called
    const gmCheckbox = screen.getByLabelText('GM-Controlled Character');
    fireEvent.click(gmCheckbox);

    expect(onUpdateMock).toHaveBeenCalledWith({ gmControlled: true });

    // 3. Render fresh / re-render with gmControlled: true and populated traits/actions/reactions
    const gmCharacter = {
      ...defaultCharacter,
      gmControlled: true,
      traits: JSON.stringify([{ name: 'Spellcasting', description: 'Can cast spells' }]),
      actions: JSON.stringify([{ name: 'Multiattack', description: 'Makes two attacks' }]),
      reactions: JSON.stringify([{ name: 'Shield', description: 'Gains +5 AC' }]),
    };

    rerender(
      <CharacterCardExpanded
        {...defaultProps}
        character={gmCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // Assert the three sections ARE now present and populated content is visible
    expect(screen.getByRole('heading', { name: /^traits$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^actions$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^reactions$/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Spellcasting')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Can cast spells')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Multiattack')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Shield')).toBeInTheDocument();

    // 4. Add an entry to the Traits list editor and assert onUpdate reflects that change
    onUpdateMock.mockClear();
    const addTraitButton = screen.getByRole('button', { name: /add trait/i });
    fireEvent.click(addTraitButton);

    expect(onUpdateMock).toHaveBeenCalledTimes(1);
    const updatedTraits = JSON.parse(onUpdateMock.mock.calls[0][0].traits);
    expect(updatedTraits).toHaveLength(2);
    expect(updatedTraits[0]).toEqual({ name: 'Spellcasting', description: 'Can cast spells' });
    expect(updatedTraits[1]).toEqual(expect.objectContaining({ name: '', description: '' }));
  });
});
