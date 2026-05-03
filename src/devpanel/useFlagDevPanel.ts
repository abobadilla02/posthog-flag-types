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
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

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
        e.preventDefault();
        e.stopPropagation();
        toggle();
        shiftCount = 0;
      } else {
        shiftCount = 0;
      }
    };

    window.addEventListener('keyup', handleKeyDown);
    return () => window.removeEventListener('keyup', handleKeyDown);
  }, [isOpen, close, toggle]);

  return { isOpen, open, close, toggle };
}
