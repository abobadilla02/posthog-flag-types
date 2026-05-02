import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FlagDevPanel } from '../devpanel/FlagDevPanel';
import { useFlagDevPanel } from '../devpanel/useFlagDevPanel';
import { useLocalOverrides } from '../devpanel/useLocalOverrides';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useLocalOverrides', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with file overrides', () => {
    const fileOverrides = { 'flag-a': true };
    const TestComponent = () => {
      const [overrides] = useLocalOverrides(fileOverrides);
      return <div data-testid="val">{JSON.stringify(overrides)}</div>;
    };
    render(<TestComponent />);
    expect(screen.getByTestId('val').textContent).toContain('"flag-a":true');
  });

  it('updates localStorage when setOverride is called', () => {
    const TestComponent = () => {
      const [, setOverride] = useLocalOverrides({});
      return <button onClick={() => setOverride('flag-b', 'variant-x')}>Set</button>;
    };
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Set'));
    expect(localStorage.getItem('posthog-flag-types:overrides')).toContain('"flag-b":"variant-x"');
  });
});

describe('FlagDevPanel', () => {
  const mockFlags = { NEW_DASHBOARD: 'new-dashboard' };
  const mockMetadata = { 'new-dashboard': { type: 'boolean' as const, variants: [] } };

  it('renders nothing when disabled', () => {
    const { container } = render(
      <FlagDevPanel
        flags={mockFlags}
        metadata={mockMetadata}
        overrides={{}}
        onOverridesChange={() => {}}
        enabled={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when closed (by default)', () => {
    const { container } = render(
      <FlagDevPanel
        flags={mockFlags}
        metadata={mockMetadata}
        overrides={{}}
        onOverridesChange={() => {}}
        enabled={true}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders panel when trigger is fired', () => {
    render(
      <FlagDevPanel
        flags={mockFlags}
        metadata={mockMetadata}
        overrides={{}}
        onOverridesChange={() => {}}
        enabled={true}
      />
    );
    
    // Simulate Shift+Shift+F
    fireEvent.keyDown(window, { key: 'Shift' });
    fireEvent.keyDown(window, { key: 'Shift' });
    fireEvent.keyDown(window, { key: 'f' });

    expect(screen.getByText(/Flag Dev Panel/)).toBeTruthy();
    expect(screen.getByText('NEW_DASHBOARD')).toBeTruthy();
  });

  it('calls onOverridesChange when toggle is clicked', () => {
    const handleChange = vi.fn();
    render(
      <FlagDevPanel
        flags={mockFlags}
        metadata={mockMetadata}
        overrides={{}}
        onOverridesChange={handleChange}
        enabled={true}
      />
    );
    
    // Open
    fireEvent.keyDown(window, { key: 'Shift' });
    fireEvent.keyDown(window, { key: 'Shift' });
    fireEvent.keyDown(window, { key: 'f' });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalledWith({ 'new-dashboard': true });
  });
});
