'use server';

import { serverFetch } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function updateAvatarAction(avatarUrl: string) {
  try {
    await serverFetch('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    });

    // Revalidate paths to update the avatar dynamically across pages
    revalidatePath('/settings');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (err: any) {
    console.error('Failed to update avatar:', err);
    return { error: err.message || 'Failed to update avatar' };
  }
}
