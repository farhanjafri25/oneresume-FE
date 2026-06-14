'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Link as LinkIcon,
  ArrowSquareOut,
  Clock,
  UploadSimple,
  DotsThreeVertical,
  ArrowCounterClockwise,
} from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import Button from '@/components/Button/Button';
import Modal from '@/components/motion/Modal';
import Tooltip from '@/components/Tooltip/Tooltip';
import { Version } from '@/types';
import { sortVersionsDesc } from '@/lib/versions';
import { revertToVersionAction } from '@/app/actions/resume';
import { canRevertToVersion, buildRevertConfirmText } from './versionMenu';
import styles from '../ResumeDetailView.module.css';

interface VersionsSectionProps {
  versions: Version[];
  username: string;
  resumeSlug: string;
  resumeId: string;
  variantId?: string;
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
  resumeId,
  variantId,
  onUploadClick,
}: VersionsSectionProps) {
  const router = useRouter();

  // Sort defensively so the timeline + "Active" badge are correct regardless of
  // the order the caller/API supplies. Latest = highest versionNumber.
  const sortedVersions = sortVersionsDesc(versions);
  const latestVersionNumber = sortedVersions[0]?.versionNumber;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmVersion, setConfirmVersion] = useState<Version | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  // Close the open menu on any outside click (the menu itself stops propagation).
  useEffect(() => {
    if (!openMenuId) return;
    const handleDocumentClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [openMenuId]);

  const copyLink = (versionNumber: number) => {
    const url = `${window.location.origin}/${username}/${resumeSlug}/v${versionNumber}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(`Copied link for Version ${versionNumber}!`))
      .catch(() => toast.error("Couldn't copy link. Please try again."));
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const openRevertConfirm = (e: React.MouseEvent, version: Version) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setConfirmVersion(version);
  };

  const confirmRevert = async () => {
    if (!confirmVersion || !variantId) return;
    const target = confirmVersion;
    setIsReverting(true);
    try {
      const result = await revertToVersionAction(resumeId, variantId, target.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Reverted to Version ${target.versionNumber}.`);
        setConfirmVersion(null);
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to revert version:', err);
      toast.error('Failed to revert version. Please try again.');
    } finally {
      setIsReverting(false);
    }
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
            const showMenu = Boolean(variantId) && canRevertToVersion(version.versionNumber, latestVersionNumber);
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
                  {version.fileUrl && (
                    <Button variant="secondary" size="sm" href={version.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ArrowSquareOut size={14} />
                      View PDF
                    </Button>
                  )}
                  <Button size="sm" onClick={() => copyLink(version.versionNumber)}>
                    <LinkIcon size={14} />
                    Copy share link
                  </Button>
                  {showMenu && (
                    <div className={styles.menu}>
                      <Tooltip label="More options" disabled={openMenuId === version.id}>
                        <button
                          type="button"
                          className={styles.menuButton}
                          onClick={(e) => toggleMenu(e, version.id)}
                          aria-label="More options"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === version.id}
                        >
                          <DotsThreeVertical size={18} weight="bold" />
                        </button>
                      </Tooltip>
                      <AnimatePresence>
                        {openMenuId === version.id && (
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
                            <button
                              className={styles.dropdownItem}
                              role="menuitem"
                              onClick={(e) => openRevertConfirm(e, version)}
                            >
                              <ArrowCounterClockwise size={15} />
                              Revert to this version
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={confirmVersion !== null}
        onClose={() => {
          if (!isReverting) setConfirmVersion(null);
        }}
        overlayClassName={styles.modalOverlay}
        contentClassName={styles.modalContent}
        labelledBy="revert-version-title"
      >
        <h3 id="revert-version-title" className={styles.modalTitle}>Revert to this version</h3>
        <p className={styles.modalDesc}>
          {confirmVersion ? buildRevertConfirmText(confirmVersion.versionNumber) : ''}
        </p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setConfirmVersion(null)} disabled={isReverting}>
            Cancel
          </Button>
          <Button onClick={confirmRevert} loading={isReverting}>
            Revert
          </Button>
        </div>
      </Modal>
    </div>
  );
}
