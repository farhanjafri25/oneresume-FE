import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Brain } from '@phosphor-icons/react/dist/ssr';
import { serverFetch } from '@/lib/api';
import { Resume } from '@/types';
import AiReviewClient from './AiReviewClient';
import PageTransition from '@/components/motion/PageTransition';
import styles from './AiReview.module.css';

interface PageProps {
  params: Promise<{ resumeId: string }>;
}

export default async function AiReviewPage({ params }: PageProps) {
  const { resumeId } = await params;

  let resume: Resume;
  try {
    resume = await serverFetch<Resume>(`/resumes/${resumeId}`);
  } catch (err) {
    console.error('Failed to load resume for AI review:', err);
    notFound();
  }

  return (
    <PageTransition className={styles.container}>
      <Link href="/dashboard" className={styles.backBtn}>
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Brain size={32} style={{ color: 'var(--primary)' }} />
          <h1 className={styles.title} style={{ margin: 0 }}>AI Match Reviewer</h1>
        </div>
        <p className={styles.subtitle}>
          Running keyword density checks and alignment score matches for <strong>"{resume.title}"</strong>.
        </p>
      </header>

      <AiReviewClient resumeId={resumeId} />
    </PageTransition>
  );
}
