'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  redirect('/login');
}
