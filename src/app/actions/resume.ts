'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function deleteResumeAction(resumeId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized' };
    }

    const res = await fetch(`${API_URL}/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { error: 'Failed to delete resume' };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    console.error('Delete Resume Error:', err);
    return { error: 'An unexpected error occurred while deleting the resume' };
  }
}
