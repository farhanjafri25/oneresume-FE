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
    revalidatePath(`/dashboard/resume/${resumeId}`);
    return { success: true };
  } catch (err) {
    console.error('Delete Resume Error:', err);
    return { error: 'An unexpected error occurred while deleting the resume' };
  }
}

export async function getResumeAnalyticsAction(resumeId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized' };
    }

    const res = await fetch(`${API_URL}/resumes/${resumeId}/analytics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { error: 'Failed to load analytics' };
    }

    return await res.json();
  } catch (err) {
    console.error('Get Resume Analytics Error:', err);
    return { error: 'An unexpected error occurred while loading analytics' };
  }
}

export async function getResumeVariantsAction(resumeId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized' };
    }

    const res = await fetch(`${API_URL}/resumes/${resumeId}/variants`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { error: 'Failed to load variants' };
    }

    return await res.json();
  } catch (err) {
    console.error('Get Resume Variants Error:', err);
    return { error: 'An unexpected error occurred while loading variants' };
  }
}


