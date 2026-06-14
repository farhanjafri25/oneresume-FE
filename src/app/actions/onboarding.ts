'use server';

import { redirect } from 'next/navigation';
import { markOnboarded } from '@/lib/api';

export async function completeOnboardingAction() {
  try {
    await markOnboarded();
    return { success: true };
  } catch (error) {
    console.error('[completeOnboardingAction] Error marking onboarded:', error);
    return { error: 'Failed to complete onboarding' };
  }
}
