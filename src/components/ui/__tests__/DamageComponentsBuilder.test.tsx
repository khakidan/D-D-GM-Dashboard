import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { DamageComponentsBuilder } from '../DamageComponentsBuilder';
import { compileDamageComponents } from '../../../lib/automation';
import { AbilityScores } from '../../../lib/abilityScores';
import { DamageComponent } from '../../../types';

describe('DamageComponentsBuilder', () => {
  afterEach(() => cleanup());

  const mockAbilityScores: AbilityScores = {
    STR: 18, // +4
    DEX: 14, // +2
    CON: 10, // +0
    INT: 8,  // -1
    WIS: 12, // +1
    CHA: 16, // +3
  };

  it('renders correct number of rows and inputs', () => {
    const components: DamageComponent[] = [
      { dice: '2d6', type: 'fire', _key: 'row1' },
      { dice: '1d8', type: 'cold', _key: 'row2' },
    ];
    const onChange = vi.fn();

    render(
      <DamageComponentsBuilder
        idPrefix="test-action"
        components={components}
        onChange={onChange}
        abilityScores={mockAbilityScores}
      />
    );

    const dice1 = screen.getByLabelText('Damage dice for row 0') as HTMLInputElement;
    const dice2 = screen.getByLabelText('Damage dice for row 1') as HTMLInputElement;
    expect(dice1).toBeInTheDocument();
    expect(dice1.value).toBe('2d6');
    expect(dice2).toBeInTheDocument();
    expect(dice2.value).toBe('1d8');
  });

  it('allows adding a row', () => {
    const components: DamageComponent[] = [
      { dice: '2d6', type: 'fire', _key: 'row1' },
    ];
    const onChange = vi.fn();

    render(
      <DamageComponentsBuilder
        idPrefix="test-action"
        components={components}
        onChange={onChange}
        abilityScores={mockAbilityScores}
      />
    );

    const addBtn = screen.getByRole('button', { name: /Add Type/i });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);

    expect(onChange).toHaveBeenCalled();
    const calledWith = onChange.mock.calls[0][0];
    expect(calledWith.length).toBe(2);
    expect(calledWith[0]).toEqual({ dice: '2d6', type: 'fire', _key: 'row1' });
    expect(calledWith[1].dice).toBe('');
    expect(typeof calledWith[1]._key).toBe('string');
  });

  it('allows removing a row', () => {
    const components: DamageComponent[] = [
      { dice: '2d6', type: 'fire', _key: 'row1' },
      { dice: '1d8', type: 'cold', _key: 'row2' },
    ];
    const onChange = vi.fn();

    render(
      <DamageComponentsBuilder
        idPrefix="test-action"
        components={components}
        onChange={onChange}
        abilityScores={mockAbilityScores}
      />
    );

    const row1Container = screen.getByTestId('test-action-dmg-row-0');
    const removeBtn = within(row1Container).getByTitle('Remove damage component');
    expect(removeBtn).toBeInTheDocument();
    fireEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalled();
    const calledWith = onChange.mock.calls[0][0];
    expect(calledWith.length).toBe(1);
    expect(calledWith[0].dice).toBe('1d8');
  });

  it('enforces mutual exclusivity of ability selection and bonus clearing across rows', () => {
    const components: DamageComponent[] = [
      { dice: '2d6', type: 'fire', bonus: 4, bonusAbility: 'STR', _key: 'row1' },
      { dice: '1d8', type: 'cold', _key: 'row2' },
    ];
    const onChange = vi.fn();

    render(
      <DamageComponentsBuilder
        idPrefix="test-action"
        components={components}
        onChange={onChange}
        abilityScores={mockAbilityScores}
      />
    );

    const toggleBtns = screen.getAllByTitle('Toggle Ability Bonus Modifier');
    fireEvent.click(toggleBtns[1]); // Reveal row 2's picker

    const row2Container = screen.getByTestId('test-action-dmg-row-1');
    const dexBtn = within(row2Container).getByRole('button', { name: 'DEX' });
    expect(dexBtn).toBeInTheDocument();
    fireEvent.click(dexBtn);

    expect(onChange).toHaveBeenCalled();
    const calledWith = onChange.mock.calls[0][0];
    expect(calledWith[0].bonusAbility).toBeUndefined();
    expect(calledWith[0].bonus).toBeUndefined();
    expect(calledWith[1].bonusAbility).toBe('DEX');
  });

  it('Auto button is disabled without ability selected, and computes modifier-only correctly when clicked', () => {
    const components: DamageComponent[] = [
      { dice: '2d6', type: 'fire', _key: 'row1' },
    ];
    const onChange = vi.fn();

    const { rerender } = render(
      <DamageComponentsBuilder
        idPrefix="test-action"
        components={components}
        onChange={onChange}
        abilityScores={mockAbilityScores}
      />
    );

    const toggleBtn = screen.getByTitle('Toggle Ability Bonus Modifier');
    fireEvent.click(toggleBtn);

    const autoBtn = screen.getByRole('button', { name: /Auto/i });
    expect(autoBtn).toBeDisabled();

    const componentsWithAbility: DamageComponent[] = [
      { dice: '2d6', type: 'fire', bonusAbility: 'STR', _key: 'row1' },
    ];
    rerender(
      <DamageComponentsBuilder
        idPrefix="test-action"
        components={componentsWithAbility}
        onChange={onChange}
        abilityScores={mockAbilityScores}
      />
    );

    expect(autoBtn).not.toBeDisabled();
    fireEvent.click(autoBtn);

    expect(onChange).toHaveBeenCalled();
    const calledWith = onChange.mock.calls[0][0];
    expect(calledWith[0].bonus).toBe(4);
    expect(calledWith[0].bonusAutoComputed).toBe(true);

    // Type in bonus manually
    const bonusInput = screen.getByLabelText('Damage bonus for row 0') as HTMLInputElement;
    fireEvent.change(bonusInput, { target: { value: '5' } });
    
    expect(onChange).toHaveBeenCalledTimes(2);
    const calledWithManual = onChange.mock.calls[1][0];
    expect(calledWithManual[0].bonus).toBe(5);
    expect(calledWithManual[0].bonusAutoComputed).toBe(false);
  });

  it('compiles damage components into correct string formats', () => {
    expect(compileDamageComponents([
      { dice: '2d6', type: 'fire', bonus: 4 }
    ])).toBe('2d6+4 fire');

    expect(compileDamageComponents([
      { dice: '1d10', type: 'slashing', bonus: -1 }
    ])).toBe('1d10-1 slashing');

    expect(compileDamageComponents([
      { dice: '14d8', type: 'cold' },
      { dice: '10d8', type: 'poison' },
      { dice: '6d8', type: 'necrotic' }
    ])).toBe('14d8 cold & 10d8 poison & 6d8 necrotic');
  });

  it('renders per-row stale indicator when bonusAutoComputed is true and stored bonus is stale', () => {
    const components: DamageComponent[] = [
      { dice: '2d6', type: 'fire', bonus: 2, bonusAbility: 'STR', bonusAutoComputed: true, _key: 'row1' }, // STR mod is +4, so bonus 2 is stale
    ];
    const onChange = vi.fn();

    const { rerender } = render(
      <DamageComponentsBuilder
        idPrefix="test-action"
        components={components}
        onChange={onChange}
        abilityScores={mockAbilityScores}
      />
    );

    const toggleBtn = screen.getByTitle('Toggle Ability Bonus Modifier');
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('stale-indicator')).toBeInTheDocument();

    // Rerender with bonus = 4 (fresh)
    const freshComponents: DamageComponent[] = [
      { dice: '2d6', type: 'fire', bonus: 4, bonusAbility: 'STR', bonusAutoComputed: true, _key: 'row1' },
    ];
    rerender(
      <DamageComponentsBuilder
        idPrefix="test-action"
        components={freshComponents}
        onChange={onChange}
        abilityScores={mockAbilityScores}
      />
    );

    expect(screen.queryByTestId('stale-indicator')).not.toBeInTheDocument();
  });
});
