import React from 'react';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { ConditionPopover } from '../ConditionPopover';
import { getConditionDescription } from '../../../lib/conditions';
import '@testing-library/jest-dom/vitest';

vi.mock('../../../lib/conditions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/conditions')>();
  return {
    ...actual,
    getConditionDescription: vi.fn(),
  };
});

describe('ConditionPopover Component', () => {
  let realGetConditionDescription: any;

  beforeAll(async () => {
    const actual = await vi.importActual<typeof import('../../../lib/conditions')>('../../../lib/conditions');
    realGetConditionDescription = actual.getConditionDescription;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getConditionDescription).mockReset();
    vi.mocked(getConditionDescription).mockImplementation((name) => realGetConditionDescription(name));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  // 1. Hover behavior tests
  describe('Hover behavior', () => {
    it('shows popover on hover after delay', () => {
      render(
        <ConditionPopover conditionName="blinded" category="condition">
          <span data-testid="trigger">Hover Me</span>
        </ConditionPopover>
      );

      // Initially popover content should not be in the document
      expect(screen.queryByTestId('condition-popover-content')).not.toBeInTheDocument();

      const trigger = screen.getByTestId('trigger');
      
      // Simulate hover
      fireEvent.mouseEnter(trigger);

      // Still shouldn't be open immediately before the 300ms delay
      expect(screen.queryByTestId('condition-popover-content')).not.toBeInTheDocument();

      // Fast-forward 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Now popover content should be visible
      expect(screen.getByTestId('condition-popover-content')).toBeInTheDocument();
    });

    it('hides popover on mouse leave immediately', () => {
      render(
        <ConditionPopover conditionName="blinded" category="condition">
          <span data-testid="trigger">Hover Me</span>
        </ConditionPopover>
      );

      const trigger = screen.getByTestId('trigger');

      // Hover and wait
      fireEvent.mouseEnter(trigger);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByTestId('condition-popover-content')).toBeInTheDocument();

      // Mouse leave
      fireEvent.mouseLeave(trigger);

      // Should be closed immediately
      expect(screen.queryByTestId('condition-popover-content')).not.toBeInTheDocument();
    });
  });

  // 2. Click behavior tests
  describe('Click behavior', () => {
    it('toggles popover open and closed on click', () => {
      render(
        <ConditionPopover conditionName="blinded" category="condition">
          <span data-testid="trigger">Click Me</span>
        </ConditionPopover>
      );

      const trigger = screen.getByTestId('trigger');

      // First click opens
      fireEvent.click(trigger);
      expect(screen.getByTestId('condition-popover-content')).toBeInTheDocument();

      // Second click closes
      fireEvent.click(trigger);
      expect(screen.queryByTestId('condition-popover-content')).not.toBeInTheDocument();
    });

    it('closes popover on outside click', () => {
      render(
        <div>
          <span data-testid="outside">Outside Element</span>
          <ConditionPopover conditionName="blinded" category="condition">
            <span data-testid="trigger">Click Me</span>
          </ConditionPopover>
        </div>
      );

      const trigger = screen.getByTestId('trigger');
      const outside = screen.getByTestId('outside');

      // Open popover
      fireEvent.click(trigger);
      expect(screen.getByTestId('condition-popover-content')).toBeInTheDocument();

      // Click outside
      fireEvent.click(outside);
      expect(screen.queryByTestId('condition-popover-content')).not.toBeInTheDocument();
    });
  });

  // 3. Classification logic tests
  describe('Classification logic', () => {
    it('classifies official condition options as "Condition"', () => {
      render(
        <ConditionPopover conditionName="blinded" category="condition">
          <span data-testid="trigger">Trigger</span>
        </ConditionPopover>
      );

      fireEvent.click(screen.getByTestId('trigger'));
      expect(screen.getByText('Condition')).toBeInTheDocument();
    });

    it('classifies official spell options as "Spell"', () => {
      // Changed from "bless" to "blessed" as per instructions
      render(
        <ConditionPopover conditionName="blessed" category="condition">
          <span data-testid="trigger">Trigger</span>
        </ConditionPopover>
      );

      fireEvent.click(screen.getByTestId('trigger'));
      expect(screen.getByText('Spell')).toBeInTheDocument();
    });

    it('classifies non-spell active effects as "Effect" or "Condition" depending on category', () => {
      // "raging" is in EFFECT_OPTIONS but NOT in SPELL_EFFECT_OPTIONS
      const { unmount } = render(
        <ConditionPopover conditionName="raging" category="effect">
          <span data-testid="trigger">Trigger</span>
        </ConditionPopover>
      );

      fireEvent.click(screen.getByTestId('trigger'));
      expect(screen.getByText('Effect')).toBeInTheDocument();
      unmount();

      render(
        <ConditionPopover conditionName="raging" category="condition">
          <span data-testid="trigger">Trigger</span>
        </ConditionPopover>
      );

      fireEvent.click(screen.getByTestId('trigger'));
      expect(screen.getByText('Condition')).toBeInTheDocument();
    });

    it('respects "custom" category override and displays "Custom"', () => {
      render(
        <ConditionPopover conditionName="blessed" category="custom">
          <span data-testid="trigger">Trigger</span>
        </ConditionPopover>
      );

      fireEvent.click(screen.getByTestId('trigger'));
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });

  // 4. Content rendering tests
  describe('Content rendering', () => {
    it('renders condition description (summary, rules, and note) when it exists', () => {
      vi.mocked(getConditionDescription).mockReturnValue({
        summary: 'Mocked summary text.',
        rules: ['Mocked rule 1.', 'Mocked rule 2.'],
        note: 'Mocked note text.'
      });

      render(
        <ConditionPopover conditionName="blinded" category="condition">
          <span data-testid="trigger">Trigger</span>
        </ConditionPopover>
      );

      fireEvent.click(screen.getByTestId('trigger'));

      expect(screen.getByText('Mocked summary text.')).toBeInTheDocument();
      expect(screen.getByText('Mocked rule 1.')).toBeInTheDocument();
      expect(screen.getByText('Mocked rule 2.')).toBeInTheDocument();
      expect(screen.getByText('Mocked note text.')).toBeInTheDocument();
    });

    it('renders fallback custom status text when description is missing', () => {
      vi.mocked(getConditionDescription).mockReturnValue(null);

      render(
        <ConditionPopover conditionName="unknown custom status name" category="custom">
          <span data-testid="trigger">Trigger</span>
        </ConditionPopover>
      );

      fireEvent.click(screen.getByTestId('trigger'));
      expect(screen.getByText(/Custom status — no official rules text available/i)).toBeInTheDocument();
    });
  });

  // 5. Name capitalization display logic tests
  describe('Name capitalization', () => {
    it('capitalizes standard condition names', () => {
      render(
        <ConditionPopover conditionName="blinded" category="condition">
          <span data-testid="trigger">Trigger</span>
        </ConditionPopover>
      );

      fireEvent.click(screen.getByTestId('trigger'));
      expect(screen.getByText('Blinded')).toBeInTheDocument();
    });

    it('capitalizes multi-word active effect names', () => {
      render(
        <ConditionPopover conditionName="wild shaped" category="effect">
          <span data-testid="trigger">Trigger</span>
        </ConditionPopover>
      );

      fireEvent.click(screen.getByTestId('trigger'));
      expect(screen.getByText('Wild Shaped')).toBeInTheDocument();
    });

    it('gracefully capitalizes names starting with parenthesis', () => {
      render(
        <ConditionPopover conditionName="(concentrating)" category="effect">
          <span data-testid="trigger">Trigger</span>
        </ConditionPopover>
      );

      fireEvent.click(screen.getByTestId('trigger'));
      expect(screen.getByText('(Concentrating)')).toBeInTheDocument();
    });
  });
});
