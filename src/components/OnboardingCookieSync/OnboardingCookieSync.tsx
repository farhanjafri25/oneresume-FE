'use client';

import { useEffect, useRef } from 'react';
import { completeOnboardingAction } from '@/app/actions/onboarding';

/**
 * One-shot, fire-and-forget cookie setter for established users (those who
 * already have resumes from before onboarding existed). Sets the
 * `onecv_onboarded` cookie once so the (main) layout gate stops re-fetching
 * resumes on every navigation. Never forces these users through onboarding.
 */
export default function OnboardingCookieSync() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    completeOnboardingAction({ redirectTo: null }).catch(() => {});
  }, []);
  return null;
}
