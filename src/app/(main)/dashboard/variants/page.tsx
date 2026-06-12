import React from 'react';
import VariantsView from './VariantsView';
import { getMe, getResumes } from '@/lib/api';
import { redirect } from 'next/navigation';

export default async function VariantsPage() {
  let user = null;
  let resumes = null;
  try {
    // Parallel rather than sequential; getMe() is deduped from the layout call.
    [user, resumes] = await Promise.all([getMe(), getResumes()]);
  } catch (err) {
    console.error("VariantsPage error:", err);
  }

  if (!user || !resumes) {
    redirect('/login');
  }

  return <VariantsView user={user} resumes={resumes} />;
}
