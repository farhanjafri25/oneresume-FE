import React from 'react';
import { redirect } from 'next/navigation';
import { getMe, getResumes } from '@/lib/api';
import { getResumeAnalyticsAction } from '@/app/actions/resume';
import { Resume } from '@/types';
import AnalyticsOverview from './AnalyticsOverview';

// ─── Aggregation helpers ───────────────────────────────────────────────
// All pure: they only read from the per-resume payloads. No Date.now()/new
// Date() — the timeline dates come straight from the data and are formatted
// downstream (in AnalyticsChart) like the per-resume page does.

interface CountRow {
  count: number;
  [key: string]: unknown;
}

/**
 * Group an array of `{ <key>, count }` rows by the value at `key`, summing
 * counts. Returns rows shaped `{ [key], count }` sorted by count desc.
 */
function groupByKey(rows: CountRow[], key: string): Array<Record<string, unknown>> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const raw = row?.[key];
    const label = typeof raw === 'string' && raw.length > 0 ? raw : 'Unknown';
    map.set(label, (map.get(label) || 0) + (Number(row?.count) || 0));
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ [key]: label, count }))
    .sort((a, b) => (b.count as number) - (a.count as number));
}

/** Merge timeline rows by `date`, summing counts, sorted ascending by date. */
function mergeTimeline(rows: Array<{ date: string; count: number }>) {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row?.date) continue;
    map.set(row.date, (map.get(row.date) || 0) + (Number(row.count) || 0));
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

interface PerResumeResult {
  resume: Resume;
  // The analytics endpoint payload is loosely typed (matches the per-resume
  // page's use of `any` for the same backend shape).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analytics: any;
}

function aggregate(perResume: PerResumeResult[]) {
  let totalViews = 0;
  let uniqueViews = 0;
  let totalDownloads = 0;

  const allReferrers: CountRow[] = [];
  const allCampaigns: CountRow[] = [];
  const allTimeline: Array<{ date: string; count: number }> = [];
  const byResume: Array<{ id: string; title: string; slug: string; totalViews: number }> = [];

  for (const { resume, analytics } of perResume) {
    // Treat an errored / missing payload as all-zeros so one bad resume never
    // breaks the whole overview.
    const summary = (!analytics?.error && analytics?.summary) || {};
    const resumeViews = Number(summary.totalViews) || 0;

    totalViews += resumeViews;
    uniqueViews += Number(summary.uniqueViews) || 0;
    totalDownloads += Number(summary.totalDownloads) || 0;

    if (!analytics?.error) {
      if (Array.isArray(analytics?.referrers)) allReferrers.push(...analytics.referrers);
      if (Array.isArray(analytics?.campaigns)) allCampaigns.push(...analytics.campaigns);
      if (Array.isArray(analytics?.timeline)) allTimeline.push(...analytics.timeline);
    }

    byResume.push({
      id: resume.id,
      title: resume.title,
      slug: resume.slug,
      totalViews: resumeViews,
    });
  }

  byResume.sort((a, b) => b.totalViews - a.totalViews);

  return {
    summary: { totalViews, uniqueViews, totalDownloads },
    referrers: groupByKey(allReferrers, 'source') as Array<{ source: string; count: number }>,
    campaigns: groupByKey(allCampaigns, 'label') as Array<{ label: string; count: number }>,
    timeline: mergeTimeline(allTimeline),
    byResume,
  };
}

export default async function AnalyticsIndexPage() {
  let user = null;
  let resumes = null;
  try {
    // Mirror the dashboard: fire both in parallel. getMe() is deduped from the
    // layout, so this is effectively gated on the single getResumes() trip.
    [user, resumes] = await Promise.all([getMe(), getResumes()]);
  } catch (err) {
    console.error('AnalyticsIndexPage error:', err);
  }

  if (!user || !resumes) {
    redirect('/login');
  }

  // No account-wide endpoint exists — aggregate from the per-resume action.
  const perResume = await Promise.all(
    resumes.map(async (r) => ({
      resume: r,
      analytics: await getResumeAnalyticsAction(r.id),
    })),
  );

  const data = aggregate(perResume);

  return <AnalyticsOverview data={data} user={user} />;
}
