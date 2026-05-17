import React from 'react';
import DashboardView from './DashboardView';
import { getMe, getResumes } from '@/lib/api';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  try {
    const user = await getMe();
    const resumes = await getResumes();
    
    return <DashboardView user={user} resumes={resumes} />;
  } catch (err) {
    redirect('/login');
  }
}
