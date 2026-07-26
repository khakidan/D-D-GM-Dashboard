import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { ScrollToTop } from '../ScrollToTop';

describe('ScrollToTop', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create a mock container element in the DOM
    container = document.createElement('div');
    container.setAttribute('id', 'test-container');
    container.scrollTop = 0;
    container.scrollTo = vi.fn();
    document.body.appendChild(container);
  });

  afterEach(() => {
    cleanup();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  it('renders nothing when the container is not found in the DOM', () => {
    const { container: renderedContainer } = render(
      <ScrollToTop containerId="non-existent-id" threshold={100} />
    );
    expect(renderedContainer.firstChild).toBeNull();
  });

  it('is not visible when scrollTop is below threshold', () => {
    render(<ScrollToTop containerId="test-container" threshold={100} />);
    
    act(() => {
      container.scrollTop = 50;
      fireEvent.scroll(container);
    });

    expect(screen.queryByRole('button', { name: /scroll to top/i })).toBeNull();
  });

  it('becomes visible when scrollTop exceeds threshold and calls scrollTo when clicked', async () => {
    render(<ScrollToTop containerId="test-container" threshold={100} />);

    // Initially invisible
    expect(screen.queryByRole('button', { name: /scroll to top/i })).toBeNull();

    // Scroll past threshold
    act(() => {
      container.scrollTop = 150;
      fireEvent.scroll(container);
    });

    // Wait for the button to appear in the DOM
    const button = await screen.findByRole('button', { name: /scroll to top/i });
    expect(button).toBeInTheDocument();

    // Click the button
    act(() => {
      fireEvent.click(button);
    });

    // Assert scrollTo was called with correct parameters
    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });
});
