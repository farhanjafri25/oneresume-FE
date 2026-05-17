import React from 'react';
import TopNav from '@/components/TopNav/TopNav';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/api';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  console.log("MainLayout: token present:", !!token);

  if (!token) {
    console.log("MainLayout: No token found, redirecting to /login");
    redirect('/login');
  }

  try {
    // Verify token and fetch user
    const user = await getMe();
    
    return (
      <>
        {/* Pass user to TopNav if needed */}
        <TopNav user={user} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </>
    );
  } catch (err) {
    console.error("MainLayout auth check failed:", err);
    // Token might be expired or invalid
    redirect('/login');
  }
}
