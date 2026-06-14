import React from 'react';
import TopNav from '@/components/TopNav/TopNav';
import { ActiveResumeProvider } from '@/components/ActiveResume/ActiveResumeContext';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe, getResumes } from '@/lib/api';
import type { Resume } from '@/types';

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

  // Powers the header resume switcher. Request-deduped with the per-page
  // getResumes() via Next's fetch cache, so this adds no extra round-trip.
  let resumes: Resume[] = [];
  try {
    resumes = await getResumes();
  } catch (err) {
    console.error('MainLayout getResumes failed:', err);
  }

  return (
    <ActiveResumeProvider>
      <TopNav user={user} resumes={resumes} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </ActiveResumeProvider>
  );
}
