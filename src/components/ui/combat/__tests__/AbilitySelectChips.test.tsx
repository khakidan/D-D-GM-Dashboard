import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AbilitySelectChips } from '../AbilitySelectChips';
import { AbilityName } from '../../../../lib/abilityFundamentals';

describe('AbilitySelectChips', () => {
  afterEach(() => cleanup());

  it('renders all 6 abilities', () => {
    render(<AbilitySelectChips selected={[]} onChange={() => {}} />);
    ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].forEach(ability => {
      expect(screen.getByRole('button', { name: ability })).toBeInTheDocument();
    });
  });

  it('enforces abilitiesInOrder sorting regardless of click order', () => {
    const onChange = vi.fn();
    const { rerender } = render(<AbilitySelectChips selected={[]} onChange={onChange} />);

    // Click CHA
    fireEvent.click(screen.getByRole('button', { name: 'CHA' }));
    expect(onChange).toHaveBeenLastCalledWith(['CHA']);
    
    // Simulate parent state update
    rerender(<AbilitySelectChips selected={['CHA']} onChange={onChange} />);

    // Click STR
    fireEvent.click(screen.getByRole('button', { name: 'STR' }));
    
    // Expect sorted: ['STR', 'CHA']
    expect(onChange).toHaveBeenLastCalledWith(['STR', 'CHA']);
  });

  it('removes selection', () => {
    const onChange = vi.fn();
    render(<AbilitySelectChips selected={['STR', 'WIS']} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'STR' }));
    expect(onChange).toHaveBeenCalledWith(['WIS']);
  });

  it('enforces single selection when singleSelect is true', () => {
    const onChange = vi.fn();
    const { rerender } = render(<AbilitySelectChips selected={[]} onChange={onChange} singleSelect />);

    // Click STR -> selects STR
    fireEvent.click(screen.getByRole('button', { name: 'STR' }));
    expect(onChange).toHaveBeenLastCalledWith(['STR']);

    // Re-render with STR selected
    rerender(<AbilitySelectChips selected={['STR']} onChange={onChange} singleSelect />);

    // Click DEX -> selects DEX and removes STR
    fireEvent.click(screen.getByRole('button', { name: 'DEX' }));
    expect(onChange).toHaveBeenLastCalledWith(['DEX']);

    // Re-render with DEX selected
    rerender(<AbilitySelectChips selected={['DEX']} onChange={onChange} singleSelect />);

    // Click DEX again -> deselects DEX (returns empty array)
    fireEvent.click(screen.getByRole('button', { name: 'DEX' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
