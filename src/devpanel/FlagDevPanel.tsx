import React, { useState, useMemo } from 'react';
import './FlagDevPanel.css';
import { useFlagDevPanel } from './useFlagDevPanel';

export interface FlagMetadata {
  [key: string]: {
    type: 'boolean' | 'multivariate';
    variants: string[];
  };
}

export interface FlagDevPanelProps {
  flags: Record<string, string>;
  metadata: FlagMetadata;
  overrides: Record<string, any>;
  onOverridesChange: (overrides: Record<string, any>) => void;
  enabled?: boolean;
  trigger?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function FlagDevPanel({
  flags,
  metadata,
  overrides,
  onOverridesChange,
  enabled = false,
  trigger = 'Shift+Shift+F',
  position = 'bottom-right',
}: FlagDevPanelProps) {
  const { isOpen, close } = useFlagDevPanel(trigger);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    if (isOpen) setSearch('');
  }, [isOpen]);

  const flagList = useMemo(() => {
    return Object.entries(flags).map(([constName, key]) => ({
      constName,
      key,
      ...(metadata[key] || { type: 'boolean', variants: [] }),
    }));
  }, [flags, metadata]);

  const filteredFlags = flagList.filter(
    (f) =>
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      f.constName.toLowerCase().includes(search.toLowerCase())
  );

  const activeOverridesCount = Object.keys(overrides).length;

  if (!enabled || !isOpen) return null;

  const handleToggle = (key: string, currentValue: boolean) => {
    const nextOverrides = { ...overrides };
    // If it's already overridden, clear it.
    // Otherwise, set it to the opposite of current value (e.g., if true, set to false).
    if (nextOverrides[key] !== undefined) {
      delete nextOverrides[key];
    } else {
      nextOverrides[key] = !currentValue;
    }
    onOverridesChange(nextOverrides);
  };

  const handleSelect = (key: string, value: string) => {
    const nextOverrides = { ...overrides };
    if (value === '_off_') {
      delete nextOverrides[key];
    } else {
      nextOverrides[key] = value;
    }
    onOverridesChange(nextOverrides);
  };

  const resetAll = () => {
    onOverridesChange({});
  };

  const copyToConsole = () => {
    const content = `/**
 * LOCAL DEVELOPMENT OVERRIDES — DO NOT COMMIT
 */
import type { FlagOverrides } from './posthog-flags';

const overrides: FlagOverrides = ${JSON.stringify(overrides, null, 2).replace(/"([^"]+)":/g, "'$1':")};

export default overrides;`;
    console.log(content);
    alert('Overrides copied to console! (Check DevTools)');
  };

  return (
    <>
      <div className="ph-flag-panel-backdrop" onClick={close} />
      <div className={`ph-flag-panel ${position}`}>
        <div className="ph-flag-panel-header">
          <h2>🚩 Flag Dev Panel ({activeOverridesCount} active)</h2>
          <button className="ph-flag-panel-close" onClick={close}>&times;</button>
        </div>
        
        <div className="ph-flag-panel-search">
          <input
            type="text"
            placeholder="Search flags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="ph-flag-panel-list">
          {filteredFlags.map((flag) => {
            const hasOverride = overrides[flag.key] !== undefined;
            const currentValue = hasOverride ? overrides[flag.key] : 'PostHog'; // Simplified
            
            return (
              <div key={flag.key} className={`ph-flag-item ${hasOverride ? 'has-override' : ''}`}>
                <div className="ph-flag-info">
                  <span className="ph-flag-key">{flag.constName}</span>
                  <span className="ph-flag-source">
                    {hasOverride ? 'LIVE' : 'POSTHOG'}
                  </span>
                </div>

                <div className="ph-flag-control">
                  {flag.type === 'boolean' ? (
                    <label className="ph-switch">
                      <input
                        type="checkbox"
                        checked={!!overrides[flag.key]}
                        onChange={() => handleToggle(flag.key, !!overrides[flag.key])}
                      />
                      <span className="ph-slider"></span>
                    </label>
                  ) : (
                    <select
                      className="ph-select"
                      value={overrides[flag.key] || '_off_'}
                      onChange={(e) => handleSelect(flag.key, e.target.value)}
                    >
                      <option value="_off_">Use PostHog</option>
                      {flag.variants.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="ph-flag-panel-footer">
          <button className="ph-btn" onClick={resetAll}>Reset all</button>
          <button className="ph-btn ph-btn-primary" onClick={copyToConsole}>Copy to console</button>
        </div>
      </div>
    </>
  );
}
