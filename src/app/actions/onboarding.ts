'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ONBOARDED_COOKIE } from '@/lib/onboarding';

export async function completeOnboardingAction(opts?: { redirectTo?: string | null }) {
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
