import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/api';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('token')?.value) redirect('/login');

  // Already onboarded → straight to the dashboard. Fail open on errors — never
  // trap a user on the wizard.
  let user;
  try {
    user = await getMe();
  } catch (err) {
    console.error('OnboardingLayout auth check failed (fail-open):', err);
  }
  if (user?.onboardedAt) redirect('/dashboard');

  return <>{children}</>;
}
