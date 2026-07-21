import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CharacterCard } from '../CharacterCard';

describe('CharacterCard', () => {
  afterEach(() => cleanup());

  const mockCharacter = {
    id: 'char123',
    playerName: 'John Doe',
    characterName: 'Aethelgard the Valiant',
    ac: 18,
    maxHp: 45,
    tempHp: 0,
    currentHp: 40,
    conditions: 'None',
    passivePerception: 14,
    level: 4,
    statusId: 1,
    statusName: 'Active',
    notes: 'Brave warrior.',
    isActive: true,
    class: 'Fighter',
    tempAc: 0,
    hitDiceConfig: '',
    hitDiceUsed: '{}',
    abilityScores: '{}',
    proficiencies: '{}',
  };

  const defaultProps = {
    character: mockCharacter,
    statuses: { '1': 'Active', '2': 'Inactive', '3': 'Deceased' },
    isSyncing: false,
    isExpanded: false,
    onToggleExpand: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onLevelUpClick: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<CharacterCard {...defaultProps} />);
  });

  it('does not re-render when only callback props change reference (same character/statuses/isSyncing/isExpanded)', async () => {
    const conditions = await import('../../../lib/conditions');
    const spy = vi.spyOn(conditions, 'getHealthStatus');
    spy.mockClear();

    function Wrapper() {
      // Fresh callback references every render, exactly like PartyTab.tsx's real
      // .map() call site does (() => toggleExpand(char.id), etc.) — this is the
      // scenario the custom comparator is specifically meant to ignore.
      return (
        <CharacterCard
          character={mockCharacter}
          statuses={defaultProps.statuses}
          isSyncing={false}
          isExpanded={false}
          onToggleExpand={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
          onLevelUpClick={() => {}}
        />
      );
    }

    const { rerender } = render(<Wrapper />);
    const callsAfterFirstRender = spy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    // Re-render the parent with brand-new callback references but the exact same
    // character/statuses object references and the same primitive prop values.
    rerender(<Wrapper />);

    // getHealthStatus is called at the top of CharacterCard's own function body on
    // every actual execution — if the memo comparator correctly bailed out, this
    // spy's call count must not have increased at all.
    expect(spy.mock.calls.length).toBe(callsAfterFirstRender);

    spy.mockRestore();
  });

  it('does re-render when character reference actually changes', async () => {
    const conditions = await import('../../../lib/conditions');
    const spy = vi.spyOn(conditions, 'getHealthStatus');
    spy.mockClear();

    const updatedCharacter = { ...mockCharacter, currentHp: 20 };

    function Wrapper({ character }: { character: typeof mockCharacter }) {
      return (
        <CharacterCard
          character={character}
          statuses={defaultProps.statuses}
          isSyncing={false}
          isExpanded={false}
          onToggleExpand={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
          onLevelUpClick={() => {}}
        />
      );
    }

    const { rerender } = render(<Wrapper character={mockCharacter} />);
    const callsAfterFirstRender = spy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    rerender(<Wrapper character={updatedCharacter} />);

    // A genuinely different character object (the one actually being updated)
    // must still cause a real re-render — the comparator must not over-suppress this.
    expect(spy.mock.calls.length).toBeGreaterThan(callsAfterFirstRender);
    expect(screen.getByText('20')).toBeInTheDocument();

    spy.mockRestore();
  });
});
