import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatHeader } from '../CombatHeader';
import { MemoryRouter } from 'react-router-dom';

describe('CombatHeader', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  
  const defaultProps = {
    round: 3,
    isMultiTargetMode: false,
    selectedCount: 0,
    onOpenTools: vi.fn(),
    onRollNpcInit: vi.fn(),
    onResetCombat: vi.fn(),
    onRecordEncounter: vi.fn(),
    onCancelEncounter: vi.fn(),
    onNextTurn: vi.fn(),
    onToggleMultiTargetMode: vi.fn(),
    onDeleteSelected: vi.fn(),
    onCancelSelection: vi.fn(),
    onBack: vi.fn(),
    onCallInitiative: vi.fn(),
    initiativeEvent: false,
  };

  it('renders without crashing with required props', () => {
    const { container } = render(
      <MemoryRouter>
        <CombatHeader
          {...defaultProps}
          encounter={{ id: 'e1', name: 'Test Encounter', location: 'Test Loc', difficultyId: 1, difficultyName: 'Easy', npcDefinitions: '', status: 'active' }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Encounter')).toBeInTheDocument();
    expect(screen.getByText(/round 3/i)).toBeInTheDocument();
  });

  it('shows Record Encounter when loggingRequested is false', () => {
    render(
      <MemoryRouter>
        <CombatHeader
          {...defaultProps}
          encounter={{ id: 'e1', name: 'Test Encounter', location: 'Test Loc', difficultyId: 1, difficultyName: 'Easy', npcDefinitions: '', status: 'active', loggingRequested: false }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Record Encounter')).toBeInTheDocument();
    expect(screen.queryByText('End Encounter')).not.toBeInTheDocument();
  });

  it('shows End Encounter with red dot when loggingRequested is true', () => {
    const { container } = render(
      <MemoryRouter>
        <CombatHeader
          {...defaultProps}
          encounter={{ id: 'e1', name: 'Test Encounter', location: 'Test Loc', difficultyId: 1, difficultyName: 'Easy', npcDefinitions: '', status: 'active', loggingRequested: true }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('End Encounter')).toBeInTheDocument();
    expect(screen.queryByText('Record Encounter')).not.toBeInTheDocument();
    // Check for the pulsing dot
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
