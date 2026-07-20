import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RechargeToastContent } from '../RechargeToastContent';
import { performRechargeRoll } from '../../../lib/diceRoller';

vi.mock('../../../lib/diceRoller', () => ({
  performRechargeRoll: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    dismiss: vi.fn(),
    success: vi.fn(),
  },
}));

describe('RechargeToastContent', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockCombatant = {
    id: 'c1',
    name: 'Young Red Dragon',
    type: 'npc',
    initiative: 12,
    currentHp: 178,
    maxHp: 178,
    ac: 18,
    rechargeAbilities: [
      { name: 'Fire Breath', rechargeOn: 5, isCharged: false },
    ],
  } as any;

  it('renders the unrecharged abilities and action buttons', () => {
    render(
      <RechargeToastContent
        combatant={mockCombatant}
        unrechargedAbilities={mockCombatant.rechargeAbilities}
        toastId="test-toast"
        onUpdateCombatant={vi.fn()}
      />
    );

    expect(screen.getByText('Recharge Roll Reminder: Young Red Dragon')).toBeInTheDocument();
    expect(screen.getByText('Fire Breath')).toBeInTheDocument();
    expect(screen.getByText('Recharges on 5+')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument();
  });

  it('triggers performRechargeRoll and calls onUpdateCombatant when roll is clicked', () => {
    const onUpdateCombatantMock = vi.fn();
    vi.mocked(performRechargeRoll).mockReturnValue({
      rolledNum: 5,
      isSuccess: true,
      updatedAbilities: [
        { name: 'Fire Breath', rechargeOn: 5, isCharged: true },
      ],
    });

    render(
      <RechargeToastContent
        combatant={mockCombatant}
        unrechargedAbilities={mockCombatant.rechargeAbilities}
        toastId="test-toast"
        onUpdateCombatant={onUpdateCombatantMock}
      />
    );

    const rollBtn = screen.getByRole('button', { name: 'Roll' });
    fireEvent.click(rollBtn);

    expect(performRechargeRoll).toHaveBeenCalledWith(mockCombatant.rechargeAbilities, 'Fire Breath');
    expect(onUpdateCombatantMock).toHaveBeenCalledWith('c1', {
      rechargeAbilities: [
        { name: 'Fire Breath', rechargeOn: 5, isCharged: true },
      ],
    });

    expect(screen.queryByRole('button', { name: 'Roll' })).not.toBeInTheDocument();
    expect(screen.getByText('Rolled 5')).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
