import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMe, getResumes } from '@/lib/api';
import { getResumeAnalyticsAction } from '@/app/actions/resume';
import { SetActiveResume } from '@/components/ActiveResume/ActiveResumeContext';
import ResumeDetailView from './ResumeDetailView';

export default async function ResumeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ resumeId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { resumeId } = await params;
  const { tab } = await searchParams;

  let user = null;
  let resumes = null;
  try {
    // getMe() is deduped from the (main) layout call via Next's fetch cache.
    [user, resumes] = await Promise.all([getMe(), getResumes()]);
  } catch (err) {
    console.error('ResumeDetailPage error:', err);
  }

  if (!user || !resumes) {
    redirect('/login');
  }

  const resume = resumes.find((r) => r.id === resumeId);
  if (!resume) {
    notFound();
  }

  // Per-resume analytics power the Overview quick-stats and the Analytics tab.
  // Returns `{ error }` on failure — treat that as "no data" rather than crashing.
  const analyticsData = await getResumeAnalyticsAction(resumeId);
  const analytics = analyticsData && !analyticsData.error ? analyticsData : null;

  return (
    <>
      <SetActiveResume id={resume.id} />
      <ResumeDetailView
        user={user}
        resume={resume}
        analytics={analytics}
        initialTab={tab}
      />
    </>
  );
}
