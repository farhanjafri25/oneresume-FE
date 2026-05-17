import React from 'react';
import TopNav from '@/components/TopNav/TopNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </>
  );
}
