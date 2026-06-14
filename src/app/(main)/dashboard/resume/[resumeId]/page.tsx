import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getMe, getResumes, getResumeVariants } from '@/lib/api';
import { getResumeAnalyticsAction } from '@/app/actions/resume';
import { SetActiveResume } from '@/components/ActiveResume/ActiveResumeContext';
import ResumeDetailView from './ResumeDetailView';

export default async function ResumeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ resumeId: string }>;
  searchParams: Promise<{ tab?: string; welcome?: string }>;
}) {
  const { resumeId } = await params;
  const { tab, welcome } = await searchParams;

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

  // The `/resumes` list payload only carries the latest version per variant, so
  // fetch full variant history here (in parallel with analytics) for the Versions
  // tab. Falls back to the list's truncated variants if the call fails.
  const [analyticsData, variants] = await Promise.all([
    // Per-resume analytics power the Overview quick-stats and the Analytics tab.
    // Returns `{ error }` on failure — treat that as "no data" rather than crashing.
    getResumeAnalyticsAction(resumeId),
    getResumeVariants(resumeId).catch((err) => {
      console.error('Failed to load resume variants:', err);
      return null;
    }),
  ]);
  const analytics = analyticsData && !analyticsData.error ? analyticsData : null;
  const resumeWithVariants =
    variants && variants.length > 0 ? { ...resume, variants } : resume;

  return (
    <>
      <SetActiveResume id={resume.id} />
      <ResumeDetailView
        user={user}
        resume={resumeWithVariants}
        analytics={analytics}
        initialTab={tab}
        welcome={welcome === '1'}
      />
    </>
  );
}
