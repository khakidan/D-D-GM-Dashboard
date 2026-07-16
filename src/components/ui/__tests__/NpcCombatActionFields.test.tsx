import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { NpcCombatActionFields } from '../NpcCombatActionFields';
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
      />
    );

    // Verify name field rendering
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
      />
    );

    // Recharge field (no label)
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
      />
    );

    expect(screen.getByText('Custom Secondary')).toBeInTheDocument();
    expect(screen.getByText('Custom Range Node')).toBeInTheDocument();
  });
});
