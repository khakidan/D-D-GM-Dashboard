import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ResourcePoolsSection } from '../ResourcePoolsSection';
import { Character } from '../../../../types';

const sampleCharacter: Character = {
  id: 'char-123',
  playerName: 'Tester',
  characterName: 'Krag',
  ac: 15,
  maxHp: 25,
  tempHp: 0,
  currentHp: 25,
  conditions: '',
  passivePerception: 10,
  level: 3,
  statusId: 1,
  statusName: 'Active',
  notes: '',
  isActive: true,
  class: 'Barbarian',
  hitDiceConfig: '3d12',
  hitDiceUsed: '0d12',
  resourcePools: JSON.stringify([
    { name: 'Rage', current: 1, max: 3, reset: 'long' },
    { name: 'Ki Points', current: 2, max: 4, reset: 'short' },
    { name: 'Grit', current: 1, max: 2, reset: 'none' },
  ]),
  abilityScores: '{}',
  proficiencies: '{}',
};

describe('ResourcePoolsSection Component', () => {
  afterEach(() => {
    cleanup();
  });

  // 1. Render existing pools with name, current/max, and reset badges
  it('renders existing pools with correct names, current/max values, and reset-cycle badges', () => {
    render(
      <ResourcePoolsSection
        character={sampleCharacter}
        isSyncing={false}
        onUpdate={vi.fn()}
      />
    );

    // Rage - Long Rest (purple)
    expect(screen.getByText('Rage')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Reset: Long Rest Only')).toBeInTheDocument();

    // Ki Points - Short Rest (blue)
    expect(screen.getByText('Ki Points')).toBeInTheDocument();
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
    expect(screen.getByText('Reset: Short/Long Rest')).toBeInTheDocument();

    // Grit - Manual / None (gray)
    expect(screen.getByText('Grit')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Reset: Manual Reset')).toBeInTheDocument();
  });

  // 2. Add-pool form: toggle open, fill fields, submit -> callback receives correct payload
  it('opens add-pool form, fills fields, and submits new pool to onUpdate', () => {
    const onUpdate = vi.fn();
    render(
      <ResourcePoolsSection
        character={sampleCharacter}
        isSyncing={false}
        onUpdate={onUpdate}
      />
    );

    // Toggle open
    const addBtn = screen.getByRole('button', { name: /Add Track/i });
    fireEvent.click(addBtn);

    // Fill form
    const nameInput = screen.getByPlaceholderText('Rage, Ki, Spell Slots...');
    const maxInput = screen.getByLabelText(/Max Uses/i);
    const resetSelect = screen.getByRole('combobox');

    fireEvent.change(nameInput, { target: { value: 'Spell Slots' } });
    fireEvent.change(maxInput, { target: { value: '2' } });
    fireEvent.change(resetSelect, { target: { value: 'short' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Create Tracker/i });
    fireEvent.click(submitBtn);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const expectedPools = [
      { name: 'Rage', current: 1, max: 3, reset: 'long' },
      { name: 'Ki Points', current: 2, max: 4, reset: 'short' },
      { name: 'Grit', current: 1, max: 2, reset: 'none' },
      { name: 'Spell Slots', max: 2, current: 2, reset: 'short' },
    ];
    expect(onUpdate).toHaveBeenCalledWith({
      resourcePools: JSON.stringify(expectedPools),
    });

    // Form closes
    expect(screen.queryByRole('button', { name: /Create Tracker/i })).not.toBeInTheDocument();
  });

  // 3. Inline edit of an existing pool -> callback receives correctly-merged update
  it('edits an existing pool inline and calls onUpdate with merged changes', () => {
    const onUpdate = vi.fn();
    render(
      <ResourcePoolsSection
        character={sampleCharacter}
        isSyncing={false}
        onUpdate={onUpdate}
      />
    );

    // Click edit on Rage
    const editBtn = screen.getAllByTitle('Edit Tracker')[0];
    fireEvent.click(editBtn);

    const nameInput = screen.getByDisplayValue('Rage');
    const maxInput = screen.getByDisplayValue('3');
    const resetSelect = screen.getByRole('combobox');

    fireEvent.change(nameInput, { target: { value: 'Greater Rage' } });
    fireEvent.change(maxInput, { target: { value: '5' } });
    fireEvent.change(resetSelect, { target: { value: 'short' } });

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const expectedPools = [
      { name: 'Greater Rage', current: 1, max: 5, reset: 'short' },
      { name: 'Ki Points', current: 2, max: 4, reset: 'short' },
      { name: 'Grit', current: 1, max: 2, reset: 'none' },
    ];
    expect(onUpdate).toHaveBeenCalledWith({
      resourcePools: JSON.stringify(expectedPools),
    });
  });

  // 4. Pip interaction standardized semantics
  it('clicking pips spends or recovers uses and calls onUpdate with correct payload', () => {
    const onUpdate = vi.fn();
    render(
      <ResourcePoolsSection
        character={sampleCharacter}
        isSyncing={false}
        onUpdate={onUpdate}
      />
    );

    // Rage has current=1, max=3.
    // Pip 1 (index 0) is filled. Clicking it -> remaining becomes 0.
    const ragePip1 = screen.getByRole('button', { name: 'Rage 1' });
    fireEvent.click(ragePip1);

    expect(onUpdate).toHaveBeenCalledWith({
      resourcePools: JSON.stringify([
        { name: 'Rage', current: 0, max: 3, reset: 'long' },
        { name: 'Ki Points', current: 2, max: 4, reset: 'short' },
        { name: 'Grit', current: 1, max: 2, reset: 'none' },
      ]),
    });

    onUpdate.mockClear();

    // Rage has current=1, max=3.
    // Pip 2 (index 1) is empty. Clicking it -> remaining becomes 2.
    const ragePip2 = screen.getByRole('button', { name: 'Rage 2' });
    fireEvent.click(ragePip2);

    expect(onUpdate).toHaveBeenCalledWith({
      resourcePools: JSON.stringify([
        { name: 'Rage', current: 2, max: 3, reset: 'long' },
        { name: 'Ki Points', current: 2, max: 4, reset: 'short' },
        { name: 'Grit', current: 1, max: 2, reset: 'none' },
      ]),
    });
  });

  // 5. -/+ buttons: single-step spend and recover, disabled when isSyncing=true
  it('spend and recover buttons update pool count and are disabled when isSyncing=true', () => {
    const onUpdate = vi.fn();
    const { rerender } = render(
      <ResourcePoolsSection
        character={sampleCharacter}
        isSyncing={false}
        onUpdate={onUpdate}
      />
    );

    // Spend 1 Rage (current 1 -> 0)
    const spendRageBtn = screen.getAllByTitle('Spend 1 Use')[0];
    fireEvent.click(spendRageBtn);
    expect(onUpdate).toHaveBeenCalledWith({
      resourcePools: JSON.stringify([
        { name: 'Rage', current: 0, max: 3, reset: 'long' },
        { name: 'Ki Points', current: 2, max: 4, reset: 'short' },
        { name: 'Grit', current: 1, max: 2, reset: 'none' },
      ]),
    });

    onUpdate.mockClear();

    // Recover 1 Rage (current 1 -> 2)
    const recoverRageBtn = screen.getAllByTitle('Recover 1 Use')[0];
    fireEvent.click(recoverRageBtn);
    expect(onUpdate).toHaveBeenCalledWith({
      resourcePools: JSON.stringify([
        { name: 'Rage', current: 2, max: 3, reset: 'long' },
        { name: 'Ki Points', current: 2, max: 4, reset: 'short' },
        { name: 'Grit', current: 1, max: 2, reset: 'none' },
      ]),
    });

    // Test disabled state when isSyncing=true
    rerender(
      <ResourcePoolsSection
        character={sampleCharacter}
        isSyncing={true}
        onUpdate={onUpdate}
      />
    );

    const spendBtns = screen.getAllByTitle('Spend 1 Use');
    const recoverBtns = screen.getAllByTitle('Recover 1 Use');
    expect(spendBtns[0]).toBeDisabled();
    expect(recoverBtns[0]).toBeDisabled();
    expect(screen.getByRole('button', { name: /Add Track/i })).toBeDisabled();
  });

  // 6. Delete-confirmation lifecycle
  it('handles delete confirmation lifecycle correctly', () => {
    const onUpdate = vi.fn();
    render(
      <ResourcePoolsSection
        character={sampleCharacter}
        isSyncing={false}
        onUpdate={onUpdate}
      />
    );

    // Click delete on Rage
    const deleteBtns = screen.getAllByTitle('Remove Tracker');
    fireEvent.click(deleteBtns[0]);

    // ConfirmationDialog is open
    expect(screen.getByText('Remove Resource Pool?')).toBeInTheDocument();
    expect(screen.getByText('Remove the "Rage" resource pool?')).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();

    // Click Cancel
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Remove Resource Pool?')).not.toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();

    // Click delete again and confirm
    fireEvent.click(deleteBtns[0]);
    const confirmBtn = screen.getByRole('button', { name: 'Remove' });
    fireEvent.click(confirmBtn);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith({
      resourcePools: JSON.stringify([
        { name: 'Ki Points', current: 2, max: 4, reset: 'short' },
        { name: 'Grit', current: 1, max: 2, reset: 'none' },
      ]),
    });
  });

  // 7. handleResetPool resets current to max
  it('resets a pool current value to max when reset button is clicked', () => {
    const onUpdate = vi.fn();
    render(
      <ResourcePoolsSection
        character={sampleCharacter}
        isSyncing={false}
        onUpdate={onUpdate}
      />
    );

    // Click reset for Rage (current 1, max 3)
    const resetBtn = screen.getAllByTitle('Reset Tracker to Max')[0];
    fireEvent.click(resetBtn);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith({
      resourcePools: JSON.stringify([
        { name: 'Rage', current: 3, max: 3, reset: 'long' },
        { name: 'Ki Points', current: 2, max: 4, reset: 'short' },
        { name: 'Grit', current: 1, max: 2, reset: 'none' },
      ]),
    });
  });

  // 8. Regression test: PipTracker should be read-only when isSyncing=true
  it('does not call onUpdate when clicking pips if isSyncing=true', () => {
    const onUpdate = vi.fn();
    render(
      <ResourcePoolsSection
        character={sampleCharacter}
        isSyncing={true}
        onUpdate={onUpdate}
      />
    );

    // Rage has current=1. Pip 1 (index 0) is filled.
    const ragePip1 = screen.getByTitle('Rage 1');
    fireEvent.click(ragePip1);

    expect(onUpdate).not.toHaveBeenCalled();
  });
});
