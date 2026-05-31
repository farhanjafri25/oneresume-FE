'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function analyzeResumeAction(resumeId: string, jd: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized. Please log in first.' };
    }

    const res = await fetch(`${API_URL}/resumes/${resumeId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ jd }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { error: errorData.message || 'Analysis failed. Please check your network and try again.' };
    }

    return await res.json();
  } catch (err) {
    console.error('Analyze Resume Error:', err);
    return { error: 'An unexpected error occurred while communicating with the AI server.' };
  }
}
