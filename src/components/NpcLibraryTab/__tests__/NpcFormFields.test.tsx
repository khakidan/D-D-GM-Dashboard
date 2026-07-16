import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import { NpcFormFields, DEFAULT_NPC_FORM_DATA } from '../../ui/NpcFormFields';
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('NpcFormFields', () => {
  afterEach(() => cleanup());

  it('renders all essential fields', () => {
    const { getByLabelText, getByRole } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={vi.fn()} />);
    
    expect(getByLabelText(/^NPC Name/i)).toBeInTheDocument();
    expect(getByLabelText(/^CR/i)).toBeInTheDocument();

    fireEvent.click(getByRole('tab', { name: 'Combat' }));
    expect(getByLabelText(/^AC\b/i)).toBeInTheDocument();
    expect(getByLabelText(/^Max HP/i)).toBeInTheDocument();
  });

  it('calls onChange when input values change', () => {
    let calledData: any = null;
    const onChange = (data: any) => { calledData = data; };
    const { getByLabelText } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={onChange} />);

    const nameInput = getByLabelText(/^NPC Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test NPC' } });
    
    expect(calledData).not.toBeNull();
    expect(calledData.name).toBe('Test NPC');
  });

  it('supports adding, editing, and deleting actions on the Stat Block tab', () => {
    let currentData = {
      ...DEFAULT_NPC_FORM_DATA,
      actions: JSON.stringify([
        {
          name: 'Bite',
          description: 'Sharp teeth.',
          recharge: 'Recharge 5–6',
          attackBonus: 5,
          damage: '1d6+3',
          saveDC: undefined,
          saveType: undefined,
          range: 'reach 5 ft.',
        }
      ]),
    };
    const onChange = vi.fn((newData) => {
      currentData = newData;
    });

    const { rerender } = render(<NpcFormFields data={currentData} onChange={onChange} />);

    // Go to Stat Block tab
    const statBlockTab = screen.getByRole('tab', { name: 'Stat Block' });
    fireEvent.click(statBlockTab);

    // Verify existing action fields are shown
    const biteInput = screen.getByDisplayValue('Bite');
    expect(biteInput).toBeInTheDocument();

    // Verify "Recharge" field is rendered (placeholder: "e.g. Recharge 5–6") and does NOT have a "Cost" label nearby
    const rechargeInput = screen.getByPlaceholderText('e.g. Recharge 5–6');
    expect(rechargeInput).toHaveValue('Recharge 5–6');
    expect(screen.queryByText('Cost')).not.toBeInTheDocument();

    // Edit recharge
    fireEvent.change(rechargeInput, { target: { value: 'Recharge 6' } });
    expect(onChange).toHaveBeenCalled();
    const parsedActionsAfterEdit = JSON.parse(currentData.actions || '[]');
    expect(parsedActionsAfterEdit[0].recharge).toBe('Recharge 6');

    // Rerender with updated data to simulate controlled state propagation
    rerender(<NpcFormFields data={currentData} onChange={onChange} />);

    // Add new Action
    const addActionBtn = screen.getByRole('button', { name: /Add Action/i });
    fireEvent.click(addActionBtn);

    expect(onChange).toHaveBeenCalled();
    const parsedActionsAfterAdd = JSON.parse(currentData.actions || '[]');
    expect(parsedActionsAfterAdd.length).toBe(2);
    expect(parsedActionsAfterAdd[1].name).toBe('');

    // Delete existing Action
    rerender(<NpcFormFields data={currentData} onChange={onChange} />);
    const removeBtns = screen.getAllByRole('button', { name: /Remove Action/i });
    // Click the first one to remove the first action
    fireEvent.click(removeBtns[0]);

    expect(onChange).toHaveBeenCalled();
    const parsedActionsAfterRemove = JSON.parse(currentData.actions || '[]');
    expect(parsedActionsAfterRemove.length).toBe(1);
  });

  it('supports adding, editing, and deleting legendary actions with Cost fields', () => {
    let currentData = {
      ...DEFAULT_NPC_FORM_DATA,
      legendaryActionsList: JSON.stringify([
        {
          name: 'Wing Attack',
          description: 'Beats wings.',
          cost: 2,
          attackBonus: undefined,
          damage: '2d6+4',
          saveDC: 15,
          saveType: 'Dex',
        }
      ]),
    };
    const onChange = vi.fn((newData) => {
      currentData = newData;
    });

    const { rerender } = render(<NpcFormFields data={currentData} onChange={onChange} />);

    // Go to Stat Block tab
    const statBlockTab = screen.getByRole('tab', { name: 'Stat Block' });
    fireEvent.click(statBlockTab);

    // Verify existing legendary action fields are shown
    const wingInput = screen.getByDisplayValue('Wing Attack');
    expect(wingInput).toBeInTheDocument();

    // Verify "Cost" label and input are rendered
    expect(screen.getByText('Cost')).toBeInTheDocument();
    const costInput = screen.getByPlaceholderText('Cost (1-3)');
    expect(costInput).toHaveValue(2);

    // Edit cost
    fireEvent.change(costInput, { target: { value: '3' } });
    expect(onChange).toHaveBeenCalled();
    const parsedLegendaryAfterEdit = JSON.parse(currentData.legendaryActionsList || '[]');
    expect(parsedLegendaryAfterEdit[0].cost).toBe(3);

    // Rerender with updated data
    rerender(<NpcFormFields data={currentData} onChange={onChange} />);

    // Add new Legendary Action
    const addLegendaryBtn = screen.getByRole('button', { name: /Add Legendary Action/i });
    fireEvent.click(addLegendaryBtn);

    expect(onChange).toHaveBeenCalled();
    const parsedLegendaryAfterAdd = JSON.parse(currentData.legendaryActionsList || '[]');
    expect(parsedLegendaryAfterAdd.length).toBe(2);

    // Delete Legendary Action
    rerender(<NpcFormFields data={currentData} onChange={onChange} />);
    const removeBtns = screen.getAllByRole('button', { name: /Remove Legendary Action/i });
    fireEvent.click(removeBtns[0]);

    expect(onChange).toHaveBeenCalled();
    const parsedLegendaryAfterRemove = JSON.parse(currentData.legendaryActionsList || '[]');
    expect(parsedLegendaryAfterRemove.length).toBe(1);
  });
});
