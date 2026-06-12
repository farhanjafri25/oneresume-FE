import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/api';
import { ONBOARDED_COOKIE } from '@/lib/onboarding';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('token')?.value) redirect('/login');

  // Server field is authoritative; fall back to the cookie until the backend
  // ships onboardedAt. Fail open on errors — never trap a user on the wizard.
  let user;
  try {
    user = await getMe();
  } catch (err) {
    console.error('OnboardingLayout auth check failed (fail-open):', err);
  }
  if (user?.onboardedAt) redirect('/dashboard');
  if (!user?.onboardedAt && cookieStore.get(ONBOARDED_COOKIE)?.value === '1') redirect('/dashboard');

  return <>{children}</>;
}
