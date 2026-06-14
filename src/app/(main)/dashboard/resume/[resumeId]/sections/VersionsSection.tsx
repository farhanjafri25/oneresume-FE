'use client';

import React from 'react';
import { Link as LinkIcon, ArrowSquareOut, Clock, UploadSimple } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import Button from '@/components/Button/Button';
import { Version } from '@/types';
import { sortVersionsDesc } from '@/lib/versions';
import styles from '../ResumeDetailView.module.css';

interface VersionsSectionProps {
  versions: Version[];
  username: string;
  resumeSlug: string;
  onUploadClick: () => void;
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
}: VersionsSectionProps) {
  // Sort defensively so the timeline + "Active" badge are correct regardless of
  // the order the caller/API supplies. Latest = highest versionNumber.
  const sortedVersions = sortVersionsDesc(versions);
  const latestVersionNumber = sortedVersions[0]?.versionNumber;

  const copyLink = (versionNumber: number) => {
    const url = `${window.location.origin}/${username}/${resumeSlug}/v${versionNumber}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(`Copied link for Version ${versionNumber}!`))
      .catch(() => toast.error("Couldn't copy link. Please try again."));
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

      {sortedVersions.length === 0 ? (
        <div className={styles.emptyState}>
          <Clock size={40} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No versions found</h3>
          <p className={styles.emptyText}>Upload your first file to begin version tracking.</p>
        </div>
      ) : (
        <div className={styles.timeline}>
          {sortedVersions.map((version) => {
            const isLatest = version.versionNumber === latestVersionNumber;
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
