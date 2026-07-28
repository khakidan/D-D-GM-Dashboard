import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { toast } from 'sonner';
import { CharacterCardExpanded } from '../CharacterCardExpanded';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

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



  it('calculates saving throw DC with multiple dcAbilities in PC context', () => {
    const onUpdateMock = vi.fn();
    const mockAbilityScores = { STR: 15, DEX: 16, CON: 10, INT: 10, WIS: 10, CHA: 10 };
    const pcCharacter = {
      ...defaultCharacter,
      gmControlled: true,
      abilityScores: JSON.stringify(mockAbilityScores),
      level: 5, // +3 prof
      actions: JSON.stringify([{ 
        name: 'Breath', 
        description: 'Fire!', 
        dcAbilities: ['STR', 'DEX'] // DC = 8 + 3 + (2) + (3) = 16
      }]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // Click Auto-fill
    const autoFillBtn = screen.getByRole('button', { name: /auto-fill dc/i });
    fireEvent.click(autoFillBtn);

    expect(onUpdateMock).toHaveBeenCalled();
    const updatedActions = JSON.parse(onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0].actions);
    expect(updatedActions[0].saveDC).toBe(16);
  });

  it('calculates attack bonus with atkAbility in PC context', () => {
    const onUpdateMock = vi.fn();
    const mockAbilityScores = { STR: 18, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }; // STR +4
    const pcCharacter = {
      ...defaultCharacter,
      gmControlled: true,
      abilityScores: JSON.stringify(mockAbilityScores),
      level: 5, // +3 prof
      actions: JSON.stringify([{ 
        name: 'Greatsword', 
        description: 'Slash!', 
        atkAbility: 'STR' // Attack Bonus = 3 + 4 = 7
      }]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // Click Auto-fill Atk
    const autoFillBtn = screen.getByRole('button', { name: 'Auto-fill Atk' });
    fireEvent.click(autoFillBtn);

    expect(onUpdateMock).toHaveBeenCalled();
    const updatedActions = JSON.parse(onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0].actions);
    expect(updatedActions[0].attackBonus).toBe(7);
  });

  it('calculates damage bonus with STR ability in PC context', () => {
    const onUpdateMock = vi.fn();
    const mockAbilityScores = { STR: 16, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }; // STR +3
    const pcCharacter = {
      ...defaultCharacter,
      gmControlled: true,
      abilityScores: JSON.stringify(mockAbilityScores),
      actions: JSON.stringify([{ 
        name: 'Greatsword', 
        description: 'Slash!', 
        damageComponents: [{ dice: '2d6', type: 'slashing', _key: 'row1' }]
      }]),
    };

    const { rerender } = render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // 1. Reveal row's ability picker
    const toggleBtn = screen.getByTitle('Toggle Ability Bonus Modifier');
    fireEvent.click(toggleBtn);

    // 2. Select STR inside the row container
    const rowContainer = screen.getByTestId('char-card-action-0-dmg-row-0');
    const strBtn = within(rowContainer).getByRole('button', { name: 'STR' });
    fireEvent.click(strBtn);

    expect(onUpdateMock).toHaveBeenCalled();
    let updatedActions = JSON.parse(onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0].actions);
    expect(updatedActions[0].damageComponents[0].bonusAbility).toBe('STR');

    // 3. Rerender with updated actions containing bonusAbility: STR
    onUpdateMock.mockClear();
    const pcCharacterWithAbility = {
      ...pcCharacter,
      actions: JSON.stringify(updatedActions)
    };

    rerender(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacterWithAbility}
        onUpdate={onUpdateMock}
      />
    );

    // 4. Click Auto button (should now be enabled since bonusAbility is set) inside the row container
    const updatedRowContainer = screen.getByTestId('char-card-action-0-dmg-row-0');
    const autoBtn = within(updatedRowContainer).getByRole('button', { name: /Auto/i });
    expect(autoBtn).not.toBeDisabled();
    fireEvent.click(autoBtn);

    expect(onUpdateMock).toHaveBeenCalled();
    updatedActions = JSON.parse(onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0].actions);
    expect(updatedActions[0].damageComponents[0].bonus).toBe(3); // +3 STR modifier only, no proficiency bonus
  });

  it('fires toast when ability score change causes stale auto-computed values, and clicking Recalculate recalculates and calls onUpdate', () => {
    vi.mocked(toast).mockClear();
    const onUpdateMock = vi.fn();
    const pcCharacter = {
      ...defaultCharacter,
      level: 1, // +2 prof bonus
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      actions: JSON.stringify([{
        name: 'Slash',
        description: 'Attack',
        atkAbility: 'STR',
        atkAutoComputed: true,
        attackBonus: 2, // STR 10 (mod 0) + prof 2 = 2. Currently NOT stale.
      }]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // Edit STR score to 14 (mod +2) -> new computed attack bonus = 2 + 2 = 4 (stale!)
    const strInput = screen.getByLabelText('STR score');
    fireEvent.change(strInput, { target: { value: '14' } });
    fireEvent.blur(strInput);

    expect(toast).toHaveBeenCalledWith(
      '1 action value is out of date.',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Recalculate',
          onClick: expect.any(Function),
        }),
      })
    );

    // Call the Recalculate action's onClick handler
    const toastCall = vi.mocked(toast).mock.calls.find(call => call[0] === '1 action value is out of date.');
    const actionObj = (toastCall?.[1] as any)?.action;
    actionObj.onClick();

    expect(onUpdateMock).toHaveBeenCalled();
    const lastCall = onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0];
    const recalculatedActions = JSON.parse(lastCall.actions);
    expect(recalculatedActions[0].attackBonus).toBe(4);
  });

  it('does NOT fire toast when ability score change does not create stale values', () => {
    vi.mocked(toast).mockClear();
    const onUpdateMock = vi.fn();
    const pcCharacter = {
      ...defaultCharacter,
      actions: '[]',
      reactions: '[]',
      bonusActions: '[]',
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    const strInput = screen.getByLabelText('STR score');
    fireEvent.change(strInput, { target: { value: '14' } });
    fireEvent.blur(strInput);

    expect(toast).not.toHaveBeenCalled();
  });

  it('fires toast when level change causes stale auto-computed values, and clicking Recalculate recalculates', () => {
    vi.mocked(toast).mockClear();
    const onUpdateMock = vi.fn();
    const pcCharacter = {
      ...defaultCharacter,
      level: 1, // +2 prof bonus
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      actions: JSON.stringify([{
        name: 'Slash',
        description: 'Attack',
        atkAbility: 'STR',
        atkAutoComputed: true,
        attackBonus: 2, // +2 prof bonus
      }]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    const levelInput = screen.getByDisplayValue('1');
    fireEvent.change(levelInput, { target: { value: '5' } }); // level 5 -> +3 prof bonus -> new atkBonus = 3 (stale!)
    fireEvent.blur(levelInput);

    expect(toast).toHaveBeenCalledWith(
      '1 action value is out of date.',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Recalculate',
          onClick: expect.any(Function),
        }),
      })
    );

    const toastCall = vi.mocked(toast).mock.calls.find(call => call[0] === '1 action value is out of date.');
    const actionObj = (toastCall?.[1] as any)?.action;
    actionObj.onClick();

    expect(onUpdateMock).toHaveBeenCalled();
    const lastCall = onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0];
    const recalculatedActions = JSON.parse(lastCall.actions);
    expect(recalculatedActions[0].attackBonus).toBe(3);
  });

  it('skips toast and auto-recalculates immediately in single onUpdate call when autoRefreshMechanics is true', () => {
    vi.mocked(toast).mockClear();
    const onUpdateMock = vi.fn();
    const pcCharacter = {
      ...defaultCharacter,
      level: 1, // +2 prof bonus
      autoRefreshMechanics: true,
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      actions: JSON.stringify([{
        name: 'Slash',
        description: 'Attack',
        atkAbility: 'STR',
        atkAutoComputed: true,
        attackBonus: 2, // STR 10 (mod 0) + prof 2 = 2.
      }]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // Edit STR score to 14 (mod +2) -> new computed attack bonus = 2 + 2 = 4
    const strInput = screen.getByLabelText('STR score');
    fireEvent.change(strInput, { target: { value: '14' } });
    fireEvent.blur(strInput);

    // Should NOT show toast
    expect(toast).not.toHaveBeenCalled();

    // Should call onUpdate ONCE with both abilityScores/proficiencies and recalculated actions
    expect(onUpdateMock).toHaveBeenCalledTimes(1);
    const callArg = onUpdateMock.mock.calls[0][0];
    expect(callArg.abilityScores).toBeDefined();
    const recalculatedActions = JSON.parse(callArg.actions);
    expect(recalculatedActions[0].attackBonus).toBe(4);
  });
});

