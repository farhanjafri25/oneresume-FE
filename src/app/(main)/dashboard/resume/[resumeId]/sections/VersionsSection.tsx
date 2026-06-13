'use client';

import React from 'react';
import { Link as LinkIcon, ArrowSquareOut, Clock, UploadSimple } from '@phosphor-icons/react/dist/ssr';
import Button from '@/components/Button/Button';
import { Version } from '@/types';
import styles from '../ResumeDetailView.module.css';

interface VersionsSectionProps {
  versions: Version[];
  username: string;
  resumeSlug: string;
  onUploadClick: () => void;
  onCopied: (message: string) => void;
}

function formatDate(dateStr: string | Date) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
}

export default function VersionsSection({
  versions,
  username,
  resumeSlug,
  onUploadClick,
  onCopied,
}: VersionsSectionProps) {
  const copyLink = (versionNumber: number) => {
    const url = `${window.location.origin}/${username}/${resumeSlug}/v${versionNumber}`;
    navigator.clipboard
      .writeText(url)
      .then(() => onCopied(`Copied link for Version ${versionNumber}!`))
      .catch((err) => console.error('Failed to copy:', err));
  };

  return (
    <div className={styles.versionsWrap}>
      <div className={styles.versionsHeader}>
        <p className={styles.sectionLede}>Track, preview, and share every historical version of this resume.</p>
        <Button variant="secondary" size="sm" onClick={onUploadClick}>
          <UploadSimple size={14} />
          Upload new version
        </Button>
      </div>

      {versions.length === 0 ? (
        <div className={styles.emptyState}>
          <Clock size={40} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No versions found</h3>
          <p className={styles.emptyText}>Upload your first file to begin version tracking.</p>
        </div>
      ) : (
        <div className={styles.timeline}>
          {versions.map((version, index) => {
            const isLatest = index === 0;
            return (
              <div key={version.id} className={styles.versionRow}>
                <div className={styles.dotContainer}>
                  <div className={`${styles.dot} ${isLatest ? styles.activeDot : ''}`} />
                </div>
                <div className={styles.versionDetails}>
                  <div className={styles.versionHeader}>
                    <span className={styles.versionTitle}>Version {version.versionNumber}</span>
                    {isLatest && <span className={styles.badge}>Active</span>}
                  </div>
                  <span className={styles.versionDate}>{formatDate(version.createdAt)}</span>
                </div>
                <div className={styles.versionActions}>
                  <Button size="sm" onClick={() => copyLink(version.versionNumber)}>
                    <LinkIcon size={14} />
                    Copy share link
                  </Button>
                  {version.fileUrl && (
                    <Button variant="secondary" size="sm" href={version.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ArrowSquareOut size={14} />
                      View PDF
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
