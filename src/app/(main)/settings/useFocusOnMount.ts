'use client';

import { useEffect, useRef } from 'react';

/**
 * Focuses an element after the containing modal mounts. Account modals remount
 * on every open, so mount maps to open without needing modal-specific effects.
 */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    ref.current?.focus();
  }, []);

  return ref;
}
