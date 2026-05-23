'use client';

import React, { useState } from 'react';
import styles from './Dashboard.module.css';
import ResumeCard from '@/components/ResumeCard/ResumeCard';
import UploadModal from '@/components/UploadModal/UploadModal';
import { Plus } from 'lucide-react';
import { Resume, User } from '@/types';

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {user.username}.</h1>
          <p className={styles.subtitle}>Here are your active master documents.</p>
        </div>
        <button 
          className={`btn-primary ${styles.newBtn}`}
          onClick={() => {
            setSelectedResumeId(undefined);
            setSelectedVariantId(undefined);
            setIsUploadOpen(true);
          }}
        >
          <Plus size={18} />
          Upload Resume
        </button>
      </header>
      
      <div className={styles.grid}>
        {resumes.map(resume => (
          resume.variants?.filter(variant => variant.slug === 'default').map(variant => {
            const latestVersion = variant.versions && variant.versions.length > 0
              ? variant.versions[0]
              : null;
            const pdfUrl = latestVersion ? latestVersion.fileUrl : '#';
            const publicUrl = `/${user.username}/${resume.slug}`;
            return (
              <ResumeCard 
                key={variant.id}
                id={resume.id}
                title={variant.slug === 'default' ? resume.title : `${resume.title} (${variant.slug})`}
                timeAgo={formatUTCDate(resume.createdAt)}
                tags={latestVersion ? [`v${latestVersion.versionNumber}`] : ['No PDF']}
                pdfUrl={pdfUrl}
                publicUrl={publicUrl}
                onUploadClick={() => {
                  setSelectedResumeId(resume.id);
                  setSelectedVariantId(variant.id);
                  setIsUploadOpen(true);
                }}
              />
            );
          })
        ))}

        {resumes.length === 0 && (
          <div 
            className={styles.newVariantCard} 
            onClick={() => {
              setSelectedResumeId(undefined);
              setSelectedVariantId(undefined);
              setIsUploadOpen(true);
            }}
          >
            <div className={styles.newVariantIcon}>
              <Plus size={24} />
            </div>
            <h3 className={styles.newVariantTitle}>Upload First Resume</h3>
            <p className={styles.newVariantDesc}>
              Get started by uploading your master PDF.
            </p>
          </div>
        )}
        
        {/* New Variant Card (only show if they have a master) */}
        {resumes.length > 0 && (
          <div 
            className={styles.newVariantCard}
            onClick={() => {
              setSelectedResumeId(undefined);
              setSelectedVariantId(undefined);
              setIsUploadOpen(true);
            }}
          >
            <div className={styles.newVariantIcon}>
              <Plus size={24} />
            </div>
            <h3 className={styles.newVariantTitle}>Upload new resume</h3>
            <p className={styles.newVariantDesc}>
              Add a completely separate resume to your dashboard.
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
