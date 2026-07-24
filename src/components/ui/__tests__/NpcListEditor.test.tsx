import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcListEditor } from '../NpcListEditor';

interface TestItem {
  id: string;
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
        items={[{ id: '1', value: 'Item 1' }]}
        defaultExpanded={true}
        emptyItem={{ id: '', value: '' }}
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
        items={[{ id: '1', value: 'Item 1' }]}
        defaultExpanded={false}
        emptyItem={{ id: '', value: '' }}
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
        emptyItem={{ id: 'new', value: 'new' }}
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
});
