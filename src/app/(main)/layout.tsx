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

  let user;
  try {
    user = await getMe();
  } catch (err) {
    console.error('MainLayout auth check failed:', err);
  }

  if (!user) {
    redirect('/login');
  }

  // Onboarding gate. The server field (user.onboardedAt) is authoritative and is
  // already on the `getMe()` payload — no extra request. Until the backend ships
  // it, the field is `undefined` and we fall back to the legacy cookie + resume-
  // count heuristic. Fail open on errors — never lock anyone out.
  let needsCookieSync = false;
  if (user.onboardedAt) {
    // Server says onboarded — allow through.
  } else if (user.onboardedAt === null) {
    // Server explicitly says not onboarded.
    redirect('/onboarding');
  } else if (cookieStore.get(ONBOARDED_COOKIE)?.value !== '1') {
    // Legacy path: backend doesn't expose onboardedAt yet, no cookie set.
    let resumeCount: number | null = null;
    try {
      resumeCount = (await getResumes()).length;
    } catch (err) {
      console.error('MainLayout onboarding gate failed (fail-open):', err);
    }
    // redirect() throws NEXT_REDIRECT — keep it out of the try/catch above.
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
