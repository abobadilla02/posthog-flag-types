import { useState, useEffect } from 'react';

const STORAGE_KEY = 'posthog-flag-types:overrides';

export function useLocalOverrides(
  fileOverrides: Record<string, any> = {}
): [Record<string, any>, (key: string, value: any) => void, () => void] {
  const [overrides, setOverrides] = useState<Record<string, any>>(() => {
    if (typeof window === 'undefined') return fileOverrides;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fileOverrides;
    
    try {
      const parsed = JSON.parse(saved);
      return { ...fileOverrides, ...parsed };
    } catch (e) {
      return fileOverrides;
    }
  });

  const setOverride = (key: string, value: any) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (value === undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
      
      // We only want to save the "diff" from PostHog, but since we don't 
      // have the full list here, we save the full set of active overrides.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOverrides(fileOverrides);
  };

  return [overrides, setOverride, resetAll];
}
