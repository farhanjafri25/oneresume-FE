'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import styles from './Dashboard.module.css';
import { transitions } from '@/lib/motion';
import Button from '@/components/Button/Button';
import ResumeCard from '@/components/ResumeCard/ResumeCard';
import UploadModal from '@/components/UploadModal/UploadModal';
import ShareWidget from '@/components/ShareWidget/ShareWidget';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { Resume, User } from '@/types';
import { getDefaultVariant, getLatestVersion } from '@/lib/versions';

interface DashboardViewProps {
  user: User;
  resumes: Resume[];
}

function formatUTCDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export default function DashboardView({ user, resumes }: DashboardViewProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);

  const openNewResume = () => {
    setSelectedResumeId(undefined);
    setSelectedVariantId(undefined);
    setIsUploadOpen(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Resumes ({resumes.length})</h1>
        </div>
        <Button className={styles.newBtn} onClick={openNewResume}>
          <Plus size={18} />
          Upload Resume
        </Button>
      </header>

      <div className={styles.grid}>
        {resumes.map((resume, resumeIndex) => {
          const variant = getDefaultVariant(resume.variants);
          if (!variant) return null;
          const latestVersion = getLatestVersion(variant.versions);
          const pdfUrl = latestVersion ? latestVersion.fileUrl : undefined;
          const publicUrl = `/${user.username}/${resume.slug}`;
          const meta = latestVersion
            ? `v${latestVersion.versionNumber} · ${formatUTCDate(resume.createdAt)}`
            : formatUTCDate(resume.createdAt);
          return (
            <ResumeCard
              key={variant.id}
              index={resumeIndex}
              id={resume.id}
              title={resume.title}
              meta={meta}
              status={latestVersion ? undefined : { label: 'No PDF', tone: 'warn' }}
              pdfUrl={pdfUrl}
              publicUrl={publicUrl}
              detailHref={`/dashboard/resume/${resume.id}`}
              onReplaceClick={() => {
                setSelectedResumeId(resume.id);
                setSelectedVariantId(variant.id);
                setIsUploadOpen(true);
              }}
            />
          );
        })}

        {resumes.length === 0 && (
          <motion.div
            className={styles.newVariantCard}
            onClick={openNewResume}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.base}
          >
            <div className={styles.newVariantIcon}>
              <Plus size={24} />
            </div>
            <h3 className={styles.newVariantTitle}>Upload First Resume</h3>
            <p className={styles.newVariantDesc}>Get started by uploading your master PDF.</p>
          </motion.div>
        )}

        {/* New resume card (only when they already have at least one master) */}
        {resumes.length > 0 && (
          <motion.div
            className={styles.newVariantCard}
            onClick={openNewResume}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.base, delay: resumes.length * 0.06 }}
          >
            <div className={styles.newVariantIcon}>
              <Plus size={24} />
            </div>
            <h3 className={styles.newVariantTitle}>Upload new resume</h3>
            <p className={styles.newVariantDesc}>Add a completely separate resume to your dashboard.</p>
          </motion.div>
        )}
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setSelectedResumeId(undefined);
          setSelectedVariantId(undefined);
        }}
        resumeId={selectedResumeId}
        variantId={selectedVariantId}
      />

      <ShareWidget />
    </div>
  );
}
