'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import styles from './ResumeCard.module.css';
import {
  Link as LinkIcon,
  ArrowSquareOut,
  UploadSimple,
  DotsThreeVertical,
  CheckCircle,
  Trash,
} from '@phosphor-icons/react/dist/ssr';
import { deleteResumeAction } from '@/app/actions/resume';
import Button from '@/components/Button/Button';
import Modal from '@/components/motion/Modal';
import Tooltip from '@/components/Tooltip/Tooltip';
import ResumePreview from '@/components/ResumePreview/ResumePreview';
import { slideUp, springs, transitions } from '@/lib/motion';
import { useHoverable } from '@/lib/useHoverable';

interface ResumeCardProps {
  id: string;
  title: string;
  /** Compact descriptor line, e.g. "v3 · 12/06/2026". */
  meta: string;
  /** Optional status pill, e.g. "No PDF". */
  status?: { label: string; tone?: 'default' | 'muted' | 'warn' };
  pdfUrl?: string;
  /** Relative public URL, e.g. `/username/slug`. */
  publicUrl?: string;
  /** Where the card navigates on click — the resume detail page. */
  detailHref: string;
  /** Position in the grid — drives the staggered entrance delay. */
  index?: number;
  /** Opens the upload/replace modal. */
  onReplaceClick?: () => void;
}

/**
 * A quiet dashboard card: preview + title + meta + an optional status pill, with
 * every action tucked behind a single overflow menu. The whole card links to the
 * resume detail page (a stretched, absolutely-positioned link), where the AI
 * tools, analytics, variants and versions live.
 */
export default function ResumeCard({
  id,
  title,
  meta,
  status,
  pdfUrl,
  publicUrl,
  detailHref,
  index = 0,
  onReplaceClick,
}: ResumeCardProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const hoverable = useHoverable();

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    if (!showDropdown) return;
    const handleDocumentClick = () => setShowDropdown(false);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [showDropdown]);

  const toast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;
    setShowDropdown((prev) => !prev);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    if (!publicUrl) return;
    navigator.clipboard
      .writeText(`${window.location.origin}${publicUrl}`)
      .then(() => toast('Shareable link copied to clipboard!'))
      .catch((err) => console.error('Failed to copy:', err));
  };

  const handleOpenPublic = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    if (publicUrl) window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    onReplaceClick?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      setIsDeleting(true);
      toast('Deleting resume...');
      const result = await deleteResumeAction(id);
      toast(result?.error ? result.error : 'Resume deleted successfully.');
    } catch (err) {
      console.error('Failed to delete resume:', err);
      toast('Failed to delete resume.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toneClass = status?.tone === 'warn' ? styles.warn : status?.tone === 'muted' ? styles.muted : '';

  return (
    <>
      <motion.div
        className={`${styles.card} ${isDeleting ? styles.deleting : ''}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitions.base, delay: index * 0.06 }}
        whileHover={hoverable ? { y: -2, transition: springs.micro } : undefined}
      >
        <div className={styles.imageContainer}>
          <ResumePreview pdfUrl={pdfUrl} title={title} />
        </div>

        <div className={`${styles.menu} ${showDropdown ? styles.menuActive : ''}`}>
          <Tooltip label="More options" disabled={showDropdown}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={handleToggleDropdown}
              disabled={isDeleting}
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={showDropdown}
            >
              <DotsThreeVertical size={18} weight="bold" />
            </button>
          </Tooltip>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                className={styles.dropdownMenu}
                role="menu"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ transformOrigin: 'top right' }}
              >
                <button className={styles.dropdownItem} role="menuitem" onClick={handleCopyLink}>
                  <LinkIcon size={15} />
                  Copy share link
                </button>
                <button className={styles.dropdownItem} role="menuitem" onClick={handleOpenPublic}>
                  <ArrowSquareOut size={15} />
                  Open public page
                </button>
                <button className={styles.dropdownItem} role="menuitem" onClick={handleReplace}>
                  <UploadSimple size={15} />
                  Replace file
                </button>
                <button className={`${styles.dropdownItem} ${styles.deleteItem}`} role="menuitem" onClick={handleDelete}>
                  <Trash size={15} />
                  Delete resume
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.metaRow}>
            <span className={styles.meta}>{meta}</span>
            {status && <span className={`${styles.statusPill} ${toneClass}`}>{status.label}</span>}
          </div>
        </div>

        {/* Stretched link: the whole card opens the detail page. Sits above the
            preview/text but below the overflow menu (which has a higher z-index). */}
        <NextLink href={detailHref} className={styles.stretchedLink} aria-label={`Open ${title}`} />
      </motion.div>

      <AnimatePresence>
        {showToast && (
          <motion.div className={styles.toast} variants={slideUp} initial="hidden" animate="visible" exit="exit">
            <CheckCircle size={16} className={styles.toastIcon} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        overlayClassName={styles.modalOverlay}
        contentClassName={styles.modalContent}
        labelledBy="delete-resume-title"
      >
        <h3 id="delete-resume-title" className={styles.modalTitle} style={{ color: '#ef4444' }}>Delete resume</h3>
        <p className={styles.modalDesc}>
          Are you sure you want to delete <strong>&ldquo;{title}&rdquo;</strong>? This will permanently delete all versions and variants. This action cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button tone="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
