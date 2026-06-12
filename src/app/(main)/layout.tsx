import React from 'react';
import TopNav from '@/components/TopNav/TopNav';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe, getResumes } from '@/lib/api';
import { ONBOARDED_COOKIE } from '@/lib/onboarding';
import OnboardingCookieSync from '@/components/OnboardingCookieSync/OnboardingCookieSync';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  // Onboarding gate. The cookie is the source of truth; if it's absent we derive
  // from existing data so brand-new users (0 resumes) are sent to the wizard while
  // established users are never trapped. Fail open on errors — never lock anyone out.
  const onboarded = cookieStore.get(ONBOARDED_COOKIE)?.value === '1';

  // Kick the resume count off alongside getMe() so the (only needed when the
  // cookie is absent) onboarding gate doesn't cost a second sequential round-trip.
  // Fail-open via .catch so a slow/dead backend never locks anyone out.
  const resumeCountPromise: Promise<number | null> | null = onboarded
    ? null
    : getResumes()
        .then((r) => r.length)
        .catch((err) => {
          console.error('MainLayout onboarding gate failed (fail-open):', err);
          return null;
        });

  let user;
  try {
    user = await getMe();
  } catch (err) {
    console.error('MainLayout auth check failed:', err);
  }

  if (!user) {
    redirect('/login');
  }

  let needsCookieSync = false;
  if (resumeCountPromise) {
    const resumeCount = await resumeCountPromise;
    // redirect() throws NEXT_REDIRECT — keep it out of any try/catch.
    if (resumeCount === 0) redirect('/onboarding');
    if (resumeCount && resumeCount > 0) needsCookieSync = true;
  }

  return (
    <>
      <TopNav user={user} />
      {needsCookieSync && <OnboardingCookieSync />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </>
  );
}
