import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toConstName } from '../fetcher';
import { generateTypeScript } from '../generator';
import { generateOverridesTemplate, parseExistingOverrides } from '../override-generator';
import { FlagClient } from '../runtime';
import { ParsedFlag } from '../types';

describe('toConstName', () => {
  it('converts kebab-case to SCREAMING_SNAKE_CASE', () => {
    expect(toConstName('new-dashboard')).toBe('NEW_DASHBOARD');
  });

  it('converts snake_case to SCREAMING_SNAKE_CASE', () => {
    expect(toConstName('checkout_experiment')).toBe('CHECKOUT_EXPERIMENT');
  });

  it('handles multiple separators and special characters', () => {
    expect(toConstName('experiment-v2_final!tag')).toBe('EXPERIMENT_V2_FINAL_TAG');
  });
});

describe('generateTypeScript', () => {
  const mockFlags: ParsedFlag[] = [
    {
      key: 'new-dashboard',
      name: 'New Dashboard',
      constName: 'NEW_DASHBOARD',
      type: 'boolean',
      active: true,
      variants: [],
    },
    {
      key: 'checkout-experiment',
      name: 'Checkout Experiment',
      constName: 'CHECKOUT_EXPERIMENT',
      type: 'multivariate',
      active: true,
      variants: ['control', 'variant-a', 'variant-b'],
    },
  ];

  it('generates correct FLAGS constant', () => {
    const output = generateTypeScript(mockFlags);
    expect(output).toContain("NEW_DASHBOARD: 'new-dashboard'");
    expect(output).toContain("CHECKOUT_EXPERIMENT: 'checkout-experiment'");
  });

  it('generates correct FlagVariants type', () => {
    const output = generateTypeScript(mockFlags);
    expect(output).toContain("'checkout-experiment': 'control' | 'variant-a' | 'variant-b'");
  });

  it('includes the auto-generated banner', () => {
    const output = generateTypeScript(mockFlags);
    expect(output).toContain('AUTO-GENERATED — DO NOT EDIT MANUALLY');
  });
});

describe('generateOverridesTemplate', () => {
  const mockFlags: ParsedFlag[] = [
    {
      key: 'new-dashboard',
      name: 'New Dashboard',
      constName: 'NEW_DASHBOARD',
      type: 'boolean',
      active: true,
      variants: [],
    },
  ];

  it('generates template with undefined as default', () => {
    const output = generateOverridesTemplate(mockFlags);
    expect(output).toContain("'new-dashboard': undefined");
  });

  it('preserves existing overrides', () => {
    const existing = { 'new-dashboard': 'true' };
    const output = generateOverridesTemplate(mockFlags, existing);
    expect(output).toContain("'new-dashboard': true");
  });
});

describe('parseExistingOverrides', () => {
  it('parses boolean and string overrides', () => {
    const content = `
      const overrides: FlagOverrides = {
        'new-dashboard': true,
        'checkout-experiment': 'variant-a',
        'another-flag': undefined,
      };
    `;
    const result = parseExistingOverrides(content);
    expect(result['new-dashboard']).toBe('true');
    expect(result['checkout-experiment']).toBe("'variant-a'");
    expect(result['another-flag']).toBe(undefined);
  });
});

describe('FlagClient', () => {
  const mockPostHog = {
    isFeatureEnabled: vi.fn(),
    getFeatureFlag: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses real PostHog when no overrides match', () => {
    mockPostHog.isFeatureEnabled.mockReturnValue(true);
    const client = new FlagClient(mockPostHog);
    expect(client.isEnabled('some-flag')).toBe(true);
    expect(mockPostHog.isFeatureEnabled).toHaveBeenCalledWith('some-flag', undefined);
  });

  it('uses override value when present', () => {
    const client = new FlagClient(mockPostHog, {
      overrides: { 'some-flag': false }
    });
    expect(client.isEnabled('some-flag')).toBe(false);
    expect(mockPostHog.isFeatureEnabled).not.toHaveBeenCalled();
  });

  it('prioritizes liveOverrides over file overrides', () => {
    const client = new FlagClient(mockPostHog, {
      overrides: { 'some-flag': false },
      liveOverrides: { 'some-flag': true }
    });
    expect(client.isEnabled('some-flag')).toBe(true);
    expect(mockPostHog.isFeatureEnabled).not.toHaveBeenCalled();
  });

  it('logs debug message when enabled', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new FlagClient(mockPostHog, {
      overrides: { 'some-flag': true },
      debug: true
    });
    client.isEnabled('some-flag');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Override applied'));
    spy.mockRestore();
  });
});
