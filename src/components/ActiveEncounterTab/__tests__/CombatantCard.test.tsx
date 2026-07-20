import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { CombatantCard } from '../CombatantCard';
import type { Combatant } from '../../../types';
import { makeCombatant } from '../../../test-utils/fixtures/combatantFixtures';

vi.mock('../../../services/dbOperations', () => ({
  updateCharacterDB: vi.fn(),
  updateNpcInstanceConditionsDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn(),
}));

describe('CombatantCard', () => {
  afterEach(() => cleanup());

  const defaultProps = {
    c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC' }),
    isExpanded: false,
    damageInput: '',
    healInput: '',
    currentRound: 1,
    combatStarted: false,
    onDamageInputChange: vi.fn(),
    onHealInputChange: vi.fn(),
    onHealthSubmit: vi.fn(),
    onToggleExpand: vi.fn(),
    onUpdateCombatant: vi.fn(),
    onRemoveCombatant: vi.fn(),
    onToggleSelect: vi.fn(),
  };

  it('renders without crashing for a PC combatant', () => {
    const { container } = render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('PC')).toBeInTheDocument();
  });

  it('renders without crashing for an NPC combatant', () => {
    const props = { ...defaultProps, c: makeCombatant({ id: 'npc1', type: 'npc', name: 'NPC' }) };
    const { container } = render(<CombatantCard {...props} />);
    expect(screen.getByText('NPC')).toBeInTheDocument();
  });

  it('clicking DMG button calls onHealthSubmit with isDamage: true', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} damageInput="10" onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /DMG/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it('clicking HEAL button calls onHealthSubmit with isDamage: false', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} healInput="5" onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /HEAL/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(false, expect.any(Object));
  });

  it('renders a ghost "+" button when tempHp is 0 or undefined', () => {
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempHp: 0 })
    };
    render(<CombatantCard {...props} />);
    expect(screen.getByTestId('add-temphp-ghost')).toBeInTheDocument();
    expect(screen.queryByTestId('temphp-pill')).not.toBeInTheDocument();
  });

  it('renders a temp HP pill when tempHp > 0', () => {
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempHp: 5 })
    };
    render(<CombatantCard {...props} />);
    expect(screen.getByTestId('temphp-pill')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByTestId('add-temphp-ghost')).not.toBeInTheDocument();
  });

  it('clicking the ghost "+" button opens the stepper and allows adjusting tempHp', () => {
    const onUpdateCombatant = vi.fn();
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempHp: 0 }),
      onUpdateCombatant,
    };
    render(<CombatantCard {...props} />);
    
    // Click ghost +
    fireEvent.click(screen.getByTestId('add-temphp-ghost'));
    
    // Stepper should be open
    expect(screen.getByTestId('temphp-stepper-container')).toBeInTheDocument();
    
    // Click increment
    fireEvent.click(screen.getByTestId('temphp-increment'));
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempHp: 1 });
    
    // Input should have value 0 (from the initial prop)
    const input = screen.getByTestId('temphp-input') as HTMLInputElement;
    expect(input.value).toBe('0');
    
    // Manually change input value
    fireEvent.change(input, { target: { value: '8' } });
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempHp: 8 });
  });

  it('clicking the tempHp pill opens the stepper and allows decrementing tempHp', () => {
    const onUpdateCombatant = vi.fn();
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempHp: 5 }),
      onUpdateCombatant,
    };
    render(<CombatantCard {...props} />);
    
    // Click pill
    fireEvent.click(screen.getByTestId('temphp-pill'));
    
    // Click decrement
    fireEvent.click(screen.getByTestId('temphp-decrement'));
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempHp: 4 });
    
    // Click Done button closes the stepper
    fireEvent.click(screen.getByTestId('temphp-done'));
    expect(screen.queryByTestId('temphp-stepper-container')).not.toBeInTheDocument();
  });

  it('renders a ghost "+" button for AC when tempAcModifier is 0 or undefined', () => {
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempAcModifier: 0, ac: 15 })
    };
    render(<CombatantCard {...props} />);
    expect(screen.getByTestId('add-tempac-ghost')).toBeInTheDocument();
    expect(screen.queryByTestId('tempac-pill')).not.toBeInTheDocument();
    expect(screen.getByText('(AC 15')).toBeInTheDocument();
  });

  it('renders a temp AC modifier pill when tempAcModifier is non-zero', () => {
    const propsPositive = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempAcModifier: 2, ac: 15 })
    };
    const { unmount } = render(<CombatantCard {...propsPositive} />);
    expect(screen.getByTestId('tempac-pill')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.queryByTestId('add-tempac-ghost')).not.toBeInTheDocument();
    unmount();

    const propsNegative = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempAcModifier: -2, ac: 15 })
    };
    render(<CombatantCard {...propsNegative} />);
    expect(screen.getByTestId('tempac-pill')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(screen.queryByTestId('add-tempac-ghost')).not.toBeInTheDocument();
  });

  it('clicking the ghost "+" AC button opens the stepper and allows adjusting tempAcModifier', () => {
    const onUpdateCombatant = vi.fn();
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempAcModifier: 0, ac: 15 }),
      onUpdateCombatant,
    };
    render(<CombatantCard {...props} />);
    
    // Click ghost +
    fireEvent.click(screen.getByTestId('add-tempac-ghost'));
    
    // Stepper should be open
    expect(screen.getByTestId('tempac-stepper-container')).toBeInTheDocument();
    
    // Click increment
    fireEvent.click(screen.getByTestId('tempac-increment'));
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempAcModifier: 1 });
    
    // Input should have value 0
    const input = screen.getByTestId('tempac-input') as HTMLInputElement;
    expect(input.value).toBe('0');
    
    // Manually change input value
    fireEvent.change(input, { target: { value: '4' } });
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempAcModifier: 4 });
  });

  it('clicking the tempAcModifier pill opens the stepper and allows decrementing into negative values', () => {
    const onUpdateCombatant = vi.fn();
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempAcModifier: 0, ac: 15 }),
      onUpdateCombatant,
    };
    render(<CombatantCard {...props} />);
    
    // Click ghost + to open stepper
    fireEvent.click(screen.getByTestId('add-tempac-ghost'));
    
    // Click decrement (goes into negative)
    fireEvent.click(screen.getByTestId('tempac-decrement'));
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempAcModifier: -1 });
    
    // Click Done button closes the stepper
    fireEvent.click(screen.getByTestId('tempac-done'));
    expect(screen.queryByTestId('tempac-stepper-container')).not.toBeInTheDocument();
  });
});
