import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { ResourcePoolManager } from '../ResourcePoolManager';
import '@testing-library/jest-dom/vitest';

describe('ResourcePoolManager Component', () => {
  afterEach(() => {
    cleanup();
  });

  // 1. Render empty state
  it('should render empty state message when there are no pools and no class is entered', () => {
    render(
      <ResourcePoolManager
        pools={[]}
        onChange={vi.fn()}
        characterClass=""
      />
    );
    expect(screen.getByText(/No class entered. Add resource pools manually below/i)).toBeInTheDocument();
    expect(screen.getByText(/No resource pools yet. Click '\+ Add Resource' to add class abilities/i)).toBeInTheDocument();
  });

  // 2. Render existing pools
  it('should render list of existing resource pools with correct names and current/max values', () => {
    const pools = [
      { name: 'Rage', current: 2, max: 3, reset: 'long' as const },
      { name: 'Ki Points', current: 4, max: 4, reset: 'short' as const }
    ];
    render(
      <ResourcePoolManager
        pools={pools}
        onChange={vi.fn()}
        characterClass="Fighter"
      />
    );
    expect(screen.getByText('Rage')).toBeInTheDocument();
    expect(screen.getByText('LR')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    expect(screen.getByText('Ki Points')).toBeInTheDocument();
    expect(screen.getByText('SR')).toBeInTheDocument();
    expect(screen.getByText('4 / 4')).toBeInTheDocument();
  });

  // 3. Add a new custom resource pool
  it('should allow adding a new custom resource pool', () => {
    const onChange = vi.fn();
    const onCustomized = vi.fn();
    render(
      <ResourcePoolManager
        pools={[]}
        onChange={onChange}
        characterClass="Wizard"
        onCustomized={onCustomized}
      />
    );

    // Click "+ Add Resource" button
    const addButton = screen.getByRole('button', { name: /Add Resource/i });
    fireEvent.click(addButton);

    // Get input fields
    const nameInput = screen.getByPlaceholderText('e.g. Rage, Ki Points');
    const maxInput = screen.getByDisplayValue('3');
    const resetSelect = screen.getByRole('combobox');

    // Fill out form
    fireEvent.change(nameInput, { target: { value: 'Arcane Recovery' } });
    fireEvent.change(maxInput, { target: { value: '1' } });
    fireEvent.change(resetSelect, { target: { value: 'short' } });

    // Click "Add" button
    const submitButton = screen.getByRole('button', { name: /^Add$/i });
    fireEvent.click(submitButton);

    expect(onCustomized).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith([
      { name: 'Arcane Recovery', current: 1, max: 1, reset: 'short' }
    ]);
  });

  // 4. Edit an existing resource pool
  it("should allow editing an existing resource pool's name, max uses, and reset cycle", () => {
    const onChange = vi.fn();
    const onCustomized = vi.fn();
    const pools = [
      { name: 'Rage', current: 2, max: 2, reset: 'long' as const }
    ];

    render(
      <ResourcePoolManager
        pools={pools}
        onChange={onChange}
        characterClass="Barbarian"
        onCustomized={onCustomized}
      />
    );

    // Click "Edit" icon button
    const editButton = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    // Inputs should appear
    const nameInput = screen.getByDisplayValue('Rage');
    const maxInput = screen.getByDisplayValue('2');
    const resetSelect = screen.getByRole('combobox');

    expect(nameInput).toHaveValue('Rage');
    expect(maxInput).toHaveValue(2);
    expect(resetSelect).toHaveValue('long');

    // Change values
    fireEvent.change(nameInput, { target: { value: 'Super Rage' } });
    fireEvent.change(maxInput, { target: { value: '4' } });
    fireEvent.change(resetSelect, { target: { value: 'short' } });

    // Click Save
    const saveButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveButton);

    expect(onCustomized).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith([
      { name: 'Super Rage', current: 2, max: 4, reset: 'short' }
    ]);
  });

  // 5. Delete an existing resource pool
  it('should allow deleting an existing resource pool', () => {
    const onChange = vi.fn();
    const onCustomized = vi.fn();
    const pools = [
      { name: 'Rage', current: 2, max: 2, reset: 'long' as const }
    ];

    render(
      <ResourcePoolManager
        pools={pools}
        onChange={onChange}
        characterClass="Barbarian"
        onCustomized={onCustomized}
      />
    );

    // Click "Delete" button
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);

    expect(onCustomized).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith([]);
  });

  // 6. Casing regression check for lowercase 'barbarian'
  it("should render class-specific suggested pools helper text for lowercase class name like 'barbarian'", () => {
    render(
      <ResourcePoolManager
        pools={[]}
        onChange={vi.fn()}
        characterClass="barbarian"
      />
    );

    // Confirm that the "Suggested pools for barbarian." text renders
    expect(screen.getByText(/Suggested pools for barbarian\. Adjust max values to match your character\./i)).toBeInTheDocument();
    
    // Confirm that the fallback text "No suggested resource pools for 'barbarian'" is NOT rendered
    expect(screen.queryByText(/No suggested resource pools for 'barbarian'/i)).not.toBeInTheDocument();
  });
});
