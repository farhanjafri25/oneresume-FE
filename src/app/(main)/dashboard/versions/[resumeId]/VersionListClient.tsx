'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Link2, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import styles from './versions.module.css';

interface Version {
  id: string;
  versionNumber: number;
  fileUrl: string;
  publicId: string;
  createdAt: string;
}

interface Resume {
  id: string;
  title: string;
  slug: string;
  variants: Array<{
    id: string;
    slug: string;
    versions: Version[];
  }>;
}

interface VersionListClientProps {
  resume: Resume;
  username: string;
}

export default function VersionListClient({ resume, username }: VersionListClientProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const defaultVariant = resume.variants?.[0];
  const versions = defaultVariant?.versions || [];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleCopyLink = (versionNumber: number) => {
    // Unique version shareable link format: /[username]/[resume-slug]/v[versionNumber]
    const relativeUrl = `/${username}/${resume.slug}/v${versionNumber}`;
    const fullUrl = `${window.location.origin}${relativeUrl}`;

    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        setToastMessage(`Copied link for Version ${versionNumber}!`);
        setShowToast(true);
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
      });
  };

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backBtn}>
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>{resume.title}</h1>
        <p className={styles.subtitle}>
          Track, preview, and share every historical version of this resume.
        </p>
      </div>

      <div className={styles.glassCard}>
        {versions.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No Versions Found</h3>
            <p className={styles.date}>Upload your first file to begin version tracking.</p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {versions.map((version, index) => {
              const isLatest = index === 0;
              return (
                <div key={version.id} className={styles.row}>
                  <div className={styles.dotContainer}>
                    <div className={`${styles.dot} ${isLatest ? styles.activeDot : ''}`} />
                  </div>

                  <div className={styles.details}>
                    <div className={styles.versionHeader}>
                      <span className={styles.versionTitle}>Version {version.versionNumber}</span>
                      {isLatest && <span className={styles.badge}>Active</span>}
                    </div>
                    <span className={styles.date}>{formatDate(version.createdAt)}</span>
                  </div>

                  <div className={styles.actions}>
                    <button
                      className={`btn-primary ${styles.actionBtn} ${styles.primaryBtn}`}
                      onClick={() => handleCopyLink(version.versionNumber)}
                    >
                      <Link2 size={14} />
                      Copy Share Link
                    </button>

                    {version.fileUrl && (
                      <a
                        href={version.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionBtn}
                      >
                        <ExternalLink size={14} />
                        View PDF
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showToast && (
        <div className={styles.toast}>
          <CheckCircle size={16} className={styles.toastIcon} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
