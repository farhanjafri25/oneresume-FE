import React from 'react';
import TopNav from '@/components/TopNav/TopNav';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/api';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let user;
  try {
    user = await getMe();
  } catch (err) {
    console.error('MainLayout auth check failed:', err);
  }

  if (!user) {
    redirect('/login');
  }

  // Onboarding gate. `user.onboardedAt` is the source of truth and is already on
  // the `getMe()` payload — no extra request. Not onboarded → the wizard.
  if (!user.onboardedAt) {
    redirect('/onboarding');
  }

  return (
    <>
      <TopNav user={user} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </>
  );
}
