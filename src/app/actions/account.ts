'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/** Reads the auth token from cookies. Returns null when the user is signed out. */
async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value ?? null;
}

/** Pulls a human-readable error message out of a non-OK response. */
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data.message || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Updates the user's display name and/or username. Does NOT change the email —
 * that goes through the OTP-verified flow below. Returns `{ error }` on failure.
 */
export async function updateProfileAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const token = await getToken();
  if (!token) return { error: 'Unauthorized' };

  const username = String(formData.get('username') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();

  if (!username) return { error: 'Username is required' };

  try {
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username, name }),
    });

    if (!res.ok) {
      return { error: await errorMessage(res, 'Failed to update profile') };
    }
  } catch {
    return { error: 'An unexpected error occurred' };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Starts an email change: validates the new address and emails an OTP to it.
 * The stored email is NOT changed until `verifyEmailChangeAction` succeeds.
 */
export async function requestEmailChangeAction(
  newEmail: string,
): Promise<{ error?: string; requiresOtp?: boolean }> {
  const token = await getToken();
  if (!token) return { error: 'Unauthorized' };

  const email = newEmail.trim();
  if (!email) return { error: 'Email is required' };

  try {
    const res = await fetch(`${API_URL}/auth/email/change-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newEmail: email }),
    });

    if (!res.ok) {
      return { error: await errorMessage(res, 'Could not start email change') };
    }

    return { requiresOtp: true };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}

/** Confirms the new email with the OTP and commits the change. */
export async function verifyEmailChangeAction(
  newEmail: string,
  code: string,
): Promise<{ error?: string; success?: boolean }> {
  const token = await getToken();
  if (!token) return { error: 'Unauthorized' };

  if (!newEmail.trim() || !code.trim()) {
    return { error: 'Email and verification code are required' };
  }

  try {
    const res = await fetch(`${API_URL}/auth/email/change-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newEmail: newEmail.trim(), code: code.trim() }),
    });

    if (!res.ok) {
      return { error: await errorMessage(res, 'Verification failed') };
    }
  } catch {
    return { error: 'An unexpected error occurred' };
  }

  revalidatePath('/settings');
  return { success: true };
}

/** Changes the password after verifying the current one. Password accounts only. */
export async function changePasswordAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const token = await getToken();
  if (!token) return { error: 'Unauthorized' };

  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!currentPassword || !newPassword) {
    return { error: 'All fields are required' };
  }
  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match' };
  }

  try {
    const res = await fetch(`${API_URL}/auth/password/change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      return { error: await errorMessage(res, 'Failed to change password') };
    }
  } catch {
    return { error: 'An unexpected error occurred' };
  }

  return { success: true };
}

/**
 * Permanently deletes the account and all owned data, clears the session, then
 * redirects to /login. Returns `{ error }` if the request fails (no redirect).
 */
export async function deleteAccountAction(): Promise<{ error?: string }> {
  const token = await getToken();
  if (!token) return { error: 'Unauthorized' };

  try {
    const res = await fetch(`${API_URL}/auth/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return { error: await errorMessage(res, 'Failed to delete account') };
    }
  } catch {
    return { error: 'An unexpected error occurred' };
  }

  const cookieStore = await cookies();
  cookieStore.delete('token');
  redirect('/login');
}
