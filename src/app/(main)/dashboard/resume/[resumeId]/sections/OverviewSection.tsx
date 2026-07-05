'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkle, Brain, Target, ArrowRight, PencilSimple } from '@phosphor-icons/react/dist/ssr';
import ResumePreview from '@/components/ResumePreview/ResumePreview';
import { Resume } from '@/types';
import type { AnalyticsData } from '../ResumeDetailView';
import styles from '../ResumeDetailView.module.css';

interface OverviewSectionProps {
  resume: Resume;
  pdfUrl?: string;
  hasPdf: boolean;
  analytics: AnalyticsData | null;
  onReplace: () => void;
  onOpenTracking: () => void;
}

export default function OverviewSection({
  resume,
  pdfUrl,
  hasPdf,
  analytics,
  onReplace,
  onOpenTracking,
}: OverviewSectionProps) {
  const totalViews = analytics?.summary?.totalViews ?? 0;
  const uniqueViews = analytics?.summary?.uniqueViews ?? 0;
  const totalDownloads = analytics?.summary?.totalDownloads ?? 0;

  return (
    <div className={styles.overviewGrid}>
      <div className={styles.heroPreview}>
        <ResumePreview pdfUrl={pdfUrl} title={resume.title} onEmptyClick={onReplace} />
      </div>

      <div className={styles.overviewSide}>
        <div className={styles.statRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalViews}</span>
            <span className={styles.statLabel}>Views</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{uniqueViews}</span>
            <span className={styles.statLabel}>Unique</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalDownloads}</span>
            <span className={styles.statLabel}>Downloads</span>
          </div>
        </div>

        <div className={styles.toolList}>
          <Link
            href={hasPdf ? `/dashboard/resume/${resume.id}/edit` : '#'}
            className={`${styles.toolCard} ${!hasPdf ? styles.toolDisabled : ''}`}
            aria-disabled={!hasPdf}
            onClick={(e) => {
              if (!hasPdf) e.preventDefault();
            }}
          >
            <span className={styles.toolIcon}>
              <PencilSimple size={20} />
            </span>
            <span className={styles.toolText}>
              <span className={styles.toolTitle}>Edit content</span>
              <span className={styles.toolDesc}>Update your details and save a new variant.</span>
            </span>
            <ArrowRight size={16} className={styles.toolArrow} />
          </Link>

          <Link
            href={hasPdf ? `/dashboard/ai-builder/${resume.id}` : '#'}
            className={`${styles.toolCard} ${!hasPdf ? styles.toolDisabled : ''}`}
            aria-disabled={!hasPdf}
            onClick={(e) => {
              if (!hasPdf) e.preventDefault();
            }}
          >
            <span className={styles.toolIcon}>
              <Sparkle size={20} />
            </span>
            <span className={styles.toolText}>
              <span className={styles.toolTitle}>Tailor with AI</span>
              <span className={styles.toolDesc}>Generate a role-specific variant from this resume.</span>
            </span>
            <ArrowRight size={16} className={styles.toolArrow} />
          </Link>

          <Link
            href={hasPdf ? `/dashboard/ai-review/${resume.id}` : '#'}
            className={`${styles.toolCard} ${!hasPdf ? styles.toolDisabled : ''}`}
            aria-disabled={!hasPdf}
            onClick={(e) => {
              if (!hasPdf) e.preventDefault();
            }}
          >
            <span className={styles.toolIcon}>
              <Brain size={20} />
            </span>
            <span className={styles.toolText}>
              <span className={styles.toolTitle}>Match reviewer</span>
              <span className={styles.toolDesc}>Score this resume against a job description.</span>
            </span>
            <ArrowRight size={16} className={styles.toolArrow} />
          </Link>

          <button type="button" className={styles.toolCard} onClick={onOpenTracking}>
            <span className={styles.toolIcon}>
              <Target size={20} />
            </span>
            <span className={styles.toolText}>
              <span className={styles.toolTitle}>Create tracking link</span>
              <span className={styles.toolDesc}>Make a per-application link to see who viewed it.</span>
            </span>
            <ArrowRight size={16} className={styles.toolArrow} />
          </button>
        </div>

        {!hasPdf && <p className={styles.hint}>Upload a PDF to unlock AI tailoring and reviews.</p>}
      </div>
    </div>
  );
}
