'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function checkEmailExists(email: string) {
  if (!email) return { error: 'Email is required' };

  try {
    const res = await fetch(`${API_URL}/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || 'Could not verify email' };
    }

    const data = await res.json();
    return { exists: Boolean(data.exists) };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}

export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || 'Failed to login' };
    }

    const data: AuthResponse = await res.json();
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }

  redirect('/dashboard');
}

export async function signupUser(prevState: any, formData: FormData) {
  const username = formData.get('username');
  const email = formData.get('email');
  const password = formData.get('password');

  if (!username || !email || !password) {
    return { error: 'All fields are required' };
  }

  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || 'Failed to sign up' };
    }

    const data = await res.json();
    
    if (data.requiresOtp) {
      return { requiresOtp: true, email: data.email };
    }

  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }

  // Fallback redirect if OTP wasn't required (e.g., future flow)
  redirect('/login');
}

export async function verifyOtpAction(prevState: any, formData: FormData) {
  const email = formData.get('email');
  const code = formData.get('code');

  if (!email || !code) {
    return { error: 'Email and verification code are required' };
  }

  try {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || 'Verification failed' };
    }

    const data: AuthResponse = await res.json();
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }

  redirect('/dashboard');
}

export async function resendOtpAction(email: string) {
  if (!email) return { error: 'Email is required' };

  try {
    const res = await fetch(`${API_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || 'Failed to resend code' };
    }

    return { success: true };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
}

export async function loginWithGoogle(googleToken: string) {
  if (!googleToken) {
    return { error: 'Google token is required' };
  }

  try {
    // Google auth always upserts: signs the user in if they exist, or creates
    // an account if they don't. No sign-in vs sign-up distinction.
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || 'Google login failed' };
    }

    const data: AuthResponse = await res.json();
    
    // Set token cookie
    const cookieStore = await cookies();
    cookieStore.set('token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

  } catch (error) {
    return { error: 'An unexpected error occurred during Google sign-in' };
  }

  redirect('/dashboard');
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  redirect('/login');
}
