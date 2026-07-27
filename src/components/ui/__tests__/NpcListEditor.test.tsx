import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcListEditor } from '../NpcListEditor';
import { formatActionMeta } from '../NpcStatBlockSection';

interface TestItem {
  id: string;
  name: string;
  value: string;
}

describe('NpcListEditor', () => {
  afterEach(() => cleanup());

  const renderFields = (item: TestItem, onChange: (updated: TestItem) => void) => (
    <input
      data-testid="item-input"
      value={item.value}
      onChange={(e) => onChange({ ...item, value: e.target.value })}
    />
  );

  it('Case A: renders expanded by default and can be collapsed', () => {
    render(
      <NpcListEditor<TestItem>
        title="Test Section"
        items={[{ id: '1', name: 'Item 1', value: 'Item 1' }]}
        defaultExpanded={true}
        emptyItem={{ id: '', name: '', value: '' }}
        renderFields={renderFields}
        onChange={vi.fn()}
      />
    );

    // Should be expanded initially
    expect(screen.getByTestId('item-input')).toBeInTheDocument();
    expect(screen.getByText(/Add\s+Test Section/i)).toBeInTheDocument();

    // Click header to collapse
    fireEvent.click(screen.getByText('Test Section'));

    // Should be collapsed
    expect(screen.queryByTestId('item-input')).not.toBeInTheDocument();
    expect(screen.queryByText(/Add\s+Test Section/i)).not.toBeInTheDocument();
  });

  it('Case B: renders collapsed by default and can be expanded', () => {
    render(
      <NpcListEditor<TestItem>
        title="Test Section"
        items={[{ id: '1', name: 'Item 1', value: 'Item 1' }]}
        defaultExpanded={false}
        emptyItem={{ id: '', name: '', value: '' }}
        renderFields={renderFields}
        onChange={vi.fn()}
      />
    );

    // Should be collapsed initially
    expect(screen.queryByTestId('item-input')).not.toBeInTheDocument();

    // Click header to expand
    fireEvent.click(screen.getByText('Test Section'));

    // Should be expanded
    expect(screen.getByTestId('item-input')).toBeInTheDocument();
  });

  it('Case C: clicking "+ Add" while expanded does not collapse the section (stopPropagation)', () => {
    const onChange = vi.fn();
    render(
      <NpcListEditor<TestItem>
        title="Test Section"
        items={[]}
        defaultExpanded={true}
        emptyItem={{ id: 'new', name: '', value: 'new' }}
        renderFields={renderFields}
        onChange={onChange}
      />
    );

    // Verify expanded
    expect(screen.getByText(/Add\s+Test Section/i)).toBeInTheDocument();

    // Click Add button
    fireEvent.click(screen.getByText(/Add\s+Test Section/i));

    // onChange should be called
    expect(onChange).toHaveBeenCalled();

    // Section should STILL be expanded (if stopPropagation failed, the header click would trigger and collapse it)
    expect(screen.getByText(/Add\s+Test Section/i)).toBeInTheDocument();
  });

  it('Case D: supports delete confirmation lifecycle', () => {
    const onChange = vi.fn();
    render(
      <NpcListEditor<TestItem>
        title="Test Section"
        items={[
          { id: '1', name: 'Item 1', value: 'Value 1' },
          { id: '2', name: 'Item 2', value: 'Value 2' }
        ]}
        defaultExpanded={true}
        emptyItem={{ id: 'new', name: '', value: 'new' }}
        renderFields={renderFields}
        onChange={onChange}
      />
    );

    const removeBtns = screen.getAllByRole('button', { name: /Remove Test Section/i });
    
    // Click delete on the first item
    fireEvent.click(removeBtns[0]);
    
    // Dialog should appear, but onChange should not be called yet
    expect(screen.getByText('Delete Test Section?')).toBeInTheDocument();
    expect(screen.getByText('This will permanently remove "Item 1". This cannot be undone.')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    // Click Cancel
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    // Dialog should be gone, onChange still not called
    expect(screen.queryByText('Delete Test Section?')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    // Click delete again
    fireEvent.click(removeBtns[0]);
    
    // Click Confirm
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // onChange should now be called with the item removed
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([{ id: '2', name: 'Item 2', value: 'Value 2' }]);
    expect(screen.queryByText('Delete Test Section?')).not.toBeInTheDocument();
  });

  it('Case E: delete confirmation uses generic wording when name is empty or whitespace', () => {
    const onChange = vi.fn();
    render(
      <NpcListEditor<TestItem>
        title="Test Section"
        items={[{ id: '1', name: '   ', value: 'Value 1' }]}
        defaultExpanded={true}
        emptyItem={{ id: 'new', name: '', value: 'new' }}
        renderFields={renderFields}
        onChange={onChange}
      />
    );

    const removeBtns = screen.getAllByRole('button', { name: /Remove Test Section/i });
    fireEvent.click(removeBtns[0]);
    
    expect(screen.getByText('This will permanently remove this test section. This cannot be undone.')).toBeInTheDocument();
  });

  it('collapses existing items by default when initial count > 3', () => {
    const items = [
      { id: '1', name: 'Item 1', value: 'V1' },
      { id: '2', name: 'Item 2', value: 'V2' },
      { id: '3', name: 'Item 3', value: 'V3' },
      { id: '4', name: 'Item 4', value: 'V4' },
    ];
    render(
      <NpcListEditor<TestItem>
        title="Test Section"
        items={items}
        defaultExpanded={true}
        emptyItem={{ id: '', name: '', value: '' }}
        renderFields={renderFields}
        onChange={vi.fn()}
      />
    );
    // Should be collapsed initially due to count > 3
    expect(screen.queryByTestId('item-input')).not.toBeInTheDocument();
    // But headers should be visible
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 4')).toBeInTheDocument();
  });

  it('stays expanded when initial count <= 3', () => {
    const items = [
      { id: '1', name: 'Item 1', value: 'V1' },
      { id: '2', name: 'Item 2', value: 'V2' },
      { id: '3', name: 'Item 3', value: 'V3' },
    ];
    render(
      <NpcListEditor<TestItem>
        title="Test Section"
        items={items}
        defaultExpanded={true}
        emptyItem={{ id: '', name: '', value: '' }}
        renderFields={renderFields}
        onChange={vi.fn()}
      />
    );
    // Should be expanded initially due to count <= 3
    expect(screen.getAllByTestId('item-input')).toHaveLength(3);
  });

  it('toggles per-item expansion when clicking item header', () => {
    render(
      <NpcListEditor<TestItem>
        title="Test Section"
        items={[{ id: '1', name: 'Toggle Me', value: 'Secret Value' }]}
        defaultExpanded={true}
        emptyItem={{ id: '', name: '', value: '' }}
        renderFields={renderFields}
        onChange={vi.fn()}
      />
    );

    // Initially expanded
    expect(screen.getByTestId('item-input')).toBeInTheDocument();

    // Click header to collapse item
    fireEvent.click(screen.getByText('Toggle Me'));
    expect(screen.queryByTestId('item-input')).not.toBeInTheDocument();

    // Click header to expand again
    fireEvent.click(screen.getByText('Toggle Me'));
    expect(screen.getByTestId('item-input')).toBeInTheDocument();
  });

  it('shows untitled fallback in header when name is empty', () => {
    render(
      <NpcListEditor<TestItem>
        title="Traits"
        items={[{ id: '1', name: '', value: 'V1' }]}
        defaultExpanded={true}
        emptyItem={{ id: '', name: '', value: '' }}
        renderFields={renderFields}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('(untitled trait)')).toBeInTheDocument();
  });

  it('newly added items start expanded regardless of total count', () => {
    const items = [
      { id: '1', name: 'I1', value: 'V1', _key: 'k1' },
      { id: '2', name: 'I2', value: 'V2', _key: 'k2' },
      { id: '3', name: 'I3', value: 'V3', _key: 'k3' },
      { id: '4', name: 'I4', value: 'V4', _key: 'k4' },
    ];
    const onChange = vi.fn();
    const { rerender } = render(
      <NpcListEditor<TestItem & { _key?: string }>
        title="Test Section"
        items={items}
        defaultExpanded={true}
        emptyItem={{ id: 'new', name: 'New Item', value: 'new-val' }}
        renderFields={renderFields}
        onChange={onChange}
      />
    );

    // Initial 4 are collapsed
    expect(screen.queryByTestId('item-input')).not.toBeInTheDocument();

    // Click Add
    fireEvent.click(screen.getByText(/Add\s+Test Section/i));
    expect(onChange).toHaveBeenCalled();

    // Simulate update from parent
    const updatedItems = [
      ...items,
      { id: 'new', name: 'New Item', value: 'new-val', _key: 'k5' }
    ];
    rerender(
      <NpcListEditor<TestItem & { _key?: string }>
        title="Test Section"
        items={updatedItems}
        defaultExpanded={true}
        emptyItem={{ id: 'new', name: 'New Item', value: 'new-val' }}
        renderFields={renderFields}
        onChange={onChange}
      />
    );

    // The new item should be expanded
    expect(screen.getByDisplayValue('new-val')).toBeInTheDocument();
    // Old items remain collapsed
    expect(screen.queryByDisplayValue('V1')).not.toBeInTheDocument();
  });

  it('shows combat action metadata in collapsed summary', () => {
    // We need to use fields that formatActionMeta recognizes
    interface CombatItem extends TestItem {
      attackBonus?: number;
      damage?: string;
    }
    const renderCombatFields = (item: CombatItem) => <div data-testid="combat-fields">{item.value}</div>;
    
    render(
      <NpcListEditor<CombatItem>
        title="Actions"
        items={[{ id: '1', name: 'Slash', value: 'V1', attackBonus: 5, damage: '1d6+3' }]}
        defaultExpanded={true}
        emptyItem={{ id: '', name: '', value: '' }}
        renderFields={renderCombatFields}
        onChange={vi.fn()}
      />
    );

    // Collapse it to see summary
    fireEvent.click(screen.getByText('Slash'));
    
    // Summary should show meta: "+5 to hit | 1d6+3"
    expect(screen.getByText(/\+5 to hit\s*\|\s*1d6\+3/)).toBeInTheDocument();
  });

  it('toggling via chevron click directly does not double-fire (bubble prevention)', () => {
    render(
      <NpcListEditor<TestItem>
        title="Test Section"
        items={[{ id: '1', name: 'Toggle Me', value: 'Secret Value' }]}
        defaultExpanded={true}
        emptyItem={{ id: '', name: '', value: '' }}
        renderFields={renderFields}
        onChange={vi.fn()}
      />
    );

    // Initially expanded
    expect(screen.getByTestId('item-input')).toBeInTheDocument();

    // Click ONLY the chevron icon (by label)
    // CardHeaderChevron uses "Collapse [label]" or "Expand [label]"
    const chevron = screen.getByLabelText(/(Collapse|Expand) Toggle Me/i);
    fireEvent.click(chevron);

    // Should be collapsed now. If it double-fired, it would still be expanded.
    expect(screen.queryByTestId('item-input')).not.toBeInTheDocument();
  });

  it('confirms the Remove button is NOT present when an item is collapsed, and IS present and triggers confirmation once expanded', () => {
    const items = [
      { id: '1', name: 'Toggle Me', value: 'Secret Value' }
    ];
    render(
      <NpcListEditor<TestItem>
        title="Test Section"
        items={items}
        defaultExpanded={true}
        emptyItem={{ id: '', name: '', value: '' }}
        renderFields={renderFields}
        onChange={vi.fn()}
      />
    );

    // Initially expanded (due to 1 item), so let's collapse it first
    fireEvent.click(screen.getByText('Toggle Me'));
    expect(screen.queryByRole('button', { name: /Remove Test Section/i })).not.toBeInTheDocument();

    // Now expand it
    fireEvent.click(screen.getByText('Toggle Me'));
    const removeBtn = screen.getByRole('button', { name: /Remove Test Section/i });
    expect(removeBtn).toBeInTheDocument();

    // Trigger delete confirmation flow
    fireEvent.click(removeBtn);
    expect(screen.getByText('Delete Test Section?')).toBeInTheDocument();
  });

  it('correctly handles formatActionMeta for legacy reaction data and mechanical fields', () => {
    // Legacy reaction has only name and description
    const legacyReaction = {
      name: 'Shield',
      description: 'Gains +5 AC',
    };
    expect(formatActionMeta(legacyReaction)).toBe('');

    // Mechanical reaction has combat fields
    const mechanicalReaction = {
      name: 'Shield',
      description: 'Gains +5 AC',
      attackBonus: 5,
      damage: '1d6+2',
      saveDC: 13,
      saveType: 'Con',
    };
    expect(formatActionMeta(mechanicalReaction)).toBe('+5 to hit | 1d6+2 | DC 13 Con save');
  });
});
