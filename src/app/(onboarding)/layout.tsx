import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ONBOARDED_COOKIE } from '@/lib/onboarding';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('token')?.value) redirect('/login');
  if (cookieStore.get(ONBOARDED_COOKIE)?.value === '1') redirect('/dashboard');
  return <>{children}</>;
}
