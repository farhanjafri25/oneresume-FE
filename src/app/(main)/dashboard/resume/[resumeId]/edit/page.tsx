import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, PencilSimple } from '@phosphor-icons/react/dist/ssr';
import { serverFetch } from '@/lib/api';
import { Resume, TailoredData } from '@/types';
import { getResumeContentAction } from '@/app/actions/ai';
import { SetActiveResume } from '@/components/ActiveResume/ActiveResumeContext';
import PageTransition from '@/components/motion/PageTransition';
import ResumeEditorClient from './ResumeEditorClient';
import styles from './ResumeEditor.module.css';

interface PageProps {
  params: Promise<{ resumeId: string }>;
}

export default async function ResumeEditorPage({ params }: PageProps) {
  const { resumeId } = await params;

  let resume: Resume;
  try {
    resume = await serverFetch<Resume>(`/resumes/${resumeId}`);
  } catch (err) {
    console.error('Failed to load resume for editor:', err);
    notFound();
  }

  // Prefill fetched here so the form renders populated on first paint. A
  // failure still renders the page — the client shows a retry / empty state.
  const contentRes = await getResumeContentAction(resumeId);
  const hasContent = !contentRes.error && contentRes.content;

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
            <PencilSimple size={22} weight="fill" />
          </span>
          <h1 className={styles.title}>Edit resume</h1>
        </div>
        <p className={styles.subtitle}>
          Update the content of <strong>{resume.title}</strong> and save it as
          a new variant. The original stays untouched.
        </p>
      </header>

      <ResumeEditorClient
        resumeId={resumeId}
        resumeTitle={resume.title}
        resumeSlug={resume.slug}
        initialContent={hasContent ? (contentRes.content as TailoredData) : null}
        initialThemeId={hasContent ? (contentRes.themeId ?? null) : null}
        contentError={contentRes.error ?? null}
        contentNotAvailable={Boolean(contentRes.notAvailable)}
      />
    </PageTransition>
  );
}
