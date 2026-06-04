import React from 'react';
import VariantsView from './VariantsView';
import { getMe, getResumes } from '@/lib/api';
import { redirect } from 'next/navigation';

export default async function VariantsPage() {
  let user = null;
  let resumes = null;
  try {
    user = await getMe();
    if (user) {
      resumes = await getResumes();
    }
  } catch (err) {
    console.error("VariantsPage error:", err);
  }

  if (!user || !resumes) {
    redirect('/login');
  }

  return <VariantsView user={user} resumes={resumes} />;
}
