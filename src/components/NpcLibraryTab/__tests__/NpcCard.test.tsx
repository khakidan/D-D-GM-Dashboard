import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup, screen, within } from '@testing-library/react';
import { NpcCard } from '../NpcCard';
import { NPC } from '../../../types';
import { AbilityScores, proficiencyBonusFromCR } from '../../../lib/abilityScores';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe('NpcCard', () => {

  it('identifies stale values in legendary actions and recalculates them (Stage 5 Parity)', () => {
    const initialLegendary = [{
      name: 'Tail Attack',
      description: '...',
      attackBonus: 5, // STALE (should be prof 2 + str 4 = 6)
      atkAutoComputed: true,
      atkAbility: 'STR' as const
    }];
    const mockNpcWithLegendary = {
      ...mockNpcForMemoTests,
      id: 'npc-stale-legendary',
      abilityScores: JSON.stringify({ STR: 18, DEX: 14, CON: 14, INT: 10, WIS: 10, CHA: 10 }), // STR mod +4
      challengeRating: '2', // Prof +2 -> Atk = 6
      legendaryActionsList: JSON.stringify(initialLegendary)
    };
    
    let updateCalls: any[] = [];
    const onUpdate = (updates: Partial<any>) => {
      updateCalls.push(updates);
    };

    render(
      <NpcCard
        npc={mockNpcWithLegendary}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Edit ability score to trigger stale check. 18 -> 20 (STR mod +5, Atk = 7)
    const strInput = screen.getByLabelText('STR score');
    fireEvent.change(strInput, { target: { value: '20' } });
    fireEvent.blur(strInput);

    // Expect the toast to show
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

    // Verify legendaryActionsList was updated
    const lastUpdate = updateCalls[updateCalls.length - 1];
    expect(lastUpdate.legendaryActionsList).toBeDefined();
    const parsedLegendary = JSON.parse(lastUpdate.legendaryActionsList);
    expect(parsedLegendary[0].attackBonus).toBe(7); // prof 2 + STR 5 = 7
  });

  afterEach(() => cleanup());

  it('adds a new trait with a synthetic _key', () => {
    const mockNpc: NPC = {
      id: 'npc-1',
      name: 'Goblin',
      ac: 15,
      maxHp: 7,
      notes: '',
      abilityScores: JSON.stringify({ STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 10, CHA: 8 }),
      proficiencies: JSON.stringify({}),
      speed: '30ft.',
      senses: '',
      languages: '',
      challengeRating: '0.25',
      traits: JSON.stringify([{ name: 'Nimble', description: 'Moves quickly' }]),
      actions: '[]',
      reactions: '[]',
      legendaryActionsList: '[]',
    };
    
    let updatedNpc: any = null;
    const onUpdate = (data: Partial<NPC>) => { updatedNpc = data; };

    // Use a wrapper component to manage expansion state
    const TestWrapper = () => {
      const [expanded, setExpanded] = React.useState(false);
      return (
        <NpcCard 
          npc={mockNpc} 
          isSyncing={false} 
          isExpanded={expanded} 
          onToggleExpand={() => setExpanded(!expanded)} 
          onUpdate={onUpdate} 
          onDelete={vi.fn()} 
        />
      );
    };

    const { getByLabelText, getByRole } = render(<TestWrapper />);

    // Expand NpcCard
    const expandButton = getByLabelText('Expand NPC card');
    fireEvent.click(expandButton);

    // Click "Add Trait" button
    const addTraitButton = getByRole('button', { name: /Add Trait/i });
    fireEvent.click(addTraitButton);

    // Verify new trait is added and has a _key
    expect(updatedNpc).not.toBeNull();
    const updatedTraits = JSON.parse(updatedNpc.traits);
    const newTrait = updatedTraits[updatedTraits.length - 1];
    
    expect(newTrait.name).toBe(''); // Default empty item
    expect(newTrait._key).toBeDefined();
    expect(typeof newTrait._key).toBe('string');
    expect(newTrait._key!.length).toBeGreaterThan(0);
  });

  it('supports adding, editing, and deleting actions inside NpcCard', () => {
    const mockNpc: NPC = {
      id: 'npc-1',
      name: 'Goblin',
      ac: 15,
      maxHp: 7,
      notes: '',
      abilityScores: JSON.stringify({ STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 10, CHA: 8 }),
      proficiencies: JSON.stringify({}),
      speed: '30ft.',
      senses: '',
      languages: '',
      challengeRating: '0.25',
      traits: '[]',
      actions: JSON.stringify([
        {
          name: 'Bite',
          description: 'Sharp teeth.',
          recharge: 'Recharge 5–6',
          attackBonus: 5,
          damage: '1d6+3',
        }
      ]),
      reactions: '[]',
      legendaryActionsList: '[]',
    };

    let currentNpc = { ...mockNpc };
    let updatedNpcUpdates: any = null;
    const onUpdate = (updates: Partial<NPC>) => {
      updatedNpcUpdates = updates;
      currentNpc = { ...currentNpc, ...updates };
    };

    const { rerender } = render(
      <NpcCard
        npc={currentNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Verify action name and recharge are shown
    const biteInput = screen.getByDisplayValue('Bite');
    expect(biteInput).toBeInTheDocument();

    const rechargeInput = screen.getByPlaceholderText('e.g. Recharge 5–6');
    expect(rechargeInput).toHaveValue('Recharge 5–6');
    expect(screen.queryByText('Cost')).not.toBeInTheDocument();

    // Edit recharge
    fireEvent.change(rechargeInput, { target: { value: 'Recharge 6' } });
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedActionsAfterEdit = JSON.parse(updatedNpcUpdates.actions || '[]');
    expect(parsedActionsAfterEdit[0].recharge).toBe('Recharge 6');

    // Click Add Action
    const addActionBtn = screen.getByRole('button', { name: /Add Action/i });
    fireEvent.click(addActionBtn);
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedActionsAfterAdd = JSON.parse(updatedNpcUpdates.actions || '[]');
    expect(parsedActionsAfterAdd.length).toBe(2);

    // Re-render so the DOM reflects the 2 actions before we try to remove one
    rerender(
      <NpcCard
        npc={currentNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Click Remove Action
    const removeBtns = screen.getAllByRole('button', { name: /Remove Action/i });
    fireEvent.click(removeBtns[0]);
    
    // Assert ConfirmationDialog appears and onChange is not yet called with removal
    expect(screen.getByText('Delete Action?')).toBeInTheDocument();
    
    // Click Confirm
    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmBtn);

    expect(updatedNpcUpdates).not.toBeNull();
    const parsedActionsAfterRemove = JSON.parse(updatedNpcUpdates.actions || '[]');
    // 2 items initially after addition, we removed 1, so 1 should remain
    expect(parsedActionsAfterRemove.length).toBe(1);
  });

  it('supports adding, editing, and deleting legendary actions inside NpcCard', () => {
    const mockNpc: NPC = {
      id: 'npc-1',
      name: 'Dragon',
      ac: 19,
      maxHp: 200,
      notes: '',
      abilityScores: JSON.stringify({ STR: 20, DEX: 10, CON: 20, INT: 10, WIS: 10, CHA: 10 }),
      proficiencies: JSON.stringify({}),
      speed: '40ft.',
      senses: '',
      languages: '',
      challengeRating: '10',
      traits: '[]',
      actions: '[]',
      reactions: '[]',
      legendaryActionsList: JSON.stringify([
        {
          name: 'Wing Attack',
          description: 'Beats wings.',
          cost: 2,
        }
      ]),
    };

    let currentNpc = { ...mockNpc };
    let updatedNpcUpdates: any = null;
    const onUpdate = (updates: Partial<NPC>) => {
      updatedNpcUpdates = updates;
      currentNpc = { ...currentNpc, ...updates };
    };

    const { rerender } = render(
      <NpcCard
        npc={currentNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Verify legendary action name, Cost label, and cost input are shown
    const wingInput = screen.getByDisplayValue('Wing Attack');
    expect(wingInput).toBeInTheDocument();

    // Edit name
    fireEvent.change(wingInput, { target: { value: 'Wing Buffet' } });
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedLegendaryAfterNameEdit = JSON.parse(updatedNpcUpdates.legendaryActionsList || '[]');
    expect(parsedLegendaryAfterNameEdit[0].name).toBe('Wing Buffet');

    expect(screen.getByText('Cost')).toBeInTheDocument();
    const costInput = screen.getByPlaceholderText('Cost (1-3)');
    expect(costInput).toHaveValue(2);

    // Edit cost
    fireEvent.change(costInput, { target: { value: '3' } });
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedLegendaryAfterEdit = JSON.parse(updatedNpcUpdates.legendaryActionsList || '[]');
    expect(parsedLegendaryAfterEdit[0].cost).toBe(3);

    // Click Add Legendary Action
    const addLegendaryBtn = screen.getByRole('button', { name: /Add Legendary Action/i });
    fireEvent.click(addLegendaryBtn);
    expect(updatedNpcUpdates).not.toBeNull();
    const parsedLegendaryAfterAdd = JSON.parse(updatedNpcUpdates.legendaryActionsList || '[]');
    expect(parsedLegendaryAfterAdd.length).toBe(2);

    // Re-render so the DOM reflects the 2 actions before we try to remove one
    rerender(
      <NpcCard
        npc={currentNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Click Remove Legendary Action
    const removeBtns = screen.getAllByRole('button', { name: /Remove Legendary Action/i });
    fireEvent.click(removeBtns[0]);
    
    // Assert ConfirmationDialog appears and onChange is not yet called with removal
    expect(screen.getByText('Delete Legendary Action?')).toBeInTheDocument();
    
    // Click Confirm
    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmBtn);

    expect(updatedNpcUpdates).not.toBeNull();
    const parsedLegendaryAfterRemove = JSON.parse(updatedNpcUpdates.legendaryActionsList || '[]');
    // 2 items initially after addition, we removed 1, so 1 should remain
    expect(parsedLegendaryAfterRemove.length).toBe(1);
  });

  it('calculates saving throw DC with multiple dcAbilities in NPC context', () => {
    const mockNpc: NPC = {
      id: 'npc-dc',
      name: 'Test Boss',
      ac: 15,
      maxHp: 100,
      notes: '',
      abilityScores: JSON.stringify({ STR: 15, DEX: 16, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      proficiencies: JSON.stringify({}),
      speed: '30ft.',
      senses: '',
      languages: '',
      challengeRating: '5', // +3 prof bonus
      traits: '[]',
      actions: JSON.stringify([{ 
        name: 'Breath', 
        description: 'Fire!', 
        dcAbilities: ['STR', 'DEX'] // DC = 8 + 3 + (2) + (3) = 16
      }]),
      reactions: '[]',
      legendaryActionsList: '[]',
    };

    let updatedNpcUpdates: any = null;
    const onUpdate = (updates: Partial<NPC>) => { updatedNpcUpdates = updates; };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Click Auto-fill
    const autoFillBtn = screen.getByRole('button', { name: /auto-fill dc/i });
    fireEvent.click(autoFillBtn);

    expect(updatedNpcUpdates).not.toBeNull();
    const parsedActions = JSON.parse(updatedNpcUpdates.actions || '[]');
    expect(parsedActions[0].saveDC).toBe(16);
  });

  it('calculates attack bonus with atkAbility in NPC context', () => {
    const mockNpc: NPC = {
      id: 'npc-atk',
      name: 'Test Attacker',
      ac: 15,
      maxHp: 100,
      notes: '',
      abilityScores: JSON.stringify({ STR: 18, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      proficiencies: JSON.stringify({}),
      speed: '30ft.',
      senses: '',
      languages: '',
      challengeRating: '5', // +3 prof bonus
      traits: '[]',
      actions: JSON.stringify([{ 
        name: 'Greatsword', 
        description: 'Slash!', 
        atkAbility: 'STR' // Attack Bonus = 3 + 4 = 7
      }]),
      reactions: '[]',
      legendaryActionsList: '[]',
    };

    let updatedNpcUpdates: any = null;
    const onUpdate = (updates: Partial<NPC>) => { updatedNpcUpdates = updates; };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Click Auto-fill Atk
    const autoFillBtn = screen.getByRole('button', { name: 'Auto-fill Atk' });
    fireEvent.click(autoFillBtn);

    expect(updatedNpcUpdates).not.toBeNull();
    const parsedActions = JSON.parse(updatedNpcUpdates.actions || '[]');
    expect(parsedActions[0].attackBonus).toBe(7);
  });

  const mockNpcForMemoTests: NPC = {
    id: 'npc-memo-1',
    name: 'Kobold',
    ac: 12,
    maxHp: 5,
    notes: '',
    abilityScores: JSON.stringify({ STR: 7, DEX: 15, CON: 9, INT: 8, WIS: 7, CHA: 8 }),
    proficiencies: JSON.stringify({}),
    speed: '30ft.',
    senses: '',
    languages: '',
    challengeRating: '0.125',
    traits: '[]',
    actions: '[]',
    reactions: '[]',
    legendaryActionsList: '[]',
  };

  it('does not re-render when only callback props change reference (same npc/isSyncing/isExpanded)', async () => {
    const abilityScores = await import('../../../lib/abilityScores');
    const spy = vi.spyOn(abilityScores, 'parseAbilityScores');
    spy.mockClear();

    function Wrapper() {
      // Fresh callback references every render, exactly like NpcLibraryTab.tsx's real
      // .map() call site does — this is the scenario the custom comparator is
      // specifically meant to ignore.
      return (
        <NpcCard
          npc={mockNpcForMemoTests}
          isSyncing={false}
          isExpanded={false}
          onToggleExpand={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      );
    }

    const { rerender } = render(<Wrapper />);
    const callsAfterFirstRender = spy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    rerender(<Wrapper />);

    // parseAbilityScores is called at the top of NpcCard's own function body on
    // every actual execution — if the memo comparator correctly bailed out, this
    // spy's call count must not have increased at all.
    expect(spy.mock.calls.length).toBe(callsAfterFirstRender);

    spy.mockRestore();
  });

  it('does re-render when npc reference actually changes', async () => {
    const abilityScores = await import('../../../lib/abilityScores');
    const spy = vi.spyOn(abilityScores, 'parseAbilityScores');
    spy.mockClear();

    const updatedNpc = { ...mockNpcForMemoTests, maxHp: 8 };

    function Wrapper({ npc }: { npc: NPC }) {
      return (
        <NpcCard
          npc={npc}
          isSyncing={false}
          isExpanded={false}
          onToggleExpand={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      );
    }

    const { rerender } = render(<Wrapper npc={mockNpcForMemoTests} />);
    const callsAfterFirstRender = spy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    rerender(<Wrapper npc={updatedNpc} />);

    // A genuinely different npc object (the one actually being updated) must still
    // cause a real re-render — the comparator must not over-suppress this.
    expect(spy.mock.calls.length).toBeGreaterThan(callsAfterFirstRender);

    spy.mockRestore();
  });

  it('auto-collapses empty sections in display context (NpcCard)', () => {
    const mockNpcWithEmptyTraits: NPC = {
      ...mockNpcForMemoTests,
      id: 'npc-empty-traits',
      traits: '[]',
      actions: JSON.stringify([{ name: 'Attack', description: 'Hit stuff' }]),
    };

    render(
      <NpcCard
        npc={mockNpcWithEmptyTraits}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Actions section has items, so it should be expanded
    expect(screen.getByText('Add Action')).toBeInTheDocument();

    // Traits section is empty, so it should be collapsed by defaultExpanded={traits.length > 0}
    expect(screen.queryByText('Add Trait')).not.toBeInTheDocument();

    // Clicking Traits header should expand it
    fireEvent.click(screen.getByText('Traits'));
    expect(screen.getByText('Add Trait')).toBeInTheDocument();
  });

  it('legendary pip trackers stay visible even when Legendary Actions list is collapsed', () => {
    const mockNpcWithLegendary: NPC = {
      ...mockNpcForMemoTests,
      id: 'npc-legendary',
      legendaryActions: 3,
      legendaryResistances: 3,
      legendaryActionsList: JSON.stringify([{ name: 'Tail Swipe', description: 'Hits back', cost: 1 }]),
    };

    render(
      <NpcCard
        npc={mockNpcWithLegendary}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Initially expanded
    expect(screen.getByDisplayValue('Tail Swipe')).toBeInTheDocument();
    // Pip trackers (NpcLegendarySection) should be visible
    expect(screen.getAllByText(/Legendary Actions/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Resistances/i)).toBeInTheDocument();

    // Click the "Legendary Actions" list header to collapse it
    // We need to be careful because there are two "Legendary Actions" texts:
    // 1. The pip tracker label
    // 2. The NpcListEditor title
    // In NpcCard, the list editor title is what has the click handler.
    const listHeader = screen.getAllByText('Legendary Actions').find(el => el.closest('div')?.classList.contains('cursor-pointer'));
    expect(listHeader).toBeDefined();
    fireEvent.click(listHeader!);

    // List content should be gone
    expect(screen.queryByDisplayValue('Tail Swipe')).not.toBeInTheDocument();

    // BUT pip trackers (NpcLegendarySection) must still be visible per resolved design
    expect(screen.getAllByText(/Legendary Actions/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Resistances/i)).toBeInTheDocument();
  });

  it('renders CR badge and legendary indicators in collapsed view', () => {
    const mockNpc: NPC = {
      ...mockNpcForMemoTests,
      id: 'npc-indicators',
      name: 'Legendary Beast',
      challengeRating: '15',
      legendaryActions: 3,
      legendaryResistances: 3,
      spellcastingAbility: undefined, // No spellcasting
    };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={false}
        onToggleExpand={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Verify CR badge
    expect(screen.getByText('CR 15')).toBeInTheDocument();

    // Verify legendary indicators (not in expanded view, but in the collapsed-indicators container)
    expect(screen.getByText('3 Legendary Actions')).toBeInTheDocument();
    expect(screen.getByText('3 Legendary Resistances')).toBeInTheDocument();
    
    // SpellcastingStatsRow should NOT be rendered (spellcastingAbility is undefined)
    expect(screen.queryByText(/Spell Save DC/i)).not.toBeInTheDocument();
  });

  it('renders and compiles a multi-row, NO-bonus damageComponents list matching dragon breath weapon', () => {
    // 3 rows: "14d8 cold", "10d8 poison", "6d8 necrotic", no ability/bonus on any row
    const mockNpc: NPC = {
      ...mockNpcForMemoTests,
      id: 'npc-dragon-breath',
      name: 'Adult Green Dragon',
      actions: JSON.stringify([{
        name: 'Poison Breath',
        description: 'Breathes poison.',
        damage: '14d8 cold & 10d8 poison & 6d8 necrotic',
        damageComponents: [
          { dice: '14d8', type: 'cold', _key: 'row1' },
          { dice: '10d8', type: 'poison', _key: 'row2' },
          { dice: '6d8', type: 'necrotic', _key: 'row3' },
        ]
      }]),
    };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Get the damage input by its ID (npc-card-action-0-dmg)
    const dmgInput = document.getElementById('npc-card-action-0-dmg') as HTMLInputElement;
    expect(dmgInput).toBeInTheDocument();
    expect(dmgInput).toBeDisabled();
    expect(dmgInput.value).toBe('14d8 cold & 10d8 poison & 6d8 necrotic');
  });

  it('fires toast when ability score change causes stale auto-computed values in NpcCard', () => {
    vi.mocked(toast).mockClear();
    const mockNpc: NPC = {
      ...mockNpcForMemoTests,
      id: 'npc-stale-1',
      challengeRating: '1', // +2 prof bonus
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      actions: JSON.stringify([{
        name: 'Claw',
        description: 'Atk',
        atkAbility: 'STR',
        atkAutoComputed: true,
        attackBonus: 2,
      }]),
    };

    let updatedNpcUpdates: any = null;
    const onUpdate = (updates: Partial<NPC>) => { updatedNpcUpdates = updates; };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    const strInput = screen.getByLabelText('STR score');
    fireEvent.change(strInput, { target: { value: '16' } }); // +3 mod -> new atkBonus = 5 (stale!)
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

    const toastCall = vi.mocked(toast).mock.calls.find(call => call[0] === '1 action value is out of date.');
    const actionObj = (toastCall?.[1] as any)?.action;
    actionObj.onClick();

    expect(updatedNpcUpdates).not.toBeNull();
    const recalculatedActions = JSON.parse(updatedNpcUpdates.actions);
    expect(recalculatedActions[0].attackBonus).toBe(5);
  });

  it('fires toast when CR change causes stale auto-computed values in NpcCard', () => {
    vi.mocked(toast).mockClear();
    const mockNpc: NPC = {
      ...mockNpcForMemoTests,
      id: 'npc-stale-2',
      challengeRating: '1', // +2 prof bonus
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      actions: JSON.stringify([{
        name: 'Claw',
        description: 'Atk',
        atkAbility: 'STR',
        atkAutoComputed: true,
        attackBonus: 2,
      }]),
    };

    let updatedNpcUpdates: any = null;
    const onUpdate = (updates: Partial<NPC>) => { updatedNpcUpdates = updates; };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    const crInput = screen.getByDisplayValue('1');
    fireEvent.change(crInput, { target: { value: '5' } }); // CR 5 -> +3 prof bonus -> new atkBonus = 3 (stale!)
    fireEvent.blur(crInput);

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

    expect(updatedNpcUpdates).not.toBeNull();
    const recalculatedActions = JSON.parse(updatedNpcUpdates.actions);
    expect(recalculatedActions[0].attackBonus).toBe(3);
  });

  it('skips toast and auto-recalculates immediately in single onUpdate call when autoRefreshMechanics is true in NpcCard', () => {
    vi.mocked(toast).mockClear();
    const mockNpc: NPC = {
      ...mockNpcForMemoTests,
      id: 'npc-auto-1',
      challengeRating: '1', // +2 prof bonus
      autoRefreshMechanics: true,
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      actions: JSON.stringify([{
        name: 'Claw',
        description: 'Atk',
        atkAbility: 'STR',
        atkAutoComputed: true,
        attackBonus: 2,
      }]),
    };

    let updatedNpcUpdates: any = null;
    const onUpdate = (updates: Partial<NPC>) => { updatedNpcUpdates = updates; };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    const strInput = screen.getByLabelText('STR score');
    fireEvent.change(strInput, { target: { value: '16' } }); // +3 mod -> new atkBonus = 5
    fireEvent.blur(strInput);

    expect(toast).not.toHaveBeenCalled();

    expect(updatedNpcUpdates).not.toBeNull();
    expect(updatedNpcUpdates.abilityScores).toBeDefined();
    const recalculatedActions = JSON.parse(updatedNpcUpdates.actions);
    expect(recalculatedActions[0].attackBonus).toBe(5);
  });

  it('syncs proficiencyBonus when challengeRating changes and preserves other proficiency fields with exactly one onUpdate call', () => {
    const initialProficiencies = {
      proficiencyBonus: 2,
      savingThrows: ['STR', 'CON'],
      skills: { Perception: 'proficient' },
      passiveBonuses: { perception: 2, insight: 0, investigation: 0 },
    };
    const mockNpc: NPC = {
      id: 'npc-cr-sync',
      name: 'Dragon',
      ac: 18,
      maxHp: 200,
      notes: '',
      abilityScores: JSON.stringify({ STR: 20, DEX: 10, CON: 18, INT: 14, WIS: 14, CHA: 18 }),
      proficiencies: JSON.stringify(initialProficiencies),
      speed: '40ft.',
      senses: '',
      languages: '',
      challengeRating: '1',
      traits: '[]',
      actions: '[]',
      reactions: '[]',
      legendaryActionsList: '[]',
      autoRefreshMechanics: false,
    };

    let updateCalls: any[] = [];
    const onUpdate = (updates: Partial<NPC>) => {
      updateCalls.push(updates);
    };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    const crInput = screen.getByDisplayValue('1');
    fireEvent.change(crInput, { target: { value: '10' } });
    fireEvent.blur(crInput);

    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0].challengeRating).toBe('10');
    expect(updateCalls[0].proficiencies).toBeDefined();

    const updatedProfs = JSON.parse(updateCalls[0].proficiencies);
    expect(updatedProfs.proficiencyBonus).toBe(4); // CR 10 prof bonus is 4
    expect(updatedProfs.savingThrows).toEqual(['STR', 'CON']);
    expect(updatedProfs.skills).toEqual({ Perception: 'proficient' });
    expect(updatedProfs.passiveBonuses).toEqual({ perception: 2, insight: 0, investigation: 0 });
  });

  it('confirms Legendary Actions render Range, Atk Basis, and Damage Builder fields and round-trip successfully', () => {
    let currentNpc = { ...mockNpcForMemoTests, actions: '[]', legendaryActionsList: '[]', legendaryActions: 3 };
    const onUpdate = (updates: Partial<any>) => {
      currentNpc = { ...currentNpc, ...updates };
    };

    const { rerender } = render(
      <NpcCard
        npc={currentNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Initial state: no legendary actions
    expect(screen.queryByPlaceholderText('reach 10 ft. / 30 ft. cone')).not.toBeInTheDocument();

    // Expand Legendary Actions section first
    const legendaryHeader = screen.getAllByText('Legendary Actions')[1];
    fireEvent.click(legendaryHeader);
    
    // Add a legendary action
    const addLegendaryBtn = screen.getByRole('button', { name: /Add Legendary Action/i });
    fireEvent.click(addLegendaryBtn);

    rerender(
      <NpcCard
        npc={currentNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Verify Range field is now present
    const rangeInput = screen.getByPlaceholderText('reach 10 ft. / 30 ft. cone');
    expect(rangeInput).toBeInTheDocument();

    // Stage 5: Legendary Actions DO support Auto-fill Atk/DC basis chips and damage builder
    expect(screen.getByText('Atk Basis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle damage builder/i })).toBeInTheDocument();

    // Edit the Range field
    fireEvent.change(rangeInput, { target: { value: '120 ft.' } });

    // Verify JSON serialization includes the new range field
    const parsedLegendary = JSON.parse(currentNpc.legendaryActionsList || '[]');
    expect(parsedLegendary.length).toBe(1);
    expect(parsedLegendary[0].range).toBe('120 ft.');
  });

  it('identifies stale values in legendaryActionsList when CR or scores change and recalculates them on toast click in NpcCard (Stage 5 Parity)', () => {
    vi.mocked(toast).mockClear();
    const mockNpc: NPC = {
      ...mockNpcForMemoTests,
      id: 'npc-legendary-stale',
      challengeRating: '1', // +2 prof bonus
      abilityScores: JSON.stringify({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
      legendaryActionsList: JSON.stringify([{
        name: 'Tail Sweep',
        description: 'Sweep',
        atkAbility: 'STR',
        atkAutoComputed: true,
        attackBonus: 2, // STR +0, PROF +2 = 2
      }]),
    };

    let updatedNpcUpdates: any = null;
    const onUpdate = (updates: Partial<NPC>) => { updatedNpcUpdates = updates; };

    render(
      <NpcCard
        npc={mockNpc}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    const crInput = screen.getByPlaceholderText('—');
    fireEvent.change(crInput, { target: { value: '5' } }); // CR 5 -> +3 prof bonus -> new atkBonus = 3
    fireEvent.blur(crInput);

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

    expect(updatedNpcUpdates).not.toBeNull();
    const recalculatedLegendary = JSON.parse(updatedNpcUpdates.legendaryActionsList);
    expect(recalculatedLegendary[0].attackBonus).toBe(3);
  });

  it('clamps ability score inputs between 1 and 30 on blur or enter commit (Stage 6 Layout Parity)', () => {
    let updateCalls: any[] = [];
    const onUpdate = (updates: Partial<any>) => {
      updateCalls.push(updates);
    };

    render(
      <NpcCard
        npc={mockNpcForMemoTests}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    const strInput = screen.getByLabelText('STR score');
    // Entering 35 clamps to 30
    fireEvent.change(strInput, { target: { value: '35' } });
    fireEvent.blur(strInput);

    expect(updateCalls.length).toBe(1);
    const parsedScoresClampedMax = JSON.parse(updateCalls[0].abilityScores);
    expect(parsedScoresClampedMax.STR).toBe(30);

    // Entering 0 clamps to 1
    fireEvent.change(strInput, { target: { value: '0' } });
    fireEvent.blur(strInput);

    expect(updateCalls.length).toBe(2);
    const parsedScoresClampedMin = JSON.parse(updateCalls[1].abilityScores);
    expect(parsedScoresClampedMin.STR).toBe(1);
  });

  it('toggles skill proficiency via checkbox and expertise via star button using onSkillChange (Stage 6 Layout Parity)', () => {
    let updateCalls: any[] = [];
    const onUpdate = (updates: Partial<any>) => {
      updateCalls.push(updates);
    };

    render(
      <NpcCard
        npc={mockNpcForMemoTests}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Expand skills section
    const expandSkillsBtn = screen.getByText('Show all skills');
    fireEvent.click(expandSkillsBtn);

    // Find Perception checkbox
    const perceptionCheckbox = screen.getByRole('checkbox', { name: /Perception/i });
    expect(perceptionCheckbox).not.toBeChecked();

    // Click checkbox to toggle proficiency (none -> proficient)
    fireEvent.click(perceptionCheckbox);

    expect(updateCalls.length).toBe(1);
    const profs1 = JSON.parse(updateCalls[0].proficiencies);
    expect(profs1.skills.Perception).toBe('proficient');

    // Re-render with updated proficiencies to test expertise star button
    const npcWithProf = {
      ...mockNpcForMemoTests,
      proficiencies: JSON.stringify(profs1),
    };

    cleanup();
    updateCalls = [];

    render(
      <NpcCard
        npc={npcWithProf}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    // Expand skills section again
    fireEvent.click(screen.getByText('Show all skills'));

    // Find expertise star button for Perception
    const perceptionRow = screen.getByRole('checkbox', { name: /Perception/i }).closest('div')!;
    const starBtn = within(perceptionRow).getByTitle('Add Expertise');
    fireEvent.click(starBtn);

    expect(updateCalls.length).toBe(1);
    const profs2 = JSON.parse(updateCalls[0].proficiencies);
    expect(profs2.skills.Perception).toBe('expertise');
  });

  it('renders Speed, Senses, and Languages fields and handles change events (Stage 6 Layout Parity)', () => {
    let updateCalls: any[] = [];
    const onUpdate = (updates: Partial<any>) => {
      updateCalls.push(updates);
    };

    const npcWithDetails: NPC = {
      ...mockNpcForMemoTests,
      speed: '30 ft., fly 60 ft.',
      senses: 'darkvision 60 ft.',
      languages: 'Common, Draconic',
    };

    render(
      <NpcCard
        npc={npcWithDetails}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    const speedInput = screen.getByDisplayValue('30 ft., fly 60 ft.');
    const sensesInput = screen.getByDisplayValue('darkvision 60 ft.');
    const languagesInput = screen.getByDisplayValue('Common, Draconic');

    expect(speedInput).toBeInTheDocument();
    expect(sensesInput).toBeInTheDocument();
    expect(languagesInput).toBeInTheDocument();

    fireEvent.change(speedInput, { target: { value: '40 ft.' } });
    fireEvent.blur(speedInput);
    expect(updateCalls).toContainEqual({ speed: '40 ft.' });

    fireEvent.change(sensesInput, { target: { value: 'blindsight 30 ft.' } });
    fireEvent.blur(sensesInput);
    expect(updateCalls).toContainEqual({ senses: 'blindsight 30 ft.' });

    fireEvent.change(languagesInput, { target: { value: 'Elvish' } });
    fireEvent.blur(languagesInput);
    expect(updateCalls).toContainEqual({ languages: 'Elvish' });
  });

  it('renders IRV section with Resists, Immune, and Vuln labels and items (Stage 6 Layout Parity)', () => {
    render(
      <NpcCard
        npc={{
          ...mockNpcForMemoTests,
          resistances: 'Fire, Cold',
          immunities: 'Poison',
          vulnerabilities: 'Radiant',
        }}
        isSyncing={false}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Fire')).toBeInTheDocument();
    expect(screen.getByText('Cold')).toBeInTheDocument();
    expect(screen.getByText('Poison')).toBeInTheDocument();
    expect(screen.getByText('Radiant')).toBeInTheDocument();
    expect(screen.getByText('Resists')).toBeInTheDocument();
    expect(screen.getByText('Immune')).toBeInTheDocument();
    expect(screen.getByText('Vuln')).toBeInTheDocument();
  });
});
