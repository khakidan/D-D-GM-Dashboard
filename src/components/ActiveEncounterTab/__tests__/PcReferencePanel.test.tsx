import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { PcReferencePanel } from '../PcReferencePanel';
import { makeCombatant } from '../../../test-utils/fixtures/combatantFixtures';

describe('PcReferencePanel', () => {
  afterEach(() => cleanup());

  it('renders nothing when combatant has no stat block content', () => {
    const emptyPc = makeCombatant({
      type: 'pc',
      traits: '',
      actions: '',
      reactions: '[]',
    });
    const { container } = render(<PcReferencePanel combatant={emptyPc} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders stat block content after toggle button is clicked', () => {
    const pcWithContent = makeCombatant({
      type: 'pc',
      traits: JSON.stringify([{ name: 'Tough', description: 'Has more HP.' }]),
      actions: JSON.stringify([{ 
        name: 'Strike', 
        description: 'Hits with weapon.',
        attackBonus: 5,
        damage: '1d8+3 bludgeoning'
      }]),
      bonusActions: JSON.stringify([{
        name: 'Quick Step',
        description: 'Moves as a bonus action.',
        range: 'Self'
      }]),
      reactions: JSON.stringify([{ name: 'Parry', description: 'Blocks attack.' }]),
    });

    render(<PcReferencePanel combatant={pcWithContent} />);
    
    expect(screen.queryByText('Has more HP.')).not.toBeInTheDocument();
    
    const button = screen.getByRole('button', { name: /▶ Stat Block/ });
    fireEvent.click(button);
    
    // Check traits
    expect(screen.getByText('Tough')).toBeInTheDocument();
    expect(screen.getByText('Has more HP.')).toBeInTheDocument();

    // Check actions
    expect(screen.getByText('Strike')).toBeInTheDocument();
    expect(screen.getByText('Hits with weapon.')).toBeInTheDocument();
    expect(screen.getByText('+5 to hit | 1d8+3 bludgeoning')).toBeInTheDocument();

    // Check bonus actions
    expect(screen.getByText('Quick Step')).toBeInTheDocument();
    expect(screen.getByText('Moves as a bonus action.')).toBeInTheDocument();

    // Check reactions
    expect(screen.getByText('Parry')).toBeInTheDocument();
    expect(screen.getByText('Blocks attack.')).toBeInTheDocument();
    
    // Check toggle changed
    expect(screen.getByRole('button', { name: /▼ Stat Block/ })).toBeInTheDocument();
  });

  it('does not render NPC-only content even if present in the combatant object', () => {
    // Combatants are shared structure, so an NPC-like field might exist but shouldn't be rendered.
    const mixedPc = makeCombatant({
      type: 'pc',
      challengeRating: '5',
      speed: '30 ft., fly 60 ft.',
      senses: 'Darkvision 120 ft.',
      languages: 'Common, Elvish',
      legendaryActionsList: JSON.stringify([{ name: 'Wing Attack', description: 'Flaps wings.' }]),
      traits: JSON.stringify([{ name: 'Keen Senses', description: 'Advantage on perception.' }])
    });

    render(<PcReferencePanel combatant={mixedPc} />);
    
    const button = screen.getByRole('button', { name: /▶ Stat Block/ });
    fireEvent.click(button);
    
    // Traits should be there
    expect(screen.getByText('Keen Senses')).toBeInTheDocument();
    
    // None of these should be rendered
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.queryByText('30 ft., fly 60 ft.')).not.toBeInTheDocument();
    expect(screen.queryByText('Darkvision 120 ft.')).not.toBeInTheDocument();
    expect(screen.queryByText('Common, Elvish')).not.toBeInTheDocument();
    expect(screen.queryByText('Wing Attack')).not.toBeInTheDocument();
  });

  it('renders markdown in descriptions', () => {
    const pcWithMarkdown = makeCombatant({
      type: 'pc',
      traits: JSON.stringify([{ 
        name: 'Fancy Formatted Trait', 
        description: 'This is **bold** and *italic*.\n\n- Item 1\n- Item 2' 
      }]),
    });

    render(<PcReferencePanel combatant={pcWithMarkdown} />);
    fireEvent.click(screen.getByRole('button', { name: /▶ Stat Block/ }));

    // The text should be present, but strong and em tags should exist
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('italic').tagName).toBe('EM');
    
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Item 1');
    expect(items[1]).toHaveTextContent('Item 2');
  });
});
