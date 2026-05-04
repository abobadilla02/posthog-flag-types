import { useState, useEffect, useCallback } from 'react';

export function useFlagDevPanel(trigger: string = 'Shift+Shift+F') {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    let lastShiftTime = 0;
    let shiftCount = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if we're in an input, UNLESS it's the specific 'f' part of our trigger
      // that we want to intercept.
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName);

      if (e.key === 'Escape' && isOpen) {
        close();
        return;
      }

      if (e.key === 'Shift') {
        const now = Date.now();
        if (now - lastShiftTime < 500) {
          shiftCount++;
        } else {
          shiftCount = 1;
        }
        lastShiftTime = now;
      } else if (e.key.toLowerCase() === 'f' && shiftCount >= 2) {
        // Intercept the 'f' and stop it from reaching the input
        e.preventDefault();
        e.stopPropagation();
        toggle();
        shiftCount = 0;
      } else {
        shiftCount = 0;
      }
    };


    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, toggle]);

  return { isOpen, open, close, toggle };
}
