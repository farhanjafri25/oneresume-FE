import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkle } from '@phosphor-icons/react/dist/ssr';
import { serverFetch } from '@/lib/api';
import { Resume } from '@/types';
import { SetActiveResume } from '@/components/ActiveResume/ActiveResumeContext';
import AiBuilderClient from './AiBuilderClient';
import PageTransition from '@/components/motion/PageTransition';
import styles from './AiBuilder.module.css';

interface PageProps {
  params: Promise<{ resumeId: string }>;
}

export default async function AiBuilderPage({ params }: PageProps) {
  const { resumeId } = await params;

  let resume: Resume;
  try {
    resume = await serverFetch<Resume>(`/resumes/${resumeId}`);
  } catch (err) {
    console.error('Failed to load resume for AI builder:', err);
    notFound();
  }

  return (
    <PageTransition className={styles.container}>
      <SetActiveResume id={resumeId} />
      <Link href={`/dashboard/resume/${resumeId}`} className={styles.backBtn}>
        <ArrowLeft size={16} />
        Back to {resume.title}
      </Link>

      <header className={styles.header}>
        <div className={styles.headerRow}>
          <span className={styles.iconTile}>
            <Sparkle size={22} weight="fill" />
          </span>
          <h1 className={styles.title}>AI Resume Builder</h1>
        </div>
        <p className={styles.subtitle}>
          Tailor your experience, summary, and skills for{' '}
          <strong>{resume.title}</strong> and compile an ATS-friendly variant.
        </p>
      </header>

      <AiBuilderClient resumeId={resumeId} />
    </PageTransition>
  );
}
