import React from 'react';
import DashboardView from './DashboardView';
import { getMe, getResumes } from '@/lib/api';
import { redirect } from 'next/navigation';
export default async function DashboardPage() {
  let user = null;
  let resumes = null;
  try {
    user = await getMe();
    if (user) {
      resumes = await getResumes();
    }
  } catch (err) {
    console.error("DashboardPage error:", err);
  }

  if (!user || !resumes) {
    redirect('/login');
  }

  return <DashboardView user={user} resumes={resumes} />;
}
