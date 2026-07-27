import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ActionUsageTracker } from '../ActionUsageTracker';
import { Character } from '../../../types';

describe('ActionUsageTracker', () => {
  afterEach(() => cleanup());
  const baseCharacter: Character = {
    id: 'char-1',
    characterName: 'Test Character',
    playerName: 'Player 1',
    maxHp: 20,
    currentHp: 20,
    tempHpMax: 0,
    ac: 15,
    tempHp: 0,
    conditions: '',
    passivePerception: 12,
    level: 5,
    statusId: 1,
    statusName: 'Active',
    notes: '',
    isActive: true,
    class: 'Fighter',
    hitDiceConfig: '',
    hitDiceUsed: '',
    abilityScores: '',
    proficiencies: '',
    actions: JSON.stringify([
      { _key: 'act-1', name: 'Fireball', maxUses: 3, currentUses: 2 },
      { _key: 'act-2', name: 'Slash' } // No maxUses
    ]),
    reactions: JSON.stringify([
      { _key: 'rxn-1', name: 'Shield', maxUses: 4, currentUses: 1 }
    ]),
    bonusActions: '[]',
  };

  it('renders nothing when no tracked items exist', () => {
    const emptyChar = { ...baseCharacter, actions: '[]', reactions: '[]' };
    const { container } = render(
      <ActionUsageTracker pcCharacter={emptyChar} isSyncing={false} onUpdate={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders rows for tracked actions and reactions', () => {
    render(<ActionUsageTracker pcCharacter={baseCharacter} isSyncing={false} onUpdate={vi.fn()} />);
    
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.getByText('(Action)')).toBeInTheDocument();
    
    expect(screen.getByText('Shield')).toBeInTheDocument();
    expect(screen.getByText('(Reaction)')).toBeInTheDocument();
    
    // Non-tracked actions are not rendered
    expect(screen.queryByText('Slash')).not.toBeInTheDocument();
  });

  it('calls onUpdate with correctly serialized array on pip click, preserving other arrays', () => {
    const handleUpdate = vi.fn();
    render(<ActionUsageTracker pcCharacter={baseCharacter} isSyncing={false} onUpdate={handleUpdate} />);
    
    // Find the 3rd pip for Fireball (index 2) - to set it as filled
    // Using accessible title if possible, or we can just click the buttons
    const pips = screen.getAllByRole('button');
    // First button is "Reset to Max", then pips for Fireball (3 pips), then "Reset to Max", then pips for Shield
    // Let's just use querySelector for the 3rd pip button for Fireball
    const pipsForFireball = screen.getAllByRole('button', { name: /^Fireball \d+$/ });
    expect(pipsForFireball.length).toBe(3);
    
    // Click the 3rd pip to set usage to 3
    fireEvent.click(pipsForFireball[2]);
    
    expect(handleUpdate).toHaveBeenCalledTimes(1);
    const updatePayload = handleUpdate.mock.calls[0][0];
    
    expect(updatePayload).toHaveProperty('actions');
    expect(updatePayload).not.toHaveProperty('reactions');
    expect(updatePayload).not.toHaveProperty('bonusActions');
    
    const updatedActions = JSON.parse(updatePayload.actions);
    expect(updatedActions).toHaveLength(2);
    expect(updatedActions[0].currentUses).toBe(3);
    expect(updatedActions[1].currentUses).toBeUndefined(); // Unchanged
  });

  it('manual reset button restores currentUses to maxUses', () => {
    const handleUpdate = vi.fn();
    render(<ActionUsageTracker pcCharacter={baseCharacter} isSyncing={false} onUpdate={handleUpdate} />);
    
    const resetButton = screen.getByTestId('reset-usage-rxn-1');
    expect(resetButton).toBeInTheDocument();
    
    fireEvent.click(resetButton!);
    
    expect(handleUpdate).toHaveBeenCalledTimes(1);
    const updatePayload = handleUpdate.mock.calls[0][0];
    
    expect(updatePayload).toHaveProperty('reactions');
    const updatedReactions = JSON.parse(updatePayload.reactions);
    expect(updatedReactions[0].currentUses).toBe(4);
  });
});
