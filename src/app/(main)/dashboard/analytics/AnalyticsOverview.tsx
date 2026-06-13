'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChartBar,
  Globe,
  Tag,
  FileText,
  ArrowUpRight,
} from '@phosphor-icons/react/dist/ssr';
import { User } from '@/types';
import Tabs from '@/components/Tabs/Tabs';
import PageTransition from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import AnalyticsChart from './[resumeId]/AnalyticsChart';
import styles from './AnalyticsOverview.module.css';

interface OverviewData {
  summary: { totalViews: number; uniqueViews: number; totalDownloads: number };
  referrers: Array<{ source: string; count: number }>;
  campaigns: Array<{ label: string; count: number }>;
  timeline: Array<{ date: string; count: number }>;
  byResume: Array<{ id: string; title: string; slug: string; totalViews: number }>;
}

interface AnalyticsOverviewProps {
  data: OverviewData;
  user: User;
}

const RANGE_ITEMS = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'all', label: 'All time' },
];

export default function AnalyticsOverview({ data }: AnalyticsOverviewProps) {
  // The per-resume endpoint returns a fixed (30-day) window, so the range
  // selector is currently cosmetic. We surface it for the intended UX and show
  // a muted note when a non-default range is picked — never breaking the view.
  const [range, setRange] = useState('30d');

  const { summary, referrers, campaigns, timeline, byResume } = data;
  const totalViews = summary.totalViews || 0;
  const uniqueViews = summary.uniqueViews || 0;
  const totalDownloads = summary.totalDownloads || 0;

  const maxReferrals = Math.max(...referrers.map((r) => r.count), 1);
  const maxCampaigns = Math.max(...campaigns.map((c) => c.count), 1);

  return (
    <PageTransition className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>
            See who&apos;s viewing your resumes and where they came from.
          </p>
        </div>
        <Tabs
          items={RANGE_ITEMS}
          activeId={range}
          onTabClick={setRange}
          fill="never"
          ariaLabel="Time range"
          className={styles.rangeTabs}
        />
      </header>

      {range !== '30d' && (
        <p className={styles.rangeNote}>
          Showing the last 30 days. Other ranges are coming soon.
        </p>
      )}

      {/* Summary Scorecards */}
      <StaggerContainer className={styles.statsGrid}>
        <StaggerItem className={styles.card}>
          <span className={styles.cardLabel}>Total views</span>
          <span className={styles.cardValue}>{totalViews}</span>
          <span className={styles.cardSubtext}>Across all resumes</span>
        </StaggerItem>
        <StaggerItem className={styles.card}>
          <span className={styles.cardLabel}>Unique views</span>
          <span className={styles.cardValue}>{uniqueViews}</span>
          <span className={styles.cardSubtext}>Individual visitors</span>
        </StaggerItem>
        <StaggerItem className={styles.card}>
          <span className={styles.cardLabel}>Downloads</span>
          <span className={styles.cardValue}>{totalDownloads}</span>
          <span className={styles.cardSubtext}>PDF saves &amp; exports</span>
        </StaggerItem>
      </StaggerContainer>

      {totalViews === 0 ? (
        <div className={styles.emptyState}>
          <ChartBar size={48} className={styles.emptyStateIcon} />
          <h2 className={styles.emptyStateTitle}>No traffic recorded yet</h2>
          <p>Share your resume links with recruiters to start capturing views.</p>
        </div>
      ) : (
        <>
          {/* Total views over time */}
          <AnalyticsChart timeline={timeline} />

          <div className={styles.detailGrid}>
            {/* By source */}
            <div className={styles.card}>
              <h2 className={styles.panelTitle}>
                <Globe size={18} className={styles.panelIcon} />
                By source
              </h2>
              <div className={styles.sourceList}>
                {referrers.map((ref, idx) => {
                  const percent = Math.round((ref.count / maxReferrals) * 100) || 5;
                  return (
                    <div key={idx} className={styles.sourceItem}>
                      <div className={styles.sourceHeader}>
                        <span className={styles.sourceName}>{ref.source}</span>
                        <span className={styles.sourceCount}>{ref.count} views</span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div className={styles.progressBar} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
                {referrers.length === 0 && (
                  <p className={styles.panelEmpty}>No referrer data yet.</p>
                )}
              </div>
            </div>

            {/* By tracked link (campaign) */}
            <div className={styles.card}>
              <h2 className={styles.panelTitle}>
                <Tag size={18} className={styles.panelIcon} />
                By tracked link
              </h2>
              <div className={styles.sourceList}>
                {campaigns.map((camp, idx) => {
                  const percent = Math.round((camp.count / maxCampaigns) * 100) || 5;
                  return (
                    <div key={idx} className={styles.sourceItem}>
                      <div className={styles.sourceHeader}>
                        <span className={styles.sourceName}>{camp.label}</span>
                        <span className={styles.sourceCount}>{camp.count} views</span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div
                          className={styles.progressBar}
                          style={{ width: `${percent}%`, backgroundColor: '#f59e0b' }}
                        />
                      </div>
                    </div>
                  );
                })}
                {campaigns.length === 0 && (
                  <p className={styles.panelEmpty}>No tracked link views recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* By resume */}
          <div className={styles.card}>
            <h2 className={styles.panelTitle}>
              <FileText size={18} className={styles.panelIcon} />
              By resume
            </h2>
            <div className={styles.resumeList}>
              {byResume.map((r) => (
                <div key={r.id} className={styles.resumeRow}>
                  <Link href={`/dashboard/resume/${r.id}`} className={styles.resumeLink}>
                    <span className={styles.resumeTitle}>{r.title}</span>
                    <span className={styles.resumeViews}>{r.totalViews} views</span>
                  </Link>
                  <Link
                    href={`/dashboard/analytics/${r.id}`}
                    className={styles.detailsLink}
                  >
                    View details
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              ))}
              {byResume.length === 0 && (
                <p className={styles.panelEmpty}>You haven&apos;t added any resumes yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </PageTransition>
  );
}
