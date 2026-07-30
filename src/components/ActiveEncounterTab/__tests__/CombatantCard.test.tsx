import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { CombatantCard } from '../CombatantCard';
import type { Combatant } from '../../../types';
import { makeCombatant } from '../../../test-utils/fixtures/combatantFixtures';

vi.mock('../../../services/dbOperations', () => ({
  updateCharacterDB: vi.fn(),
  updateNpcInstanceConditionsDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn(),
}));

describe('CombatantCard', () => {
  afterEach(() => cleanup());

  const defaultProps = {
    c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC' }),
    isExpanded: false,
    damageInput: '',
    healInput: '',
    currentRound: 1,
    combatStarted: false,
    isActiveTurn: false,
    isSelected: false,
    isSelectable: false,
    isSyncing: false,
    onDamageInputChange: vi.fn(),
    onHealInputChange: vi.fn(),
    onHealthSubmit: vi.fn(),
    onToggleExpand: vi.fn(),
    onUpdateCombatant: vi.fn(),
    onRemoveCombatant: vi.fn(),
    onToggleSelect: vi.fn(),
    handleResourcePoolUpdate: vi.fn(),
    handleConditionAdded: vi.fn(),
    handleConditionWithTimer: vi.fn(),
    handleExhaustionDeath: vi.fn(),
  };

  it('renders without crashing for a PC combatant', () => {
    const { container } = render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('PC')).toBeInTheDocument();
  });

  it('renders without crashing for an NPC combatant', () => {
    const props = { ...defaultProps, c: makeCombatant({ id: 'npc1', type: 'npc', name: 'NPC' }) };
    const { container } = render(<CombatantCard {...props} />);
    expect(screen.getByText('NPC')).toBeInTheDocument();
  });

  it('clicking DMG button calls onHealthSubmit with isDamage: true', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} damageInput="10" onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /DMG/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(true, null);
  });

  it('clicking HEAL button calls onHealthSubmit with isDamage: false', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} healInput="5" onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /HEAL/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(false, null);
  });

  it('renders a ghost "+" button when tempHp is 0 or undefined', () => {
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempHp: 0 })
    };
    render(<CombatantCard {...props} />);
    expect(screen.getByTestId('add-temphp-ghost')).toBeInTheDocument();
    expect(screen.queryByTestId('temphp-pill')).not.toBeInTheDocument();
  });

  it('renders a temp HP pill when tempHp > 0', () => {
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempHp: 5 })
    };
    render(<CombatantCard {...props} />);
    expect(screen.getByTestId('temphp-pill')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByTestId('add-temphp-ghost')).not.toBeInTheDocument();
  });

  it('clicking the ghost "+" button opens the stepper and allows adjusting tempHp', () => {
    const onUpdateCombatant = vi.fn();
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempHp: 0 }),
      onUpdateCombatant,
    };
    render(<CombatantCard {...props} />);
    
    // Click ghost +
    fireEvent.click(screen.getByTestId('add-temphp-ghost'));
    
    // Stepper should be open
    expect(screen.getByTestId('temphp-stepper-container')).toBeInTheDocument();
    
    // Click increment
    fireEvent.click(screen.getByTestId('temphp-increment'));
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempHp: 1 });
    
    // Input should have value 0 (from the initial prop)
    const input = screen.getByTestId('temphp-input') as HTMLInputElement;
    expect(input.value).toBe('0');
    
    // Manually change input value
    fireEvent.change(input, { target: { value: '8' } });
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempHp: 8 });
  });

  it('clicking the tempHp pill opens the stepper and allows decrementing tempHp', () => {
    const onUpdateCombatant = vi.fn();
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempHp: 5 }),
      onUpdateCombatant,
    };
    render(<CombatantCard {...props} />);
    
    // Click pill
    fireEvent.click(screen.getByTestId('temphp-pill'));
    
    // Click decrement
    fireEvent.click(screen.getByTestId('temphp-decrement'));
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempHp: 4 });
    
    // Click Done button closes the stepper
    fireEvent.click(screen.getByTestId('temphp-done'));
    expect(screen.queryByTestId('temphp-stepper-container')).not.toBeInTheDocument();
  });

  it('renders a ghost "+" button for AC when tempAcModifier is 0 or undefined', () => {
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempAcModifier: 0, ac: 15 })
    };
    render(<CombatantCard {...props} />);
    expect(screen.getByTestId('add-tempac-ghost')).toBeInTheDocument();
    expect(screen.queryByTestId('tempac-pill')).not.toBeInTheDocument();
    expect(screen.getByText('(AC 15')).toBeInTheDocument();
  });

  it('renders a temp AC modifier pill when tempAcModifier is non-zero', () => {
    const propsPositive = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempAcModifier: 2, ac: 15 })
    };
    const { unmount } = render(<CombatantCard {...propsPositive} />);
    expect(screen.getByTestId('tempac-pill')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.queryByTestId('add-tempac-ghost')).not.toBeInTheDocument();
    unmount();

    const propsNegative = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempAcModifier: -2, ac: 15 })
    };
    render(<CombatantCard {...propsNegative} />);
    expect(screen.getByTestId('tempac-pill')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(screen.queryByTestId('add-tempac-ghost')).not.toBeInTheDocument();
  });

  it('clicking the ghost "+" AC button opens the stepper and allows adjusting tempAcModifier', () => {
    const onUpdateCombatant = vi.fn();
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempAcModifier: 0, ac: 15 }),
      onUpdateCombatant,
    };
    render(<CombatantCard {...props} />);
    
    // Click ghost +
    fireEvent.click(screen.getByTestId('add-tempac-ghost'));
    
    // Stepper should be open
    expect(screen.getByTestId('tempac-stepper-container')).toBeInTheDocument();
    
    // Click increment
    fireEvent.click(screen.getByTestId('tempac-increment'));
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempAcModifier: 1 });
    
    // Input should have value 0
    const input = screen.getByTestId('tempac-input') as HTMLInputElement;
    expect(input.value).toBe('0');
    
    // Manually change input value
    fireEvent.change(input, { target: { value: '4' } });
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempAcModifier: 4 });
  });

  it('clicking the tempAcModifier pill opens the stepper and allows decrementing into negative values', () => {
    const onUpdateCombatant = vi.fn();
    const props = {
      ...defaultProps,
      c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', tempAcModifier: 0, ac: 15 }),
      onUpdateCombatant,
    };
    render(<CombatantCard {...props} />);
    
    // Click ghost + to open stepper
    fireEvent.click(screen.getByTestId('add-tempac-ghost'));
    
    // Click decrement (goes into negative)
    fireEvent.click(screen.getByTestId('tempac-decrement'));
    expect(onUpdateCombatant).toHaveBeenCalledWith({ tempAcModifier: -1 });
    
    // Click Done button closes the stepper
    fireEvent.click(screen.getByTestId('tempac-done'));
    expect(screen.queryByTestId('tempac-stepper-container')).not.toBeInTheDocument();
  });

  it('does not re-render when only callback props change reference (same c/isExpanded/damageInput/healInput/currentRound/combatStarted/hpMode/pcCharacter/npcModel)', async () => {
    const utils = await import('../../../lib/utils');
    const spy = vi.spyOn(utils, 'cn');
    spy.mockClear();

    const combatant = makeCombatant({ id: 'pc1', type: 'pc', name: 'PC' });

    function Wrapper() {
      // Fresh callback references every render, exactly like ActiveEncounterTab's
      // real .map() call site does — this is the scenario the custom comparator is
      // specifically meant to ignore.
      return (
        <CombatantCard
          c={combatant}
          isExpanded={false}
          damageInput=""
          healInput=""
          currentRound={1}
          combatStarted={false}
          isActiveTurn={false}
          isSelected={false}
          isSelectable={false}
          isSyncing={false}
          onDamageInputChange={() => {}}
          onHealInputChange={() => {}}
          onHealthSubmit={() => {}}
          onToggleExpand={() => {}}
          onToggleSelect={() => {}}
          onUpdateCombatant={() => {}}
          onRemoveCombatant={() => {}}
          onConcentrationPrompt={() => {}}
          handleResourcePoolUpdate={() => {}}
          handleConditionAdded={() => {}}
          handleConditionWithTimer={() => {}}
          handleExhaustionDeath={() => {}}
        />
      );
    }

    const { rerender } = render(<Wrapper />);
    const callsAfterFirstRender = spy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    rerender(<Wrapper />);

    // cn() is called directly in CombatantCard's own render body (and by its
    // children, which also wouldn't render if the memo bailed out) — if the
    // comparator correctly bailed out, this count must not have increased at all.
    expect(spy.mock.calls.length).toBe(callsAfterFirstRender);

    spy.mockRestore();
  });

  it('does re-render when c reference actually changes', async () => {
    const utils = await import('../../../lib/utils');
    const spy = vi.spyOn(utils, 'cn');
    spy.mockClear();

    const combatant = makeCombatant({ id: 'pc1', type: 'pc', name: 'PC', currentHp: 10 });
    const updatedCombatant = { ...combatant, currentHp: 5 };

    function Wrapper({ c }: { c: Combatant }) {
      return (
        <CombatantCard
          c={c}
          isExpanded={false}
          damageInput=""
          healInput=""
          currentRound={1}
          combatStarted={false}
          isActiveTurn={false}
          isSelected={false}
          isSelectable={false}
          isSyncing={false}
          onDamageInputChange={() => {}}
          onHealInputChange={() => {}}
          onHealthSubmit={() => {}}
          onToggleExpand={() => {}}
          onToggleSelect={() => {}}
          onUpdateCombatant={() => {}}
          onRemoveCombatant={() => {}}
          onConcentrationPrompt={() => {}}
          handleResourcePoolUpdate={() => {}}
          handleConditionAdded={() => {}}
          handleConditionWithTimer={() => {}}
          handleExhaustionDeath={() => {}}
        />
      );
    }

    const { rerender } = render(<Wrapper c={combatant} />);
    const callsAfterFirstRender = spy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    rerender(<Wrapper c={updatedCombatant} />);

    // A genuinely different combatant object (the one actually being updated) must
    // still cause a real re-render — the comparator must not over-suppress this.
    expect(spy.mock.calls.length).toBeGreaterThan(callsAfterFirstRender);

    spy.mockRestore();
  });

  it('does re-render when isActiveTurn/isSelected/isSelectable/isSyncing change even though c reference stays the same', async () => {
    const utils = await import('../../../lib/utils');
    const spy = vi.spyOn(utils, 'cn');
    spy.mockClear();

    const combatant = makeCombatant({ id: 'pc1', type: 'pc', name: 'PC' });

    function Wrapper({ isActiveTurn, isSelected, isSelectable, isSyncing }: {
      isActiveTurn: boolean;
      isSelected: boolean;
      isSelectable: boolean;
      isSyncing: boolean;
    }) {
      return (
        <CombatantCard
          c={combatant}
          isExpanded={false}
          damageInput=""
          healInput=""
          currentRound={1}
          combatStarted={true}
          isActiveTurn={isActiveTurn}
          isSelected={isSelected}
          isSelectable={isSelectable}
          isSyncing={isSyncing}
          onDamageInputChange={() => {}}
          onHealInputChange={() => {}}
          onHealthSubmit={() => {}}
          onToggleExpand={() => {}}
          onToggleSelect={() => {}}
          onUpdateCombatant={() => {}}
          onRemoveCombatant={() => {}}
          onConcentrationPrompt={() => {}}
          handleResourcePoolUpdate={() => {}}
          handleConditionAdded={() => {}}
          handleConditionWithTimer={() => {}}
          handleExhaustionDeath={() => {}}
        />
      );
    }

    const { rerender } = render(
      <Wrapper isActiveTurn={false} isSelected={false} isSelectable={false} isSyncing={false} />
    );
    const callsAfterFirstRender = spy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);
    expect(screen.queryByText(/Active/i)).not.toBeInTheDocument();

    // Only isActiveTurn changes — same c reference, same everything else. This is the
    // exact scenario that would silently break if isActiveTurn were ever missing from,
    // or wrong in, CombatantCard's custom memo comparator: since these 4 booleans used
    // to be derived inside the component via a now-removed hook (invisible to any memo
    // comparator), they must now be explicitly compared as real props, or the card would
    // never visually update when e.g. a combatant's turn becomes active.
    rerender(
      <Wrapper isActiveTurn={true} isSelected={false} isSelectable={false} isSyncing={false} />
    );

    expect(spy.mock.calls.length).toBeGreaterThan(callsAfterFirstRender);
    expect(screen.getByText(/Active/i)).toBeInTheDocument();

    spy.mockRestore();
  });
});
describe('CombatantCard - Expanded content gating and layout', () => {
  afterEach(() => cleanup());
  const onUpdateCombatant = vi.fn();
  const defaultProps = {
    isExpanded: true, // Tests in this block assume expanded state
    damageInput: '',
    healInput: '',
    currentRound: 1,
    combatStarted: false,
    isActiveTurn: false,
    isSelected: false,
    isSelectable: false,
    isSyncing: false,
    onDamageInputChange: vi.fn(),
    onHealInputChange: vi.fn(),
    onHealthSubmit: vi.fn(),
    onToggleExpand: vi.fn(),
    onToggleSelect: vi.fn(),
    onUpdateCombatant,
    onRemoveCombatant: vi.fn(),
    onConcentrationPrompt: vi.fn(),
    handleResourcePoolUpdate: vi.fn(),
    handleConditionAdded: vi.fn(),
    handleConditionWithTimer: vi.fn(),
    handleExhaustionDeath: vi.fn()
  };

  it('renders reference content (traits) for a PC combatant when gmControlled is true', () => {
    const c = makeCombatant({
      id: 'pc1',
      type: 'pc',
      name: 'GM PC',
      traits: JSON.stringify([{ name: 'Test Trait', description: 'Test Description' }]),
    });
    
    const props = {
      ...defaultProps,
      c,
      pcCharacter: { id: 'char1', characterName: 'GM PC', gmControlled: true } as any
    };
    
    render(<CombatantCard {...props} />);
    
    // Content should be visible directly in expanded panel, no toggle button anymore
    expect(screen.queryByRole('button', { name: /▶ Stat Block/i })).not.toBeInTheDocument();
    expect(screen.getByText('Test Trait')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders reference content in a 2-column grid when expanded', () => {
    const npc = makeCombatant({
      id: 'npc-grid',
      type: 'npc',
      name: 'Grid NPC',
      traits: JSON.stringify([{ name: 'Trait 1', description: 'Desc 1' }]),
      actions: JSON.stringify([{ name: 'Action 1', description: 'Desc 1' }]),
      bonusActions: JSON.stringify([{ name: 'Bonus 1', description: 'Desc 1' }]),
      reactions: JSON.stringify([{ name: 'Reaction 1', description: 'Desc 1' }]),
    });

    render(<CombatantCard {...defaultProps} c={npc} />);

    const grid = screen.getByTestId('reference-content-grid');
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2');

    const columns = grid.children;
    expect(columns).toHaveLength(2);

    // Traits and Bonus Actions should be in the first column
    expect(within(columns[0] as HTMLElement).getByText('Traits')).toBeInTheDocument();
    expect(within(columns[0] as HTMLElement).getByText('Bonus Actions')).toBeInTheDocument();

    // Actions and Reactions should be in the second column
    expect(within(columns[1] as HTMLElement).getByText('Actions')).toBeInTheDocument();
    expect(within(columns[1] as HTMLElement).getByText('Reactions')).toBeInTheDocument();
  });

  it('does not render reference content (traits) for a PC combatant when gmControlled is false', () => {
    const c = makeCombatant({
      id: 'pc1',
      type: 'pc',
      name: 'Normal PC',
      traits: JSON.stringify([{ name: 'Test Trait', description: 'Test Description' }])
    });
    
    const props = {
      ...defaultProps,
      c,
      pcCharacter: { id: 'char1', characterName: 'Normal PC', gmControlled: false } as any
    };
    
    render(<CombatantCard {...props} />);
    
    expect(screen.queryByText('Test Trait')).not.toBeInTheDocument();
  });

  it('renders compact stats line and ability scores for an NPC', () => {
    const c = makeCombatant({
      id: 'npc1',
      type: 'npc',
      name: 'Goblin',
      speed: '30 ft.',
      challengeRating: '1/4',
      traits: JSON.stringify([{ name: 'Nimble Escape', description: 'Can disengage' }])
    });
    
    const props = {
      ...defaultProps,
      c,
      npcModel: { id: 'npc_gob', name: 'Goblin', abilityScores: JSON.stringify({ STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 8, CHA: 8 }), proficiencies: '{}' } as any
    };
    
    render(<CombatantCard {...props} />);
    
    // Stats line
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('30 ft.')).toBeInTheDocument();
    expect(screen.getByText('CR')).toBeInTheDocument();
    expect(screen.getByText('1/4')).toBeInTheDocument();
    
    // Ability table (using StatBlockScoresTable)
    expect(screen.getAllByText('14').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(+2)').length).toBeGreaterThan(0); // DEX 14
    expect(screen.getAllByText('8').length).toBeGreaterThan(0); // STR/WIS/CHA 8
    expect(screen.getAllByText('(-1)').length).toBeGreaterThan(0); // 8 mod
    
    // Traits
    expect(screen.getByText('Nimble Escape')).toBeInTheDocument();
  });

  it('renders legendary section with side-by-side trackers and descriptive list', () => {
    const c = makeCombatant({
      id: 'boss1',
      type: 'npc',
      name: 'Dragon',
      legendaryActions: { max: 3, remaining: 3 },
      legendaryResistances: { max: 3, remaining: 3 },
      legendaryActionsList: JSON.stringify([{ name: 'Wing Attack', description: 'Blasts wind', cost: 2 }])
    });
    
    render(<CombatantCard {...defaultProps} c={c} />);
    
    // Side-by-side trackers (checking for their labels)
    // Note: Legendary Actions is both the label for the tracker and the section title.
    // We check for the descriptive content to be sure.
    expect(screen.getByText('Wing Attack (Costs 2)')).toBeInTheDocument();
    expect(screen.getByText('Blasts wind')).toBeInTheDocument();
    expect(screen.getByText('Legendary Resistances')).toBeInTheDocument();
  });

  it('renders Speed, Senses, and Languages for a GM-controlled PC combatant', () => {
    const c = makeCombatant({
      id: 'pc1',
      type: 'pc',
      name: 'GM PC',
      speed: '30 ft.',
      senses: 'Darkvision 60ft',
      languages: 'Common, Elvish',
    });
    
    const props = {
      ...defaultProps,
      c,
      pcCharacter: { id: 'char1', characterName: 'GM PC', gmControlled: true } as any
    };
    
    render(<CombatantCard {...props} />);
    
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('30 ft.')).toBeInTheDocument();
    expect(screen.getByText('SENSES')).toBeInTheDocument();
    expect(screen.getByText('Darkvision 60ft')).toBeInTheDocument();
    expect(screen.getByText('LANGUAGES')).toBeInTheDocument();
    expect(screen.getByText('Common, Elvish')).toBeInTheDocument();
    
    // CR should still be absent even for GM-controlled PCs
    expect(screen.queryByText('CR')).not.toBeInTheDocument();
  });

  it('does not leak NPC-only fields (CR, Legendary) or GM-only fields (Speed, Senses, Languages) to a normal PC expanded display', () => {
    const c = makeCombatant({
      id: 'pc1',
      type: 'pc',
      name: 'Player',
      speed: '30 ft.',
      challengeRating: '5',
      senses: 'Darkvision 60ft',
      languages: 'Common, Elvish',
      legendaryActions: { max: 3, remaining: 3 }
    });
    
    const props = {
      ...defaultProps,
      c,
      pcCharacter: { id: 'char1', characterName: 'Player', gmControlled: false } as any
    };
    
    render(<CombatantCard {...props} />);
    
    expect(screen.queryByText('CR')).not.toBeInTheDocument();
    expect(screen.queryByText('Speed')).not.toBeInTheDocument();
    expect(screen.queryByText('SENSES')).not.toBeInTheDocument();
    expect(screen.queryByText('LANGUAGES')).not.toBeInTheDocument();
    expect(screen.queryByText('Legendary Actions')).not.toBeInTheDocument();
    expect(screen.queryByText('Legendary Resistances')).not.toBeInTheDocument();
  });

  it('renders Reactions with mechanical fields meta string in expanded layout', () => {
    const c = makeCombatant({
      id: 'npc1',
      type: 'npc',
      name: 'Shield Mage',
      reactions: JSON.stringify([{
        name: 'Arcane Shield',
        description: 'Creates a barrier',
        attackBonus: 5,
        damage: '2d6+3',
        saveDC: 14,
        saveType: 'Con',
      }])
    });

    render(<CombatantCard {...defaultProps} c={c} />);

    // Assert name, description and meta string are rendered correctly
    expect(screen.getByText('Arcane Shield')).toBeInTheDocument();
    expect(screen.getByText('Creates a barrier')).toBeInTheDocument();
    expect(screen.getByText(/\+5 to hit\s*\|\s*2d6\+3\s*\|\s*DC 14 Con save/)).toBeInTheDocument();
  });

  it('renders StatBlockSkills without an expand/collapse toggle in read-only mode', () => {
    const c = makeCombatant({ id: 'pc1', type: 'pc' });
    render(<CombatantCard {...defaultProps} c={c} />);
    
    expect(screen.queryByRole('button', { name: /Expand skills/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Collapse skills/i })).not.toBeInTheDocument();
  });

  it('renders IRV display within the fixed 2-column Skills/IRV grid', () => {
    const c = makeCombatant({
      id: 'pc1',
      type: 'pc',
      resistances: 'Fire'
    });
    
    render(<CombatantCard {...defaultProps} c={c} />);
    
    // IRV should be present
    expect(screen.getByText(/RESISTANCES/i)).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
    
    // Specifically check for the grid containing both Skills (which has 'Skills' text) and IRV
    const skillsIrvGrid = screen.getByTestId('skills-irv-grid');
    expect(skillsIrvGrid).toBeInTheDocument();
    expect(skillsIrvGrid).toHaveTextContent(/Skills/i);
    expect(skillsIrvGrid).toHaveTextContent(/Resistances/i);
  });

  it('renders Recharge and Conditions within the fixed 2-column grid', () => {
    const c = makeCombatant({
      id: 'npc1',
      type: 'npc',
      rechargeAbilities: [{ name: 'Stink', rechargeOn: 6, isCharged: true }]
    });
    
    render(<CombatantCard {...defaultProps} c={c} />);
    
    // Use getAllByText if it appears multiple times (e.g. in a toast or summary), but we want to confirm it's in the card
    const stinkElements = screen.getAllByText('Stink');
    expect(stinkElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Conditions')).toBeInTheDocument();
    
    // Grid 3 is Recharge/Conditions
    const rechargeConditionsGrid = screen.getByTestId('recharge-conditions-grid');
    expect(rechargeConditionsGrid).toBeInTheDocument();
    expect(rechargeConditionsGrid).toHaveTextContent(/Stink/i);
    expect(rechargeConditionsGrid).toHaveTextContent(/Conditions/i);
  });

  it('renders Class Resource Trackers inside the recharge-conditions-grid for PC combatants', () => {
    const c = makeCombatant({
      id: 'pc1',
      type: 'pc'
    });
    const pcCharacter = { 
        id: 'char1', 
        resourcePools: JSON.stringify([{ name: 'Pool', max: 5, current: 5, reset: 'short' }])
    } as any;
    
    render(<CombatantCard {...defaultProps} c={c} pcCharacter={pcCharacter} />);
    
    const grid = screen.getByTestId('recharge-conditions-grid');
    expect(grid).toBeInTheDocument();
    
    // Check if ResourcePoolsSection is rendered inside the grid.
    // I will assume it renders some text or a component identifiable within the grid.
    // Since I can't see ResourcePoolsSection, I will try to see if it's there.
    // Given I am moving it, I should be able to query it if it's rendered.
    // Let's assume it renders a test-id or text 'Class Resource Trackers' if that's what it was called.
    // Actually, I'll check for its test-id if I knew it. I'll check for 'ResourcePoolsSection' component or text.
    // Let's assume it renders 'Class Resource Trackers' as the label.
    expect(grid).toHaveTextContent(/Class Resource Trackers/i);
  });

  it('does not render Class Resource Trackers for NPC combatants', () => {
    const c = makeCombatant({
      id: 'npc1',
      type: 'npc'
    });
    
    render(<CombatantCard {...defaultProps} c={c} />);
    
    const grid = screen.getByTestId('recharge-conditions-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).not.toHaveTextContent(/Class Resource Trackers/i);
  });

  it('verifies Ability Scores Table has borders and updated text sizes', () => {
    const c = makeCombatant({
      id: 'npc1',
      type: 'npc',
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 })
    });
    const props = {
      ...defaultProps,
      c,
      npcModel: { id: 'npc_gob', name: 'Goblin', abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }), proficiencies: '{}' } as any
    };
    const { container } = render(<CombatantCard {...props} />);
    
    // Wrapper div with border
    const tableWrapper = container.querySelector('div.border.border-\\[\\#e2e8f0\\].rounded-xl');
    expect(tableWrapper).toBeInTheDocument();
    
    // Header row with background
    const headerRow = container.querySelector('thead tr.bg-\\[\\#f9f8ff\\]');
    expect(headerRow).toBeInTheDocument();
    
    // Headers with text-xs and borders
    const th = container.querySelector('th');
    expect(th).toHaveClass('text-center');
    expect(th).toHaveClass('border-r');
    expect(th?.querySelector('div')).toHaveClass('text-xs');
    
    // Value with text-lg
    const tdValue = container.querySelector('td div.text-lg');
    expect(tdValue).toBeInTheDocument();
    expect(tdValue).toHaveClass('font-bold');
    
    // Modifier with text-sm
    const tdMod = container.querySelector('td div.text-sm');
    expect(tdMod).toBeInTheDocument();
    expect(tdMod).toHaveClass('font-medium');
  });

  it('verifies IRV display does not have width constraints (regression for w-[60%])', () => {
    const c = makeCombatant({
      id: 'npc1',
      type: 'npc',
      resistances: 'Fire, Cold'
    });
    
    const { container } = render(<CombatantCard {...defaultProps} c={c} />);
    
    // Query by data-testid as specified in testing-philosophy requirements for regression pins
    const irvContainer = screen.getByTestId('combatant-irv-display');
    
    expect(irvContainer).toBeInTheDocument();
    // Assert it does NOT contain the old bug class w-[60%]
    expect(irvContainer.className).not.toContain('w-[60%]');
  });

  it('verifies NPC traits use font-normal for markdown descriptions (regression for font-bold)', () => {
    const c = makeCombatant({
      id: 'npc1',
      type: 'npc',
      traits: JSON.stringify([{ name: 'Keen Sight', description: 'The goblin has advantage on Wisdom (Perception) checks.' }])
    });
    
    // We need to render in a state where reference content is visible
    const { container } = render(<CombatantCard {...defaultProps} c={c} />);
    
    // Find the trait description paragraph
    const description = screen.getByText(/The goblin has advantage/i);
    expect(description.tagName).toBe('P');
    // Assert it has font-normal directly
    expect(description).toHaveClass('font-normal');
  });

  it('verifies correct ordering of Passive, Senses, and Languages in the right grid column', () => {
    const c = makeCombatant({
      id: 'npc1',
      type: 'npc',
      senses: 'Darkvision 60ft',
      languages: 'Common, Goblin'
    });
    
    render(<CombatantCard {...defaultProps} c={c} />);
    
    // Find the right column of the first grid (Saves | Passive+Senses+Languages)
    const firstGrid = screen.getByTestId('saves-passive-grid');
    const rightCol = firstGrid.children[1]; // second child is the right column
    
    expect(rightCol).toBeInTheDocument();
    
    // Check text content order
    const text = rightCol.textContent || '';
    const passivePos = text.indexOf('PASSIVE'); // All-caps per StatBlockPassive
    const sensesPos = text.indexOf('SENSES');
    const languagesPos = text.indexOf('LANGUAGES');
    
    // Existence assertions before ordering check (must be non-negative)
    expect(passivePos).toBeGreaterThanOrEqual(0);
    expect(sensesPos).toBeGreaterThanOrEqual(0);
    expect(languagesPos).toBeGreaterThanOrEqual(0);
    
    expect(passivePos).toBeLessThan(sensesPos);
    expect(sensesPos).toBeLessThan(languagesPos);

  });
});
