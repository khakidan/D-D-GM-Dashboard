import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { NpcCombatActionFields } from '../NpcCombatActionFields';
import { DEFAULT_ABILITY_SCORES } from '../../../lib/abilityScores';
import '@testing-library/jest-dom/vitest';

describe('NpcCombatActionFields Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders correctly with basic non-typed props and triggers text callbacks', () => {
    const onNameChange = vi.fn();
    const onDescriptionChange = vi.fn();
    const onDamageChange = vi.fn();
    const onSaveTypeChange = vi.fn();

    render(
      <NpcCombatActionFields
        idPrefix="test"
        name="Claw"
        onNameChange={onNameChange}
        namePlaceholder="Action name"
        attackBonus={undefined}
        onAttackBonusChange={vi.fn()}
        damage="2d6+3"
        onDamageChange={onDamageChange}
        saveDC={undefined}
        onSaveDCChange={vi.fn()}
        saveType="Dex"
        onSaveTypeChange={onSaveTypeChange}
        description="Scratches the target."
        onDescriptionChange={onDescriptionChange}
        descriptionRows={3}
        abilityScores={DEFAULT_ABILITY_SCORES}
        proficiencyBonus={2}
      />
    );

    // Verify name field rendering
    expect(screen.getByText('Name')).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText('Action name');
    expect(nameInput).toHaveValue('Claw');
    fireEvent.change(nameInput, { target: { value: 'Bite' } });
    expect(onNameChange).toHaveBeenCalledWith('Bite');

    // Verify damage field rendering
    const damageInput = screen.getByPlaceholderText('2d8+5 fire');
    expect(damageInput).toHaveValue('2d6+3');
    fireEvent.change(damageInput, { target: { value: '2d8+3' } });
    expect(onDamageChange).toHaveBeenCalledWith('2d8+3');

    // Verify save type field rendering
    const saveTypeInput = screen.getByPlaceholderText('Con');
    expect(saveTypeInput).toHaveValue('Dex');
    fireEvent.change(saveTypeInput, { target: { value: 'Con' } });
    expect(onSaveTypeChange).toHaveBeenCalledWith('Con');

    // Verify description field rendering
    const descriptionTextarea = screen.getByPlaceholderText('Description');
    expect(descriptionTextarea).toHaveValue('Scratches the target.');
    fireEvent.change(descriptionTextarea, { target: { value: 'Bites the target.' } });
    fireEvent.blur(descriptionTextarea);
    expect(onDescriptionChange).toHaveBeenCalledWith('Bites the target.');
  });

  it('renders Action recharge and range fields when recharge and rangeValue props are provided', () => {
    const onRechargeChange = vi.fn();
    const onRangeValueChange = vi.fn();

    render(
      <NpcCombatActionFields
        idPrefix="test-action"
        name="Fire Breath"
        onNameChange={vi.fn()}
        namePlaceholder="Action name"
        attackBonus={undefined}
        onAttackBonusChange={vi.fn()}
        damage={undefined}
        onDamageChange={vi.fn()}
        saveDC={15}
        onSaveDCChange={vi.fn()}
        saveType="Dex"
        onSaveTypeChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        descriptionRows={2}
        recharge="Recharge 5–6"
        onRechargeChange={onRechargeChange}
        rangeValue="15 ft. cone"
        onRangeValueChange={onRangeValueChange}
        abilityScores={DEFAULT_ABILITY_SCORES}
        proficiencyBonus={2}
      />
    );

    // Recharge field (with label)
    expect(screen.getByText('Recharge')).toBeInTheDocument();
    const rechargeInput = screen.getByPlaceholderText('e.g. Recharge 5–6');
    expect(rechargeInput).toHaveValue('Recharge 5–6');
    fireEvent.change(rechargeInput, { target: { value: 'Recharge 6' } });
    expect(onRechargeChange).toHaveBeenCalledWith('Recharge 6');

    // Emptied recharge should fall back to undefined
    fireEvent.change(rechargeInput, { target: { value: '' } });
    expect(onRechargeChange).toHaveBeenLastCalledWith(undefined);

    // Range field
    const rangeInput = screen.getByPlaceholderText('reach 10 ft. / 30 ft. cone');
    expect(rangeInput).toHaveValue('15 ft. cone');
    fireEvent.change(rangeInput, { target: { value: '30 ft. line' } });
    expect(onRangeValueChange).toHaveBeenCalledWith('30 ft. line');
  });

  it('renders Legendary Action cost field when cost prop is provided', () => {
    const onCostChange = vi.fn();

    render(
      <NpcCombatActionFields
        idPrefix="test-legendary"
        name="Tail Sweep"
        onNameChange={vi.fn()}
        namePlaceholder="Action name"
        attackBonus={undefined}
        onAttackBonusChange={vi.fn()}
        damage={undefined}
        onDamageChange={vi.fn()}
        saveDC={14}
        onSaveDCChange={vi.fn()}
        saveType="Dex"
        onSaveTypeChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        descriptionRows={2}
        cost={2}
        onCostChange={onCostChange}
        abilityScores={DEFAULT_ABILITY_SCORES}
        proficiencyBonus={2}
      />
    );

    // Cost label and input
    expect(screen.getByText('Cost')).toBeInTheDocument();
    const costInput = screen.getByPlaceholderText('Cost (1-3)');
    expect(costInput).toHaveValue(2);

    fireEvent.change(costInput, { target: { value: '3' } });
    expect(onCostChange).toHaveBeenCalledWith(3);
  });

  it('falls back to undefined when Atk or DC fields are emptied', () => {
    const onAttackBonusChange = vi.fn();
    const onSaveDCChange = vi.fn();

    render(
      <NpcCombatActionFields
        idPrefix="test-numeric"
        name="Claw"
        onNameChange={vi.fn()}
        namePlaceholder="Action name"
        attackBonus={5}
        onAttackBonusChange={onAttackBonusChange}
        damage={undefined}
        onDamageChange={vi.fn()}
        saveDC={13}
        onSaveDCChange={onSaveDCChange}
        saveType={undefined}
        onSaveTypeChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        descriptionRows={2}
        abilityScores={DEFAULT_ABILITY_SCORES}
        proficiencyBonus={2}
      />
    );

    const attackInput = screen.getByPlaceholderText('+N');
    expect(attackInput).toHaveValue(5);
    fireEvent.change(attackInput, { target: { value: '' } });
    expect(onAttackBonusChange).toHaveBeenCalledWith(undefined);

    const dcInput = screen.getByPlaceholderText('DC');
    expect(dcInput).toHaveValue(13);
    fireEvent.change(dcInput, { target: { value: '' } });
    expect(onSaveDCChange).toHaveBeenCalledWith(undefined);
  });

  it('falls back to 1 when Cost field is emptied', () => {
    const onCostChange = vi.fn();

    render(
      <NpcCombatActionFields
        idPrefix="test-cost-fallback"
        name="Bite"
        onNameChange={vi.fn()}
        namePlaceholder="Action name"
        attackBonus={undefined}
        onAttackBonusChange={vi.fn()}
        damage={undefined}
        onDamageChange={vi.fn()}
        saveDC={undefined}
        onSaveDCChange={vi.fn()}
        saveType={undefined}
        onSaveTypeChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        descriptionRows={2}
        cost={2}
        onCostChange={onCostChange}
        abilityScores={DEFAULT_ABILITY_SCORES}
        proficiencyBonus={2}
      />
    );

    const costInput = screen.getByPlaceholderText('Cost (1-3)');
    expect(costInput).toHaveValue(2);

    // Empty string is passed
    fireEvent.change(costInput, { target: { value: '' } });
    expect(onCostChange).toHaveBeenCalledWith(1);
  });

  it('renders custom secondaryField and range elements when provided and no typed props are set', () => {
    render(
      <NpcCombatActionFields
        idPrefix="test-custom"
        name="Claw"
        onNameChange={vi.fn()}
        namePlaceholder="Action name"
        attackBonus={undefined}
        onAttackBonusChange={vi.fn()}
        damage={undefined}
        onDamageChange={vi.fn()}
        saveDC={undefined}
        onSaveDCChange={vi.fn()}
        saveType={undefined}
        onSaveTypeChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        descriptionRows={2}
        secondaryField={<div>Custom Secondary</div>}
        range={<div>Custom Range Node</div>}
        abilityScores={DEFAULT_ABILITY_SCORES}
        proficiencyBonus={2}
      />
    );

    expect(screen.getByText('Custom Secondary')).toBeInTheDocument();
    expect(screen.getByText('Custom Range Node')).toBeInTheDocument();
  });

  it('renders usage tracking fields when showUsageTracking is true and triggers callbacks', () => {
    const onMaxUsesChange = vi.fn();
    const onUsesResetChange = vi.fn();

    render(
      <NpcCombatActionFields
        idPrefix="test-tracking"
        name="Claw"
        onNameChange={vi.fn()}
        namePlaceholder="Action name"
        attackBonus={undefined}
        onAttackBonusChange={vi.fn()}
        damage={undefined}
        onDamageChange={vi.fn()}
        saveDC={undefined}
        onSaveDCChange={vi.fn()}
        saveType={undefined}
        onSaveTypeChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        descriptionRows={2}
        showUsageTracking={true}
        maxUses={3}
        onMaxUsesChange={onMaxUsesChange}
        usesReset="short"
        onUsesResetChange={onUsesResetChange}
        abilityScores={DEFAULT_ABILITY_SCORES}
        proficiencyBonus={2}
      />
    );

    // Verify fields are rendered
    expect(screen.getByTestId('pc-usage-tracking-fields')).toBeInTheDocument();
    expect(screen.getByText('Max Uses')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();

    const maxUsesInput = screen.getByLabelText('Max Uses');
    expect(maxUsesInput).toHaveValue(3);

    fireEvent.change(maxUsesInput, { target: { value: '5' } });
    expect(onMaxUsesChange).toHaveBeenCalledWith(5);

    fireEvent.change(maxUsesInput, { target: { value: '' } });
    expect(onMaxUsesChange).toHaveBeenLastCalledWith(undefined);

    const resetSelect = screen.getByLabelText('Reset');
    expect(resetSelect).toHaveValue('short');

    fireEvent.change(resetSelect, { target: { value: 'long' } });
    expect(onUsesResetChange).toHaveBeenCalledWith('long');

    fireEvent.change(resetSelect, { target: { value: 'none' } });
    expect(onUsesResetChange).toHaveBeenLastCalledWith(undefined);
  });

  it('does not render usage tracking fields when showUsageTracking is false or undefined', () => {
    const { rerender } = render(
      <NpcCombatActionFields
        idPrefix="test-tracking-absent"
        name="Claw"
        onNameChange={vi.fn()}
        namePlaceholder="Action name"
        attackBonus={undefined}
        onAttackBonusChange={vi.fn()}
        damage={undefined}
        onDamageChange={vi.fn()}
        saveDC={undefined}
        onSaveDCChange={vi.fn()}
        saveType={undefined}
        onSaveTypeChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        descriptionRows={2}
        showUsageTracking={false}
        maxUses={3}
        onMaxUsesChange={vi.fn()}
        usesReset="short"
        onUsesResetChange={vi.fn()}
        abilityScores={DEFAULT_ABILITY_SCORES}
        proficiencyBonus={2}
      />
    );

    expect(screen.queryByTestId('pc-usage-tracking-fields')).not.toBeInTheDocument();
    expect(screen.queryByText('Max Uses')).not.toBeInTheDocument();
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();

    // Rerender with undefined showUsageTracking
    rerender(
      <NpcCombatActionFields
        idPrefix="test-tracking-absent"
        name="Claw"
        onNameChange={vi.fn()}
        namePlaceholder="Action name"
        attackBonus={undefined}
        onAttackBonusChange={vi.fn()}
        damage={undefined}
        onDamageChange={vi.fn()}
        saveDC={undefined}
        onSaveDCChange={vi.fn()}
        saveType={undefined}
        onSaveTypeChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        descriptionRows={2}
        maxUses={3}
        onMaxUsesChange={vi.fn()}
        usesReset="short"
        onUsesResetChange={vi.fn()}
        abilityScores={DEFAULT_ABILITY_SCORES}
        proficiencyBonus={2}
      />
    );

    expect(screen.queryByTestId('pc-usage-tracking-fields')).not.toBeInTheDocument();
  });
  
  it('automates DC calculation for multiple abilities', () => {
    const onSaveDCChange = vi.fn();
    const customScores = { ...DEFAULT_ABILITY_SCORES, STR: 18, CHA: 16 }; // Mod +4, +3
    const prof = 4;

    render(
      <NpcCombatActionFields
        idPrefix="test-dc-auto"
        name="Breath"
        onNameChange={vi.fn()}
        namePlaceholder="Action name"
        attackBonus={undefined}
        onAttackBonusChange={vi.fn()}
        damage={undefined}
        onDamageChange={vi.fn()}
        saveDC={12}
        onSaveDCChange={onSaveDCChange}
        saveType="Str"
        onSaveTypeChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        descriptionRows={2}
        abilityScores={customScores}
        proficiencyBonus={prof}
        dcAbilities={['STR', 'CHA']}
        onDcAbilitiesChange={vi.fn()}
      />
    );

    // DC should be 8 + 4 (prof) + 4 (STR mod) + 3 (CHA mod) = 19
    const autoButton = screen.getByLabelText('Auto-fill DC');
    fireEvent.click(autoButton);
    expect(onSaveDCChange).toHaveBeenCalledWith(19);
  });
  
  it('disables auto-fill button when dcAbilities is empty', () => {
    render(
      <NpcCombatActionFields
        idPrefix="test-dc-disabled"
        name="Breath"
        onNameChange={vi.fn()}
        namePlaceholder="Action name"
        attackBonus={undefined}
        onAttackBonusChange={vi.fn()}
        damage={undefined}
        onDamageChange={vi.fn()}
        saveDC={12}
        onSaveDCChange={vi.fn()}
        saveType="Str"
        onSaveTypeChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        descriptionRows={2}
        abilityScores={DEFAULT_ABILITY_SCORES}
        proficiencyBonus={2}
        dcAbilities={[]}
        onDcAbilitiesChange={vi.fn()}
      />
    );
    
    expect(screen.getByLabelText('Auto-fill DC')).toBeDisabled();
  });
});
