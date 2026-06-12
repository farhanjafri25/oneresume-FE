'use client';

import React, { useState } from 'react';
import styles from '../Dashboard.module.css';
import ResumeCard from '@/components/ResumeCard/ResumeCard';
import UploadModal from '@/components/UploadModal/UploadModal';
import { Plus, Sparkle } from '@phosphor-icons/react/dist/ssr';
import { Resume, User } from '@/types';

interface VariantsViewProps {
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

export default function VariantsView({ user, resumes }: VariantsViewProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);

  // Gather all tailored variants (non-default ones)
  const tailoredVariants: Array<{ resume: Resume; variant: any }> = [];
  
  resumes.forEach(resume => {
    resume.variants?.forEach(variant => {
      if (variant.slug !== 'default') {
        tailoredVariants.push({ resume, variant });
      }
    });
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tailored Variants</h1>
          <p className={styles.subtitle}>Manage role-specific custom versions of your master documents.</p>
        </div>
        {resumes.length > 0 && (
          <button 
            className={`btn-primary ${styles.newBtn}`}
            onClick={() => {
              setSelectedResumeId(resumes[0].id);
              setSelectedVariantId(undefined);
              setIsUploadOpen(true);
            }}
          >
            <Plus size={18} />
            New Variant
          </button>
        )}
      </header>
      
      <div className={styles.grid}>
        {tailoredVariants.map(({ resume, variant }) => {
          const latestVersion = variant.versions && variant.versions.length > 0
            ? variant.versions[0]
            : null;
          const pdfUrl = latestVersion ? latestVersion.fileUrl : '#';
          const publicUrl = `/${user.username}/${resume.slug}/${variant.slug}`;
          return (
            <ResumeCard 
              key={variant.id}
              id={resume.id}
              title={`${resume.title} (${variant.slug})`}
              timeAgo={formatUTCDate(resume.createdAt)}
              tags={[variant.slug]}
              pdfUrl={pdfUrl}
              publicUrl={publicUrl}
              onUploadClick={() => {
                setSelectedResumeId(resume.id);
                setSelectedVariantId(variant.id);
                setIsUploadOpen(true);
              }}
            />
          );
        })}

        {tailoredVariants.length === 0 && (
          <div 
            className={styles.newVariantCard} 
            style={{ gridColumn: '1 / -1', minHeight: '300px', cursor: 'default' }}
          >
            <div className={styles.newVariantIcon}>
              <Sparkle size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 className={styles.newVariantTitle}>No tailored variants yet</h3>
            <p className={styles.newVariantDesc} style={{ maxWidth: '400px', margin: '8px auto 0' }}>
              Create role-specific variants (like "frontend", "backend") by generating a resume from our AI on top of existing resumes.
            </p>
          </div>
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
    </div>
  );
}
