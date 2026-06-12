import React from 'react';
import DashboardView from './DashboardView';
import { getMe, getResumes } from '@/lib/api';
import { redirect } from 'next/navigation';
export default async function DashboardPage() {
  let user = null;
  let resumes = null;
  try {
    // Fire both in parallel rather than getMe()-then-getResumes(). getMe() is
    // already deduped from the layout's call, so this is effectively gated on
    // the single getResumes() round-trip instead of two sequential ones.
    [user, resumes] = await Promise.all([getMe(), getResumes()]);
  } catch (err) {
    console.error("DashboardPage error:", err);
  }

  if (!user || !resumes) {
    redirect('/login');
  }

  return <DashboardView user={user} resumes={resumes} />;
}
