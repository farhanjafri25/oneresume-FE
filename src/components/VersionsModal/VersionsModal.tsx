'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link2, ExternalLink, CheckCircle, Clock, X, Loader2 } from 'lucide-react';
import styles from './VersionsModal.module.css';
import { Resume } from '@/types';
import { getResumeVariantsAction } from '@/app/actions/resume';
import Modal from '@/components/motion/Modal';
import { slideUp } from '@/lib/motion';

interface Version {
  id: string;
  versionNumber: number;
  fileUrl: string;
  publicId: string;
  createdAt: string;
}

interface VersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: Resume | null;
  username: string;
}

export default function VersionsModal({ isOpen, onClose, resume, username }: VersionsModalProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [fetchedVersions, setFetchedVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  // Retain the last non-null resume so content stays rendered during the
  // modal's exit animation (the parent nulls `resume` the moment it closes).
  const [displayResume, setDisplayResume] = useState<Resume | null>(resume);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    async function loadVersions() {
      if (!isOpen || !resume) return;
      setLoading(true);
      try {
        const variants = await getResumeVariantsAction(resume.id);
        if (variants && !variants.error) {
          const defaultVariant = variants.find((v: any) => v.slug === 'default') || variants[0];
          if (defaultVariant && defaultVariant.versions) {
            setFetchedVersions(defaultVariant.versions);
          }
        }
      } catch (err) {
        console.error('Failed to load versions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVersions();
  }, [isOpen, resume]);

  useEffect(() => {
    if (resume) setDisplayResume(resume);
  }, [resume]);

  const formatDate = (dateStr: string | Date) => {
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
      return String(dateStr);
    }
  };

  const handleCopyLink = (versionNumber: number) => {
    if (!displayResume) return;
    // Unique version shareable link format: /[username]/[resume-slug]/v[versionNumber]
    const relativeUrl = `/${username}/${displayResume.slug}/v${versionNumber}`;
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
    <>
      <Modal
        isOpen={isOpen && !!displayResume}
        onClose={onClose}
        overlayClassName={styles.modalOverlay}
        contentClassName={styles.modalContent}
        labelledBy="versions-modal-title"
      >
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>

          <div className={styles.header}>
            <h1 id="versions-modal-title" className={styles.title}>{displayResume?.title}</h1>
            <p className={styles.subtitle}>
              Track, preview, and share every historical version of this resume.
            </p>
          </div>

          <div className={styles.glassCard}>
            {loading ? (
              <div className={styles.emptyState}>
                <Loader2 size={48} className={`${styles.emptyIcon} spin`} />
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
      </Modal>

      <AnimatePresence>
        {showToast && (
          <motion.div
            className={styles.toast}
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <CheckCircle size={16} className={styles.toastIcon} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
