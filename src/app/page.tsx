import React from 'react';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import CallToAction from '@/components/landing/CallToAction';
import TopNav from '@/components/TopNav/TopNav';
import { cookies } from 'next/headers';
import { getMe } from '@/lib/api';
import { User } from '@/types';
import styles from '@/components/landing/landing.module.css';

export default async function LandingPage() {
  let user: User | undefined = undefined;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      user = (await getMe()) || undefined;
    }
  } catch (e) {
    // Silently ignore auth failure for the public landing page
  }

  return (
    <>
      <TopNav user={user} />
      <div className={styles.container}>
        <Hero />
        <Features />
        <CallToAction />
      </div>
    </>
  );
}
