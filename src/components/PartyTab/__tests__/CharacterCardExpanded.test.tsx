import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { toast } from 'sonner';
import { CharacterCardExpanded } from '../CharacterCardExpanded';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe('CharacterCardExpanded', () => {

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const defaultCharacter = {
    id: 'pc-1',
    playerName: 'Alice',
    characterName: 'Thor',
    ac: 15,
    maxHp: 20,
    tempHp: 0,
    currentHp: 20,
    conditions: '',
    passivePerception: 14,
    level: 2, // Paladin gets spellcasting at level 2
    statusId: 1,
    statusName: 'Active',
    notes: '',
    isActive: true,
    class: 'Paladin',
    hitDiceConfig: '1d10',
    hitDiceUsed: '{}',
    abilityScores: '{}',
    proficiencies: '{}',
  };

  const defaultProps = {
    character: defaultCharacter,
    isSyncing: false,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders without crashing with full character data', () => {
    const { container } = render(<CharacterCardExpanded {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('clamps current HP to effective max HP (exhaustion-halved scenario) on blur', () => {
    const onUpdateMock = vi.fn();
    const testCharacter = {
      ...defaultCharacter,
      maxHp: 40,
      tempHpMax: 20, // effectiveMaxHp is 20
      currentHp: 17,
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={testCharacter}
        onUpdate={onUpdateMock}
      />
    );

    const hpInput = screen.getByDisplayValue('17');
    expect(hpInput).toBeInTheDocument();

    // Type a value above the effective max HP (20)
    fireEvent.change(hpInput, { target: { value: '35' } });
    
    // Trigger blur to commit the value
    fireEvent.blur(hpInput);

    expect(onUpdateMock).toHaveBeenCalledWith({ currentHp: 20 });
  });

  it('handles GM-Controlled character toggle and displays/updates traits, actions, and reactions when enabled', () => {
    const onUpdateMock = vi.fn();

    // 1. Render with default character where gmControlled is false/undefined
    const { rerender } = render(
      <CharacterCardExpanded
        {...defaultProps}
        onUpdate={onUpdateMock}
      />
    );

    // Assert the three Traits/Actions/Reactions sections are NOT present
    expect(screen.queryByRole('heading', { name: /^traits$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^actions$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^reactions$/i })).not.toBeInTheDocument();

    // 2. Click "GM-Controlled Character" checkbox and assert onUpdate is called
    const gmCheckbox = screen.getByLabelText('GM-Controlled Character');
    fireEvent.click(gmCheckbox);

    expect(onUpdateMock).toHaveBeenCalledWith({ gmControlled: true });

    // 3. Render fresh / re-render with gmControlled: true and populated traits/actions/reactions
    const gmCharacter = {
      ...defaultCharacter,
      gmControlled: true,
      traits: JSON.stringify([{ name: 'Spellcasting', description: 'Can cast spells' }]),
      actions: JSON.stringify([{ name: 'Multiattack', description: 'Makes two attacks' }]),
      reactions: JSON.stringify([{ name: 'Shield', description: 'Gains +5 AC' }]),
    };

    rerender(
      <CharacterCardExpanded
        {...defaultProps}
        character={gmCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // Assert the three sections ARE now present and populated content is visible
    expect(screen.getByRole('heading', { name: /^traits$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^actions$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^reactions$/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Spellcasting')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Can cast spells')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Multiattack')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Shield')).toBeInTheDocument();

    // 4. Add an entry to the Traits list editor and assert onUpdate reflects that change
    onUpdateMock.mockClear();
    const addTraitButton = screen.getByRole('button', { name: /add trait/i });
    fireEvent.click(addTraitButton);

    expect(onUpdateMock).toHaveBeenCalledTimes(1);
    const updatedTraits = JSON.parse(onUpdateMock.mock.calls[0][0].traits);
    expect(updatedTraits).toHaveLength(2);
    expect(updatedTraits[0]).toEqual({ name: 'Spellcasting', description: 'Can cast spells' });
    expect(updatedTraits[1]).toEqual(expect.objectContaining({ name: '', description: '' }));
  });



  it('calculates saving throw DC with multiple dcAbilities in PC context', () => {
    const onUpdateMock = vi.fn();
    const mockAbilityScores = { STR: 15, DEX: 16, CON: 10, INT: 10, WIS: 10, CHA: 10 };
    const pcCharacter = {
      ...defaultCharacter,
      gmControlled: true,
      abilityScores: JSON.stringify(mockAbilityScores),
      level: 5, // +3 prof
      actions: JSON.stringify([{ 
        name: 'Breath', 
        description: 'Fire!', 
        dcAbilities: ['STR', 'DEX'] // DC = 8 + 3 + (2) + (3) = 16
      }]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // Click Auto-fill
    const autoFillBtn = screen.getByRole('button', { name: /auto-fill dc/i });
    fireEvent.click(autoFillBtn);

    expect(onUpdateMock).toHaveBeenCalled();
    const updatedActions = JSON.parse(onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0].actions);
    expect(updatedActions[0].saveDC).toBe(16);
  });

  it('calculates attack bonus with atkAbility in PC context', () => {
    const onUpdateMock = vi.fn();
    const mockAbilityScores = { STR: 18, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }; // STR +4
    const pcCharacter = {
      ...defaultCharacter,
      gmControlled: true,
      abilityScores: JSON.stringify(mockAbilityScores),
      level: 5, // +3 prof
      actions: JSON.stringify([{ 
        name: 'Greatsword', 
        description: 'Slash!', 
        atkAbility: 'STR' // Attack Bonus = 3 + 4 = 7
      }]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // Click Auto-fill Atk
    const autoFillBtn = screen.getByRole('button', { name: 'Auto-fill Atk' });
    fireEvent.click(autoFillBtn);

    expect(onUpdateMock).toHaveBeenCalled();
    const updatedActions = JSON.parse(onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0].actions);
    expect(updatedActions[0].attackBonus).toBe(7);
  });

  it('calculates damage bonus with STR ability in PC context', () => {
    const onUpdateMock = vi.fn();
    const mockAbilityScores = { STR: 16, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }; // STR +3
    const pcCharacter = {
      ...defaultCharacter,
      gmControlled: true,
      abilityScores: JSON.stringify(mockAbilityScores),
      actions: JSON.stringify([{ 
        name: 'Greatsword', 
        description: 'Slash!', 
        damageComponents: [{ dice: '2d6', type: 'slashing', _key: 'row1' }]
      }]),
    };

    const { rerender } = render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // 1. Reveal row's ability picker
    const toggleBtn = screen.getByTitle('Toggle Ability Bonus Modifier');
    fireEvent.click(toggleBtn);

    // 2. Select STR inside the row container
    const rowContainer = screen.getByTestId('char-card-action-0-dmg-row-0');
    const strBtn = within(rowContainer).getByRole('button', { name: 'STR' });
    fireEvent.click(strBtn);

    expect(onUpdateMock).toHaveBeenCalled();
    let updatedActions = JSON.parse(onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0].actions);
    expect(updatedActions[0].damageComponents[0].bonusAbility).toBe('STR');

    // 3. Rerender with updated actions containing bonusAbility: STR
    onUpdateMock.mockClear();
    const pcCharacterWithAbility = {
      ...pcCharacter,
      actions: JSON.stringify(updatedActions)
    };

    rerender(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacterWithAbility}
        onUpdate={onUpdateMock}
      />
    );

    // 4. Click Auto button (should now be enabled since bonusAbility is set) inside the row container
    const updatedRowContainer = screen.getByTestId('char-card-action-0-dmg-row-0');
    const autoBtn = within(updatedRowContainer).getByRole('button', { name: /Auto/i });
    expect(autoBtn).not.toBeDisabled();
    fireEvent.click(autoBtn);

    expect(onUpdateMock).toHaveBeenCalled();
    updatedActions = JSON.parse(onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0].actions);
    expect(updatedActions[0].damageComponents[0].bonus).toBe(3); // +3 STR modifier only, no proficiency bonus
  });

  it('fires toast when ability score change causes stale auto-computed values, and clicking Recalculate recalculates and calls onUpdate', () => {
    vi.mocked(toast).mockClear();
    const onUpdateMock = vi.fn();
    const pcCharacter = {
      ...defaultCharacter,
      level: 1, // +2 prof bonus
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      actions: JSON.stringify([{
        name: 'Slash',
        description: 'Attack',
        atkAbility: 'STR',
        atkAutoComputed: true,
        attackBonus: 2, // STR 10 (mod 0) + prof 2 = 2. Currently NOT stale.
      }]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // Edit STR score to 14 (mod +2) -> new computed attack bonus = 2 + 2 = 4 (stale!)
    const strInput = screen.getByLabelText('STR score');
    fireEvent.change(strInput, { target: { value: '14' } });
    fireEvent.blur(strInput);

    expect(toast).toHaveBeenCalledWith(
      '1 action value is out of date.',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Recalculate',
          onClick: expect.any(Function),
        }),
      })
    );

    // Call the Recalculate action's onClick handler
    const toastCall = vi.mocked(toast).mock.calls.find(call => call[0] === '1 action value is out of date.');
    const actionObj = (toastCall?.[1] as any)?.action;
    actionObj.onClick();

    expect(onUpdateMock).toHaveBeenCalled();
    const lastCall = onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0];
    const recalculatedActions = JSON.parse(lastCall.actions);
    expect(recalculatedActions[0].attackBonus).toBe(4);
  });

  it('does NOT fire toast when ability score change does not create stale values', () => {
    vi.mocked(toast).mockClear();
    const onUpdateMock = vi.fn();
    const pcCharacter = {
      ...defaultCharacter,
      actions: '[]',
      reactions: '[]',
      bonusActions: '[]',
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    const strInput = screen.getByLabelText('STR score');
    fireEvent.change(strInput, { target: { value: '14' } });
    fireEvent.blur(strInput);

    expect(toast).not.toHaveBeenCalled();
  });

  it('fires toast when level change causes stale auto-computed values, and clicking Recalculate recalculates', () => {
    vi.mocked(toast).mockClear();
    const onUpdateMock = vi.fn();
    const pcCharacter = {
      ...defaultCharacter,
      level: 1, // +2 prof bonus
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      actions: JSON.stringify([{
        name: 'Slash',
        description: 'Attack',
        atkAbility: 'STR',
        atkAutoComputed: true,
        attackBonus: 2, // +2 prof bonus
      }]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    const levelInput = screen.getByDisplayValue('1');
    fireEvent.change(levelInput, { target: { value: '5' } }); // level 5 -> +3 prof bonus -> new atkBonus = 3 (stale!)
    fireEvent.blur(levelInput);

    expect(toast).toHaveBeenCalledWith(
      '1 action value is out of date.',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Recalculate',
          onClick: expect.any(Function),
        }),
      })
    );

    const toastCall = vi.mocked(toast).mock.calls.find(call => call[0] === '1 action value is out of date.');
    const actionObj = (toastCall?.[1] as any)?.action;
    actionObj.onClick();

    expect(onUpdateMock).toHaveBeenCalled();
    const lastCall = onUpdateMock.mock.calls[onUpdateMock.mock.calls.length - 1][0];
    const recalculatedActions = JSON.parse(lastCall.actions);
    expect(recalculatedActions[0].attackBonus).toBe(3);
  });

  it('skips toast and auto-recalculates immediately in single onUpdate call when autoRefreshMechanics is true', () => {
    vi.mocked(toast).mockClear();
    const onUpdateMock = vi.fn();
    const pcCharacter = {
      ...defaultCharacter,
      level: 1, // +2 prof bonus
      autoRefreshMechanics: true,
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      actions: JSON.stringify([{
        name: 'Slash',
        description: 'Attack',
        atkAbility: 'STR',
        atkAutoComputed: true,
        attackBonus: 2, // STR 10 (mod 0) + prof 2 = 2.
      }]),
    };

    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={pcCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // Edit STR score to 14 (mod +2) -> new computed attack bonus = 2 + 2 = 4
    const strInput = screen.getByLabelText('STR score');
    fireEvent.change(strInput, { target: { value: '14' } });
    fireEvent.blur(strInput);

    // Should NOT show toast
    expect(toast).not.toHaveBeenCalled();

    // Should call onUpdate ONCE with both abilityScores/proficiencies and recalculated actions
    expect(onUpdateMock).toHaveBeenCalledTimes(1);
    const callArg = onUpdateMock.mock.calls[0][0];
    expect(callArg.abilityScores).toBeDefined();
    const recalculatedActions = JSON.parse(callArg.actions);
    expect(recalculatedActions[0].attackBonus).toBe(4);
  });

  it('verifies the relocated Class field side-effects inside SpellcastingStatsRow', () => {
    // Class-related side-effects: changing the class to "Wizard" should display INT spellcasting stats
    const { rerender } = render(
      <CharacterCardExpanded
        {...defaultProps}
        character={{
          ...defaultCharacter,
          class: 'Wizard',
          abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 16, WIS: 10, CHA: 10 }), // INT +3
        }}
      />
    );
    // Wizard spellcasting is based on INT. With level 2, prof bonus is +2. Save DC = 8 + 2 + 3 = 13.
    expect(screen.getByText(/Spell Save DC:/i)).toHaveTextContent('13');

    // Rerender as Cleric (WIS based). With WIS 10 (mod 0), Save DC = 8 + 2 + 0 = 10.
    rerender(
      <CharacterCardExpanded
        {...defaultProps}
        character={{
          ...defaultCharacter,
          class: 'Cleric',
          abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 16, WIS: 10, CHA: 10 }),
        }}
      />
    );
    expect(screen.getByText(/Spell Save DC:/i)).toHaveTextContent('10');
  });

  it('verifies the new stat row\'s 5 fields (LEVEL, AC, HP, TEMP, MAX) with updates and side-effects', () => {
    const onUpdateMock = vi.fn();
    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={defaultCharacter}
        onUpdate={onUpdateMock}
      />
    );

    // LEVEL
    const levelInput = screen.getByText('LEVEL').nextElementSibling as HTMLInputElement;
    expect(levelInput.value).toBe('2');
    fireEvent.change(levelInput, { target: { value: '4' } });
    fireEvent.blur(levelInput);
    expect(onUpdateMock).toHaveBeenCalledWith({ level: 4 });

    // AC
    onUpdateMock.mockClear();
    const acInput = screen.getByText('AC').nextElementSibling as HTMLInputElement;
    expect(acInput.value).toBe('15');
    fireEvent.change(acInput, { target: { value: '18' } });
    fireEvent.blur(acInput);
    expect(onUpdateMock).toHaveBeenCalledWith({ ac: 18 });

    // HP (currentHp)
    onUpdateMock.mockClear();
    const hpInput = screen.getByText('HP').nextElementSibling as HTMLInputElement;
    expect(hpInput.value).toBe('20');
    fireEvent.change(hpInput, { target: { value: '12' } });
    fireEvent.blur(hpInput);
    expect(onUpdateMock).toHaveBeenCalledWith({ currentHp: 12 });

    // TEMP (tempHp)
    onUpdateMock.mockClear();
    const tempInput = screen.getByText('TEMP').nextElementSibling as HTMLInputElement;
    expect(tempInput.value).toBe('0');
    fireEvent.change(tempInput, { target: { value: '5' } });
    fireEvent.blur(tempInput);
    expect(onUpdateMock).toHaveBeenCalledWith({ tempHp: 5 });

    // MAX (maxHp)
    onUpdateMock.mockClear();
    const maxInput = screen.getByText('MAX').nextElementSibling as HTMLInputElement;
    expect(maxInput.value).toBe('20');
    fireEvent.change(maxInput, { target: { value: '25' } });
    fireEvent.blur(maxInput);
    expect(onUpdateMock).toHaveBeenCalledWith({ maxHp: 25 });
  });

  it('verifies the ability score table\'s 1-30 clamp/commit behavior on blur', () => {
    const onUpdateMock = vi.fn();
    render(
      <CharacterCardExpanded
        {...defaultProps}
        character={{
          ...defaultCharacter,
          abilityScores: JSON.stringify({ STR: 15, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
        }}
        onUpdate={onUpdateMock}
      />
    );

    const strInput = screen.getByLabelText('STR score');

    // Clamp high value to 30
    fireEvent.change(strInput, { target: { value: '35' } });
    fireEvent.blur(strInput);
    const strCall = onUpdateMock.mock.calls.find(call => call[0].abilityScores);
    expect(strCall).toBeDefined();
    const parsedScoresHigh = JSON.parse(strCall![0].abilityScores);
    expect(parsedScoresHigh.STR).toBe(30);

    // Clamp low value to 1
    onUpdateMock.mockClear();
    fireEvent.change(strInput, { target: { value: '0' } });
    fireEvent.blur(strInput);
    const strCallLow = onUpdateMock.mock.calls.find(call => call[0].abilityScores);
    expect(strCallLow).toBeDefined();
    const parsedScoresLow = JSON.parse(strCallLow![0].abilityScores);
    expect(parsedScoresLow.STR).toBe(1);
  });

  it('verifies PROF is represented as plain read-only text and has no edit triggers', () => {
    render(<CharacterCardExpanded {...defaultProps} character={defaultCharacter} />);
    
    // Check if plain text PROF +2 is present
    const profElement = screen.getByText('PROF +2');
    expect(profElement).toBeInTheDocument();
    
    // Verify it's a div (plain text) and not an input
    expect(profElement.tagName).toBe('DIV');
    expect(screen.queryByLabelText('PROF')).not.toBeInTheDocument();
  });

  it('verifies Skills expanded checkbox and Expertise star toggle behavior', () => {
    const onUpdateMock = vi.fn();
    const { rerender } = render(
      <CharacterCardExpanded
        {...defaultProps}
        character={{
          ...defaultCharacter,
          proficiencies: JSON.stringify({
            savingThrows: [],
            skills: { Athletics: 'none' },
            jackOfAllTrades: false,
          }),
        }}
        onUpdate={onUpdateMock}
      />
    );

    // 1. Click "Show all skills" to expand the list
    const expandBtn = screen.getByRole('button', { name: /show all skills/i });
    fireEvent.click(expandBtn);

    // Find the Athletics skill checkbox and star button by element ID
    const athleticsChk = document.getElementById('skill-chk-athletics') as HTMLInputElement;
    const athleticsStar = document.getElementById('skill-exp-athletics') as HTMLButtonElement;

    expect(athleticsChk).toBeInTheDocument();
    expect(athleticsStar).toBeInTheDocument();
    expect(athleticsChk.checked).toBe(false);

    // 2. Toggle proficiency (Checkbox clicked)
    fireEvent.click(athleticsChk);
    expect(onUpdateMock).toHaveBeenCalled();
    const skillsCall1 = JSON.parse(onUpdateMock.mock.calls[0][0].proficiencies).skills;
    expect(skillsCall1.Athletics).toBe('proficient');

    // Rerender with 'proficient' Athletics to test the star expertise behavior
    onUpdateMock.mockClear();
    rerender(
      <CharacterCardExpanded
        {...defaultProps}
        character={{
          ...defaultCharacter,
          proficiencies: JSON.stringify({
            savingThrows: [],
            skills: { Athletics: 'proficient' },
            jackOfAllTrades: false,
          }),
        }}
        onUpdate={onUpdateMock}
      />
    );

    // Star should render as '☆' (ready for expertise toggle)
    const starBtnProf = document.getElementById('skill-exp-athletics') as HTMLButtonElement;
    expect(starBtnProf).toBeInTheDocument();
    expect(starBtnProf.textContent).toBe('☆');

    // 3. Toggle expertise (Star clicked)
    fireEvent.click(starBtnProf);
    expect(onUpdateMock).toHaveBeenCalled();
    const skillsCall2 = JSON.parse(onUpdateMock.mock.calls[0][0].proficiencies).skills;
    expect(skillsCall2.Athletics).toBe('expertise');

    // Rerender with 'expertise' Athletics to test turning expertise off back to proficient
    onUpdateMock.mockClear();
    rerender(
      <CharacterCardExpanded
        {...defaultProps}
        character={{
          ...defaultCharacter,
          proficiencies: JSON.stringify({
            savingThrows: [],
            skills: { Athletics: 'expertise' },
            jackOfAllTrades: false,
          }),
        }}
        onUpdate={onUpdateMock}
      />
    );

    const starBtnExp = document.getElementById('skill-exp-athletics') as HTMLButtonElement;
    expect(starBtnExp).toBeInTheDocument();
    expect(starBtnExp.textContent).toBe('★');
    expect(screen.getByText('(exp)')).toBeInTheDocument();

    // 4. Click Star button again (demotes to proficient)
    fireEvent.click(starBtnExp);
    expect(onUpdateMock).toHaveBeenCalled();
    const skillsCall3 = JSON.parse(onUpdateMock.mock.calls[0][0].proficiencies).skills;
    expect(skillsCall3.Athletics).toBe('proficient');
  });

  it('renders Hit-Dice, Resources, and IRV sections, and supports column direction', () => {
    const { container } = render(
      <CharacterCardExpanded
        {...defaultProps}
        character={{
          ...defaultCharacter,
          resistances: 'fire',
          immunities: 'cold',
          vulnerabilities: 'poison',
        }}
      />
    );

    // Verify sections are present
    expect(screen.getByText('Hit Dice')).toBeInTheDocument();
    expect(screen.getByText('Class Resource Trackers')).toBeInTheDocument();
    expect(screen.getByText('Resistances')).toBeInTheDocument();
    expect(screen.getByText('Immunities')).toBeInTheDocument();
    expect(screen.getByText('Vulnerabilities')).toBeInTheDocument();

    // Verify the grid structure exists (e.g. md:grid-cols-2 is applied)
    const gridDiv = container.querySelector('.grid-cols-1.md\\:grid-cols-2');
    expect(gridDiv).toBeInTheDocument();
  });

  it('renders Speed, Senses, and Languages gated inputs only when gmControlled is true and handles changes', () => {
    const onUpdateMock = vi.fn();

    // Render with gmControlled: false (gated fields should NOT be rendered)
    const { rerender } = render(
      <CharacterCardExpanded
        {...defaultProps}
        character={{
          ...defaultCharacter,
          gmControlled: false,
        }}
        onUpdate={onUpdateMock}
      />
    );

    expect(screen.queryByPlaceholderText('e.g. 30 ft., fly 60 ft.')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. darkvision 60 ft.')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. Common')).not.toBeInTheDocument();

    // Rerender with gmControlled: true (gated fields should be present)
    rerender(
      <CharacterCardExpanded
        {...defaultProps}
        character={{
          ...defaultCharacter,
          gmControlled: true,
          speed: '30 ft.',
          senses: 'darkvision 60 ft.',
          languages: 'Common',
        }}
        onUpdate={onUpdateMock}
      />
    );

    const speedInput = screen.getByPlaceholderText('e.g. 30 ft., fly 60 ft.');
    const sensesInput = screen.getByPlaceholderText('e.g. darkvision 60 ft.');
    const languagesInput = screen.getByPlaceholderText('e.g. Common');

    expect(speedInput).toBeInTheDocument();
    expect(sensesInput).toBeInTheDocument();
    expect(languagesInput).toBeInTheDocument();

    // Verify positioning: they should be in the right column container (space-y-6)
    // integrated into the first grid's right column
    const passiveHeader = screen.getByText('PASSIVE');
    const rightColumn = passiveHeader.closest('.space-y-6');
    expect(rightColumn).toContainElement(speedInput);
    expect(rightColumn).toContainElement(sensesInput);
    expect(rightColumn).toContainElement(languagesInput);

    expect(speedInput).toHaveValue('30 ft.');
    expect(sensesInput).toHaveValue('darkvision 60 ft.');
    expect(languagesInput).toHaveValue('Common');

    // Trigger changes
    fireEvent.change(speedInput, { target: { value: '40 ft.' } });
    fireEvent.blur(speedInput);
    expect(onUpdateMock).toHaveBeenCalledWith({ speed: '40 ft.' });

    fireEvent.change(sensesInput, { target: { value: 'tremorsense 30 ft.' } });
    fireEvent.blur(sensesInput);
    expect(onUpdateMock).toHaveBeenCalledWith({ senses: 'tremorsense 30 ft.' });

    fireEvent.change(languagesInput, { target: { value: 'Elvish' } });
    fireEvent.blur(languagesInput);
    expect(onUpdateMock).toHaveBeenCalledWith({ languages: 'Elvish' });
  });
});

