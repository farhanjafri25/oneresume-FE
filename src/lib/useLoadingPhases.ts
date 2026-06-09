import { useEffect, useState } from 'react';

export interface LoadingPhase {
  /** Milliseconds after `active` flips true at which to show `text`. */
  delay: number;
  text: string;
}

/**
 * Rotates through timed status messages while `active` is true, returning the
 * current message. The first phase (delay 0) is shown immediately on activation
 * and timers are cleaned up when `active` flips off or the component unmounts.
 *
 * Call sites pass a module-level constant for `phases`, so only `active` drives
 * the effect.
 */
export function useLoadingPhases(phases: LoadingPhase[], active: boolean): string {
  const [phase, setPhase] = useState(phases[0].text);

  useEffect(() => {
    if (!active) return;
    const timers = phases.map((p) => setTimeout(() => setPhase(p.text), p.delay));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return phase;
}
