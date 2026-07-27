import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcListEditor } from '../NpcListEditor';

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
});
