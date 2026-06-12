'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ONBOARDED_COOKIE } from '@/lib/onboarding';
import { markOnboarded } from '@/lib/api';

export async function completeOnboardingAction(opts?: { redirectTo?: string | null }) {
  // Server is the source of truth. Best-effort: if the backend doesn't expose
  // the endpoint yet, fall through to the cookie so onboarding still completes.
  try {
    await markOnboarded();
  } catch (err) {
    console.error('completeOnboardingAction: markOnboarded failed (fail-open):', err);
  }
  const cookieStore = await cookies();
  cookieStore.set(ONBOARDED_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  // Caller passes redirectTo: null to set the cookie without navigating (migration sync).
  if (opts?.redirectTo !== null) redirect(opts?.redirectTo ?? '/dashboard');
}
