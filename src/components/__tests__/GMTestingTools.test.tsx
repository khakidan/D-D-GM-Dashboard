import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GMTestingTools } from '../GMTestingTools';

describe('GMTestingTools', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    fireDeathEvent: vi.fn(),
    fireDamageEvent: vi.fn(),
    fireHealEvent: vi.fn(),
    fireUnconsciousEvent: vi.fn(),
    fireRageEvent: vi.fn(),
    fireInitiativeEvent: vi.fn(),
  };

  it('renders all animation testing buttons', () => {
    render(<GMTestingTools {...defaultProps} />);

    expect(screen.getByRole('button', { name: /test death animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test damage animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test heal animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test unconscious animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test rage animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test initiative animation/i })).toBeInTheDocument();
  });

  it('calls expected event handlers with default payloads when clicked', async () => {
    render(<GMTestingTools {...defaultProps} />);

    await userEvent.click(screen.getByRole('button', { name: /test death animation/i }));
    expect(defaultProps.fireDeathEvent).toHaveBeenCalledWith({ characterName: 'Aldric the Brave' });

    await userEvent.click(screen.getByRole('button', { name: /test damage animation/i }));
    expect(defaultProps.fireDamageEvent).toHaveBeenCalledWith({ combatantNames: ['Thorin Ironforge'], damageAmount: 47 });

    await userEvent.click(screen.getByRole('button', { name: /test heal animation/i }));
    expect(defaultProps.fireHealEvent).toHaveBeenCalledWith({ combatantNames: ['Seraphina Brightwell'], healAmount: 34 });

    await userEvent.click(screen.getByRole('button', { name: /test unconscious animation/i }));
    expect(defaultProps.fireUnconsciousEvent).toHaveBeenCalledWith({ characterName: 'Gareth of Stonehaven' });

    await userEvent.click(screen.getByRole('button', { name: /test rage animation/i }));
    expect(defaultProps.fireRageEvent).toHaveBeenCalledWith({ characterName: 'Bjorn the Unbroken' });

    await userEvent.click(screen.getByRole('button', { name: /test initiative animation/i }));
    expect(defaultProps.fireInitiativeEvent).toHaveBeenCalledWith(true);
  });
});

