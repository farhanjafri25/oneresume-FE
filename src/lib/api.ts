import { cookies } from 'next/headers';
import { User, Resume, Variant } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Fetch wrapper for Server Components and Server Actions.
 * Automatically attaches the Authorization token from cookies.
 */
export async function serverFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If parsing fails, fall back to status text
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ─── Data Fetching Utilities (Server-Side) ─────────────────────────

export async function getMe(): Promise<User | null> {
  try {
    return await serverFetch<User>('/auth/me');
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return null;
    }
    throw err;
  }
}

export async function getResumes(): Promise<Resume[]> {
  return serverFetch<Resume[]>('/resumes');
}

/**
 * Mark the current user onboarded server-side (idempotent on the backend).
 * Source of truth for the onboarding gate. Returns the updated user.
 */
export async function markOnboarded(): Promise<User> {
  return serverFetch<User>('/auth/onboarded', { method: 'POST' });
}

export async function getResumeVariants(resumeId: string): Promise<Variant[]> {
  return serverFetch<Variant[]>(`/resumes/${resumeId}/variants`);
}
