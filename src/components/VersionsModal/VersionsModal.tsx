'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link, ArrowSquareOut, Clock, X, CircleNotch } from '@phosphor-icons/react/dist/ssr';
import styles from './VersionsModal.module.css';
import { Resume, Variant } from '@/types';
import { getResumeVariantsAction } from '@/app/actions/resume';
import { getDefaultVariant, sortVersionsDesc } from '@/lib/versions';
import Button from '@/components/Button/Button';
import Modal from '@/components/motion/Modal';
import { Version } from '@/types';

interface VersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: Resume | null;
  username: string;
}

export default function VersionsModal({ isOpen, onClose, resume, username }: VersionsModalProps) {
  const [fetchedVersions, setFetchedVersions] = useState<Version[]>([]);
  const [fetchedResumeId, setFetchedResumeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resumeId = resume?.id;

  useEffect(() => {
    let cancelled = false;

    async function loadVersions() {
      if (!isOpen || !resumeId) return;
      setLoading(true);
      try {
        const result = await getResumeVariantsAction(resumeId);
        const variants: Variant[] = Array.isArray(result) ? result : [];
        const defaultVariant = getDefaultVariant(variants);

        if (!cancelled) {
          setFetchedVersions(sortVersionsDesc(defaultVariant?.versions));
          setFetchedResumeId(resumeId);
        }
      } catch (err) {
        console.error('Failed to load versions:', err);
        if (!cancelled) {
          setFetchedVersions([]);
          setFetchedResumeId(resumeId);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVersions();
    return () => {
      cancelled = true;
    };
  }, [isOpen, resumeId]);

  const formatDate = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
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
  };

  const handleCopyLink = (versionNumber: number) => {
    if (!resume) return;
    // Unique version shareable link format: /[username]/[resume-slug]/v[versionNumber]
    const relativeUrl = `/${username}/${resume.slug}/v${versionNumber}`;
    const fullUrl = `${window.location.origin}${relativeUrl}`;

    navigator.clipboard.writeText(fullUrl)
      .then(() => toast.success(`Copied link for Version ${versionNumber}!`))
      .catch(() => toast.error("Couldn't copy link. Please try again."));
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !!resume}
        onClose={onClose}
        overlayClassName={styles.modalOverlay}
        contentClassName={styles.modalContent}
        labelledBy="versions-modal-title"
      >
        {resume && (
          <>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={24} />
            </button>

            <div className={styles.header}>
              <h1 id="versions-modal-title" className={styles.title}>{resume.title}</h1>
              <p className={styles.subtitle}>
                Track, preview, and share every historical version of this resume.
              </p>
            </div>

            <div className={styles.glassCard}>
              {loading || fetchedResumeId !== resume.id ? (
                <div className={styles.emptyState}>
                  <CircleNotch size={48} className={`${styles.emptyIcon} spin`} />
                  <h3 className={styles.emptyTitle}>Loading versions...</h3>
                </div>
              ) : fetchedVersions.length === 0 ? (
                <div className={styles.emptyState}>
                  <Clock size={48} className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No Versions Found</h3>
                  <p className={styles.date}>Upload your first file to begin version tracking.</p>
                </div>
              ) : (
                <div className={styles.timeline}>
                  {fetchedVersions.map((version, index) => {
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
                          <Button
                            size="sm"
                            onClick={() => handleCopyLink(version.versionNumber)}
                          >
                            <Link size={14} />
                            Copy share link
                          </Button>

                          {version.fileUrl && (
                            <Button
                              variant="secondary"
                              size="sm"
                              href={version.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
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
          </>
        )}
      </Modal>
    </>
  );
}
