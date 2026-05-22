import React from 'react';
import VariantsView from './VariantsView';
import { getMe, getResumes } from '@/lib/api';
import { redirect } from 'next/navigation';

export default async function VariantsPage() {
  try {
    const user = await getMe();
    const resumes = await getResumes();
    
    return <VariantsView user={user} resumes={resumes} />;
  } catch (err) {
    console.error("VariantsPage error:", err);
    redirect('/login');
  }
}
