import { cookies } from 'next/headers';
import { User, Resume, Variant } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Upper bound on how long a single backend request may hang before we give up.
// The backend can cold-start (~30-60s on its host), so this is deliberately
// generous — it exists to kill truly dead sockets, not to race a cold boot.
const REQUEST_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS) || 60000;

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

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err: unknown) {
    // AbortSignal.timeout rejects with a TimeoutError; surface it clearly so
    // callers don't confuse a slow/dead backend with an auth failure.
    const name = err instanceof Error ? err.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw err;
  }

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

export async function getMe(options?: RequestInit): Promise<User | null> {
  try {
    return await serverFetch<User>('/auth/me', options);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return null;
    }
    throw err;
  }
}

export async function getResumes(options?: RequestInit): Promise<Resume[]> {
  return serverFetch<Resume[]>('/resumes', options);
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
