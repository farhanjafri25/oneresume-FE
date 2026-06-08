'use client';

import { useEffect, useState } from 'react';

/**
 * True only on devices with a real hover-capable pointer (mouse/trackpad).
 * Use to gate motion `whileHover` effects so they never misfire on touch
 * devices, where a tap would otherwise trigger a transient hover state.
 * Mirrors the CSS `@media (hover: hover) and (pointer: fine)` guard.
 */
export function useHoverable(): boolean {
  const [hoverable, setHoverable] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    setHoverable(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setHoverable(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return hoverable;
}
