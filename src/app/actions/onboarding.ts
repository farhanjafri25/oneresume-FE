'use server';

import { redirect } from 'next/navigation';
import { markOnboarded } from '@/lib/api';

export async function completeOnboardingAction(opts?: { redirectTo?: string | null }) {
  // Persist completion server-side — the sole source of truth for the gate.
  await markOnboarded();
  if (opts?.redirectTo !== null) redirect(opts?.redirectTo ?? '/dashboard');
}
