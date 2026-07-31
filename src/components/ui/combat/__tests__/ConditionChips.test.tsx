import React from 'react';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConditionChips } from '../ConditionChips';
import { toast } from 'sonner';
import '@testing-library/jest-dom/vitest';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    promise: vi.fn().mockImplementation((val) => val),
  }),
}));

describe('ConditionChips Component - Stage 2a tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(toast.warning).mockReset();
    vi.mocked(toast).mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  // Test 1: Debounced onChange
  it('debounces onChange callback, clearing previous pending calls on rapid changes', () => {
    const onChange = vi.fn();
    render(<ConditionChips value="" onChange={onChange} />);

    const input = screen.getByLabelText('Add condition or effect');

    // First change: type a custom condition and press Enter
    fireEvent.change(input, { target: { value: 'Custom One' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // onChange should not be called immediately because of 300ms debounce
    expect(onChange).not.toHaveBeenCalled();

    // Second change within 300ms: type a second custom condition and press Enter
    fireEvent.change(input, { target: { value: 'Custom Two' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // onChange still not called
    expect(onChange).not.toHaveBeenCalled();

    // Advance by 150ms
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(onChange).not.toHaveBeenCalled();

    // Advance by another 150ms (reaching 300ms since last change)
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Should call onChange exactly once with the final value
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Custom One, Custom Two');
  });

  // Test 2: Immunity-blocked rejection
  it('rejects adding an official condition if the combatant is immune, and allows non-immune conditions of same category', () => {
    const onChange = vi.fn();
    render(<ConditionChips value="" onChange={onChange} immunities="poisoned" />);

    const input = screen.getByLabelText('Add condition or effect');

    // Attempt to add poisoned (official condition target is immune to)
    fireEvent.change(input, { target: { value: 'poisoned' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Should display warning toast and NOT trigger onChange
    expect(toast.warning).toHaveBeenCalledWith('Cannot apply poisoned', {
      description: 'This combatant is immune to that condition.',
    });
    expect(onChange).not.toHaveBeenCalled();

    // Now attempt to add blinded (official condition target is NOT immune to)
    fireEvent.change(input, { target: { value: 'blinded' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Should NOT warn for blinded
    expect(toast.warning).not.toHaveBeenCalledWith('Cannot apply blinded', expect.any(Object));

    // Advance timers so debounced onChange fires
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith('blinded');
  });

  // Test 3: Exhaustion-tier replacement
  it('replaces an existing exhaustion tier instead of stacking them', () => {
    const onChange = vi.fn();
    render(<ConditionChips value="exhaustion 2" onChange={onChange} />);

    const input = screen.getByLabelText('Add condition or effect');

    // Add exhaustion 4
    fireEvent.change(input, { target: { value: 'exhaustion 4' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Check that exhaustion 2 was replaced by exhaustion 4
    expect(onChange).toHaveBeenCalledWith('exhaustion 4');
    expect(onChange).not.toHaveBeenCalledWith(expect.stringContaining('exhaustion 2'));
  });

  // Test 4: Duration-timer confirm path (with concentration-effect sub-case)
  it('triggers the timer prompt, confirms with valid round count, calling onAddWithTimer and onConcentrationEffectAdded', () => {
    const onChange = vi.fn();
    const onAddWithTimer = vi.fn();
    const onConcentrationEffectAdded = vi.fn();

    render(
      <ConditionChips
        value=""
        onChange={onChange}
        onAddWithTimer={onAddWithTimer}
        onConcentrationEffectAdded={onConcentrationEffectAdded}
      />
    );

    const input = screen.getByLabelText('Add condition or effect');

    // Add hasted (a concentration effect)
    fireEvent.change(input, { target: { value: 'hasted' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // It should NOT call commitChip/onChange immediately; instead, it shows the duration prompt
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Duration for hasted:')).toBeInTheDocument();

    // Fill in the round count input
    const durationInput = screen.getByLabelText('Duration in rounds for hasted');
    fireEvent.change(durationInput, { target: { value: '5' } });

    // Click "Add" button to confirm
    const addButton = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(addButton);

    // It should trigger onAddWithTimer and onConcentrationEffectAdded, and NOT onChange
    expect(onAddWithTimer).toHaveBeenCalledWith('hasted', 5);
    expect(onConcentrationEffectAdded).toHaveBeenCalledWith('hasted');
    expect(onChange).not.toHaveBeenCalled();

    // Ensure the duration prompt is closed
    expect(screen.queryByText('Duration for hasted:')).not.toBeInTheDocument();
  });

  // Test 5: Duration-timer skip path
  it('triggers the timer prompt and falls back to normal commitChip path when skipped', () => {
    const onChange = vi.fn();
    const onAddWithTimer = vi.fn();

    render(
      <ConditionChips
        value=""
        onChange={onChange}
        onAddWithTimer={onAddWithTimer}
      />
    );

    const input = screen.getByLabelText('Add condition or effect');

    // Add blinded (non-concentration condition)
    fireEvent.change(input, { target: { value: 'blinded' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Duration for blinded:')).toBeInTheDocument();

    // Click "Skip" button to bypass
    const skipButton = screen.getByRole('button', { name: 'Skip' });
    fireEvent.click(skipButton);

    // Prompt should close
    expect(screen.queryByText('Duration for blinded:')).not.toBeInTheDocument();

    // Advance timer to trigger debounced onChange
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // It should have called normal onChange path with blinded, and NOT onAddWithTimer
    expect(onChange).toHaveBeenCalledWith('blinded');
    expect(onAddWithTimer).not.toHaveBeenCalled();
  });
});

describe('ConditionChips Component - Stage 2b rules automation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(toast.warning).mockReset();
    vi.mocked(toast.info).mockReset();
    vi.mocked(toast).mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  // 1. Exhaustion-6 death callback (positive case)
  it('calls onExhaustionDeath exactly once and shows toast.warning with death message when exhaustion 6 is added', () => {
    const onExhaustionDeath = vi.fn();
    const onChange = vi.fn();
    
    render(
      <ConditionChips
        value="exhaustion 5"
        onChange={onChange}
        onExhaustionDeath={onExhaustionDeath}
      />
    );

    const input = screen.getByLabelText('Add condition or effect');

    fireEvent.change(input, { target: { value: 'exhaustion 6' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onExhaustionDeath).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith('Exhaustion 6 — Death', {
      description: 'This creature has died. Status updated to Deceased.',
      duration: 12000,
    });
  });

  // 2. Exhaustion-6 death callback (negative case)
  it('does NOT call onExhaustionDeath or show death toast when exhaustion 5 is added', () => {
    const onExhaustionDeath = vi.fn();
    const onChange = vi.fn();
    
    render(
      <ConditionChips
        value="exhaustion 4"
        onChange={onChange}
        onExhaustionDeath={onExhaustionDeath}
      />
    );

    const input = screen.getByLabelText('Add condition or effect');

    fireEvent.change(input, { target: { value: 'exhaustion 5' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onExhaustionDeath).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalledWith('Exhaustion 6 — Death', expect.any(Object));
  });

  // 3. Incapacitation breaks concentration - positive case
  it('strips concentration and active concentration effects and alerts with toast when incapacitated', () => {
    const onChange = vi.fn();
    render(<ConditionChips value="hasted, concentrating" onChange={onChange} />);

    const input = screen.getByLabelText('Add condition or effect');

    // Add paralyzed (causes incapacitation)
    fireEvent.change(input, { target: { value: 'paralyzed' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Toast alert should fire immediately
    expect(toast.info).toHaveBeenCalledWith('Concentration broken', {
      description: 'paralyzed causes incapacitation — concentration ended automatically.',
      duration: 6000,
    });

    // Advance debouncer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // It should have stripped 'hasted' and 'concentrating' but kept 'paralyzed'
    expect(onChange).toHaveBeenCalledWith('paralyzed');
  });

  // 4. Incapacitation breaks concentration - negative case
  it('does not strip other chips or alert if target was not concentrating when incapacitated', () => {
    const onChange = vi.fn();
    render(<ConditionChips value="blinded" onChange={onChange} />);

    const input = screen.getByLabelText('Add condition or effect');

    // Add paralyzed
    fireEvent.change(input, { target: { value: 'paralyzed' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Toast info should NOT be called
    expect(toast.info).not.toHaveBeenCalledWith('Concentration broken', expect.any(Object));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Both should be present
    expect(onChange).toHaveBeenCalledWith('blinded, paralyzed');
  });

  // 5. Manual "Concentrating" removal cascade - positive case
  it('removes all active concentration effects when concentrating is manually removed', () => {
    const onChange = vi.fn();
    render(<ConditionChips value="hasted, concentrating" onChange={onChange} />);

    // Click 'Remove concentrating' button
    const removeBtn = screen.getByRole('button', { name: 'Remove concentrating' });
    fireEvent.click(removeBtn);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Both concentrating and hasted should be gone
    expect(onChange).toHaveBeenCalledWith('');
  });

  // 6. Manual removal cascade - negative case, chip order independence
  it('removes all active concentration effects regardless of chip string order', () => {
    const onChange = vi.fn();
    render(<ConditionChips value="concentrating, hasted" onChange={onChange} />);

    const removeBtn = screen.getByRole('button', { name: 'Remove concentrating' });
    fireEvent.click(removeBtn);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith('');
  });

  // 7. Manual removal cascade - the OTHER direction (positive case)
  it('removes concentrating automatically when the last concentration effect is removed', () => {
    const onChange = vi.fn();
    render(<ConditionChips value="hasted, concentrating" onChange={onChange} />);

    const removeHasted = screen.getByRole('button', { name: 'Remove hasted' });
    fireEvent.click(removeHasted);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Since hasted was the only effect, removing it should cascade-remove concentrating
    expect(onChange).toHaveBeenCalledWith('');
  });

  // 8. Manual removal cascade - the OTHER direction (negative case)
  it('retains concentrating and other concentration effects when only one of multiple concentration effects is removed', () => {
    const onChange = vi.fn();
    render(<ConditionChips value="hasted, enlarged, concentrating" onChange={onChange} />);

    const removeHasted = screen.getByRole('button', { name: 'Remove hasted' });
    fireEvent.click(removeHasted);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Removing hasted still leaves enlarged, so concentrating must remain
    expect(onChange).toHaveBeenCalledWith('enlarged, concentrating');
  });
});

