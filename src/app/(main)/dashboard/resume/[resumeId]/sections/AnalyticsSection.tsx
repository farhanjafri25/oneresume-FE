'use client';

import React from 'react';
import { ChartBar, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import Button from '@/components/Button/Button';
import type { AnalyticsData } from '../ResumeDetailView';
import styles from '../ResumeDetailView.module.css';

interface AnalyticsSectionProps {
  analytics: AnalyticsData | null;
  resumeId: string;
}

export default function AnalyticsSection({ analytics, resumeId }: AnalyticsSectionProps) {
  const summary = analytics?.summary;
  const totalViews = summary?.totalViews ?? 0;
  const uniqueViews = summary?.uniqueViews ?? 0;
  const totalDownloads = summary?.totalDownloads ?? 0;
  const desktop = summary?.desktop ?? 0;
  const mobile = summary?.mobile ?? 0;
  const tablet = summary?.tablet ?? 0;
  const deviceTotal = desktop + mobile + tablet || 1;
  const desktopPct = Math.round((desktop / deviceTotal) * 100);

  if (!analytics || totalViews === 0) {
    return (
      <div className={styles.emptyState}>
        <ChartBar size={40} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>No traffic recorded yet</h3>
        <p className={styles.emptyText}>Share your resume link with recruiters to start capturing views.</p>
        <Button href={`/dashboard/analytics/${resumeId}`} variant="secondary">
          View full analytics
          <ArrowRight size={15} />
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.analyticsWrap}>
      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalViews}</span>
          <span className={styles.statLabel}>Total views</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{uniqueViews}</span>
          <span className={styles.statLabel}>Unique views</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalDownloads}</span>
          <span className={styles.statLabel}>Downloads</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{desktopPct}%</span>
          <span className={styles.statLabel}>Desktop</span>
        </div>
      </div>

      <Button href={`/dashboard/analytics/${resumeId}`} variant="secondary">
        View full analytics
        <ArrowRight size={15} />
      </Button>
    </div>
  );
}
