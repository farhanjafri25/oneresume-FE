import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { serverFetch } from '@/lib/api';
import { Resume } from '@/types';
import AiBuilderClient from './AiBuilderClient';
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
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backBtn}>
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Sparkles size={32} style={{ color: '#a855f7' }} />
          <h1 className={styles.title} style={{ margin: 0 }}>AI Resume Builder</h1>
        </div>
        <p className={styles.subtitle}>
          Optimize experiences, summary, and skills for <strong>"{resume.title}"</strong> and compile into an ATS-friendly theme.
        </p>
      </header>

      <AiBuilderClient resumeId={resumeId} />
    </div>
  );
}
