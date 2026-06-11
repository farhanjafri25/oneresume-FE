'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import styles from './ResumeCard.module.css';
import { Link2, Upload, MoreVertical, CheckCircle, Trash2, History, BarChart2, Brain, Sparkles, FileText, ExternalLink, Target } from 'lucide-react';
import { deleteResumeAction } from '@/app/actions/resume';
import Modal from '@/components/motion/Modal';
import Tooltip from '@/components/Tooltip/Tooltip';
import { slideUp, springs, transitions } from '@/lib/motion';
import { useHoverable } from '@/lib/useHoverable';

interface ResumeCardProps {
  id: string;
  title: string;
  timeAgo: string;
  tags: string[];
  /** Version label (e.g. "v1") shown as a badge over the preview's bottom-left. */
  versionLabel?: string;
  pdfUrl?: string;
  publicUrl?: string;
  /** Position in the grid — drives the staggered entrance delay. */
  index?: number;
  onUploadClick?: () => void;
  onVersionsClick?: () => void;
}

export default function ResumeCard({
  id,
  title,
  timeAgo,
  tags,
  versionLabel,
  pdfUrl,
  publicUrl,
  index = 0,
  onUploadClick,
  onVersionsClick,
}: ResumeCardProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Shareable link copied to clipboard!');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadedPdfUrl, setLoadedPdfUrl] = useState<string | null>(null);
  const isPdfLoaded = loadedPdfUrl === pdfUrl;
  const hoverable = useHoverable();
  // Some browsers (notably Android Chrome) can't render a PDF inline in an
  // iframe — they fall back to a raw-URL/"Open" stub. Detect inline support and
  // show a branded thumbnail instead. Server snapshot is false so SSR and the
  // first client render agree, then it upgrades to the live preview where the
  // browser supports it.
  const canInlinePdf = useSyncExternalStore(
    () => () => {},
    () => navigator.pdfViewerEnabled === true,
    () => false,
  );

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (!showDropdown) return;
    const handleDocumentClick = () => setShowDropdown(false);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [showDropdown]);

  const handleCardClick = () => {
    if (isDeleting) return;
    if (pdfUrl && pdfUrl !== '#') {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (publicUrl) {
      const fullUrl = `${window.location.origin}${publicUrl}`;
      navigator.clipboard.writeText(fullUrl).then(() => {
        setToastMessage('Shareable link copied to clipboard!');
        setShowToast(true);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  };

  const handleCreateTrackingLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(false);
    setShowLinkModal(true);
  };

  const submitTrackingLink = () => {
    if (linkLabel && linkLabel.trim()) {
      const cleanTag = linkLabel.trim().replace(/\s+/g, '-');
      if (publicUrl) {
        const fullUrl = `${window.location.origin}${publicUrl}?for=${encodeURIComponent(cleanTag)}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
          setToastMessage(`Tracking link for "${cleanTag}" copied to clipboard!`);
          setShowToast(true);
        }).catch(err => {
          console.error('Failed to copy tracking link:', err);
        });
      }
    }
    setShowLinkModal(false);
    setLinkLabel('');
  };

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    setShowDropdown(!showDropdown);
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(false);
    onUploadClick?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);

    try {
      setIsDeleting(true);
      setToastMessage('Deleting resume...');
      setShowToast(true);

      const result = await deleteResumeAction(id);
      if (result.error) {
        setToastMessage(result.error);
        setShowToast(true);
      } else {
        setToastMessage('Resume deleted successfully.');
        setShowToast(true);
      }
    } catch (err) {
      console.error('Failed to delete resume:', err);
      setToastMessage('Failed to delete resume.');
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const pdfMissing = !pdfUrl || pdfUrl === '#';

  const actionButtons = [
    {
      icon: Brain,
      ariaLabel: 'AI Match Reviewer',
      label: pdfMissing ? 'Please upload a PDF first to use the AI Reviewer' : 'AI Match Reviewer',
      disabled: pdfMissing,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        window.location.href = `/dashboard/ai-review/${id}`;
      },
    },
    {
      icon: Sparkles,
      ariaLabel: 'AI Tailor & Build',
      label: pdfMissing ? 'Please upload a PDF first to use the AI Builder' : 'AI Tailor & Build',
      disabled: pdfMissing,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        window.location.href = `/dashboard/ai-builder/${id}`;
      },
    },
    {
      icon: BarChart2,
      ariaLabel: 'View Page Views & Analytics',
      label: 'View Page Views & Analytics',
      disabled: false,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        window.location.href = `/dashboard/analytics/${id}`;
      },
    },
    {
      icon: Target,
      ariaLabel: 'Create Personalized Tracking Link',
      label: 'Create Personalized Tracking Link',
      disabled: false,
      onClick: handleCreateTrackingLink,
    },
    {
      icon: History,
      ariaLabel: 'Version History',
      label: 'Version History',
      disabled: false,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onVersionsClick?.();
      },
    },
  ];

  return (
    <>
      <motion.div
        className={`${styles.card} ${isDeleting ? styles.deleting : ''}`}
        onClick={handleCardClick}
        style={{ cursor: pdfUrl && pdfUrl !== '#' && !isDeleting ? 'pointer' : 'default' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitions.base, delay: index * 0.06 }}
        whileHover={hoverable ? { y: -2, transition: springs.micro } : undefined}
      >
        <div className={styles.imageContainer}>
          {pdfUrl && pdfUrl !== '#' ? (
            canInlinePdf ? (
              <>
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className={styles.pdfPreview}
                  title={title}
                  onLoad={() => setLoadedPdfUrl(pdfUrl)}
                />
                <div
                  className={`${styles.pdfSkeleton} ${isPdfLoaded ? styles.pdfSkeletonHidden : ''}`}
                  aria-hidden="true"
                />
                <div className={styles.previewHint} aria-hidden="true">
                  <span className={styles.previewHintPill}>
                    <ExternalLink size={12} />
                    Open
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.pdfFallback}>
                <div className={styles.pdfFallbackTile}>
                  <FileText size={24} className={styles.pdfFallbackIcon} />
                </div>
                <span className={styles.pdfFallbackSubtext}>Tap to open</span>
              </div>
            )
          ) : (
            <div 
              className={styles.placeholder} 
              onClick={(e) => { 
                e.stopPropagation(); 
                onUploadClick?.(); 
              }}
            >
              <Upload size={32} className={styles.placeholderIcon} />
              <span className={styles.placeholderText}>No PDF Uploaded</span>
              <span className={styles.placeholderSubtext}>Click to upload your masterpiece</span>
            </div>
          )}

          {versionLabel && <span className={styles.versionBadge}>{versionLabel}</span>}
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <span className={styles.time}>{timeAgo}</span>
          </div>

          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className={styles.actionsBar}>
            {actionButtons.map(({ icon: Icon, ariaLabel, label, disabled, onClick }) => (
              <Tooltip key={ariaLabel} label={label}>
                <button
                  className={styles.actionIconBtn}
                  onClick={onClick}
                  disabled={disabled}
                  aria-label={ariaLabel}
                >
                  <Icon size={16} />
                </button>
              </Tooltip>
            ))}
          </div>

          <div className={styles.footer}>
            <button className={styles.actionBtn} onClick={handleCopyLink} disabled={isDeleting}>
              <Link2 size={14} />
              Copy Link
            </button>

            <div className={styles.rightActions}>
              <Tooltip label="Upload new version">
                <button
                  className={styles.iconBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUploadClick?.();
                  }}
                  disabled={isDeleting}
                  aria-label="Upload new version"
                >
                  <Upload size={16} />
                </button>
              </Tooltip>

              <div className={styles.dropdownContainer}>
                <Tooltip label="More options" disabled={showDropdown}>
                  <button
                    className={styles.iconBtn}
                    onClick={handleToggleDropdown}
                    disabled={isDeleting}
                    aria-label="More options"
                    aria-haspopup="menu"
                    aria-expanded={showDropdown}
                  >
                    <MoreVertical size={16} />
                  </button>
                </Tooltip>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      className={styles.dropdownMenu}
                      onClick={(e) => e.stopPropagation()}
                      initial={{ opacity: 0, scale: 0.95, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 4 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      style={{ transformOrigin: 'bottom right' }}
                    >
                      <button
                        className={styles.dropdownItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          window.location.href = `/dashboard/variants`;
                        }}
                      >
                        <Sparkles size={14} />
                        View Tailored Variants
                      </button>
                      <button className={styles.dropdownItem} onClick={handleReplace}>
                        <Upload size={14} />
                        Replace File
                      </button>
                      <button className={`${styles.dropdownItem} ${styles.deleteItem}`} onClick={handleDelete}>
                        <Trash2 size={14} />
                        Delete Resume
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            className={styles.toast}
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <CheckCircle size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showLinkModal}
        onClose={() => { setShowLinkModal(false); setLinkLabel(''); }}
        overlayClassName={styles.modalOverlay}
        contentClassName={styles.modalContent}
        labelledBy="tracking-link-title"
      >
        <h3 id="tracking-link-title" className={styles.modalTitle}>Create Custom Tracking Link</h3>
        <p className={styles.modalDesc}>
          Enter an application label to create a personalized tracking link:
          <br/><span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>(e.g., Google-Frontend, Netflix-Recruiter)</span>
        </p>
        <input
          type="text"
          className={styles.modalInput}
          value={linkLabel}
          onChange={(e) => setLinkLabel(e.target.value)}
          placeholder="Application Label"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitTrackingLink();
          }}
        />
        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={() => { setShowLinkModal(false); setLinkLabel(''); }}>Cancel</button>
          <button className={styles.modalSubmit} onClick={submitTrackingLink}>Copy Link</button>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        overlayClassName={styles.modalOverlay}
        contentClassName={styles.modalContent}
        labelledBy="delete-resume-title"
      >
        <h3 id="delete-resume-title" className={styles.modalTitle} style={{ color: '#ef4444' }}>Delete Resume</h3>
        <p className={styles.modalDesc}>
          Are you sure you want to delete <strong>&ldquo;{title}&rdquo;</strong>? This will permanently delete all versions and variants. This action cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={() => setShowDeleteModal(false)}>Cancel</button>
          <button
            className={styles.modalSubmit}
            style={{ background: '#ef4444', borderColor: '#ef4444' }}
            onClick={confirmDelete}
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}
