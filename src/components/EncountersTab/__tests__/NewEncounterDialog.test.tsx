import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewEncounterDialog } from '../NewEncounterDialog';

describe('NewEncounterDialog', () => {
  afterEach(() => cleanup());

  const mockDifficulties = [
    { id: 1, name: 'Easy' },
    { id: 2, name: 'Medium' },
    { id: 3, name: 'Hard' },
    { id: 4, name: 'Deadly' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    difficulties: mockDifficulties,
  };

  it('renders without crashing and calls onConfirm with encounter data when submitted', () => {
    const onConfirmMock = vi.fn();
    render(<NewEncounterDialog {...defaultProps} onConfirm={onConfirmMock} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Goblin Ambush'), {
      target: { value: 'Goblin Raid' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. Whispering Woods'), {
      target: { value: 'Goblin Cave' },
    });
    fireEvent.change(screen.getByLabelText(/difficulty/i), {
      target: { value: '2' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Encounter/i }));

    expect(onConfirmMock).toHaveBeenCalledOnce();
    expect(onConfirmMock).toHaveBeenCalledWith({
      name: 'Goblin Raid',
      location: 'Goblin Cave',
      difficultyId: 2,
    });
  });
});
