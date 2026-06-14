'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ActiveResumeContextValue {
  activeResumeId: string | null;
  setActiveResumeId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ActiveResumeContext = createContext<ActiveResumeContextValue | null>(null);

/**
 * Holds the resume the user is currently looking at, so chrome rendered above
 * the route (e.g. the header switcher) can reflect it without inspecting the
 * URL. Per-resume pages register themselves via {@link SetActiveResume}.
 */
export function ActiveResumeProvider({ children }: { children: React.ReactNode }) {
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  return (
    <ActiveResumeContext.Provider value={{ activeResumeId, setActiveResumeId }}>
      {children}
    </ActiveResumeContext.Provider>
  );
}

/** Current active resume id, or `null` outside the provider / on non-resume pages. */
export function useActiveResume(): string | null {
  return useContext(ActiveResumeContext)?.activeResumeId ?? null;
}

/**
 * Drop-in marker a per-resume page renders to declare the active resume.
 * Registers on mount, and clears on unmount only if it still owns the slot, so
 * navigating between two resume pages never blanks the value mid-transition.
 */
export function SetActiveResume({ id }: { id: string }) {
  const ctx = useContext(ActiveResumeContext);
  const setActiveResumeId = ctx?.setActiveResumeId;

  useEffect(() => {
    if (!setActiveResumeId) return;
    setActiveResumeId(id);
    return () => {
      setActiveResumeId((current) => (current === id ? null : current));
    };
  }, [id, setActiveResumeId]);

  return null;
}
