'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ShareNetwork,
  DownloadSimple,
  DotsThreeVertical,
  UploadSimple,
  Trash,
  CheckCircle,
} from '@phosphor-icons/react/dist/ssr';
import { Resume, User } from '@/types';
import { deleteResumeAction } from '@/app/actions/resume';
import Button from '@/components/Button/Button';
import Modal from '@/components/motion/Modal';
import Tabs from '@/components/Tabs/Tabs';
import ResumeSwitcher from '@/components/ResumeSwitcher/ResumeSwitcher';
import PageTransition from '@/components/motion/PageTransition';
import UploadModal from '@/components/UploadModal/UploadModal';
import TrackingLinkModal from '@/components/TrackingLinkModal/TrackingLinkModal';
import { slideUp } from '@/lib/motion';
import styles from './ResumeDetailView.module.css';
import OverviewSection from './sections/OverviewSection';
import VariantsSection from './sections/VariantsSection';
import VersionsSection from './sections/VersionsSection';
import AnalyticsSection from './sections/AnalyticsSection';

/** Shape of the per-resume analytics payload (loosely typed at the backend). */
export interface AnalyticsData {
  summary?: {
    totalViews?: number;
    uniqueViews?: number;
    totalDownloads?: number;
    desktop?: number;
    mobile?: number;
    tablet?: number;
  };
  referrers?: { source: string; count: number }[];
  timeline?: { date: string; count: number }[];
  campaigns?: { label: string; count: number }[];
  error?: string;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'variants', label: 'Variants' },
  { id: 'versions', label: 'Versions' },
  { id: 'analytics', label: 'Analytics' },
];

interface ResumeDetailViewProps {
  user: User;
  resume: Resume;
  resumes: Resume[];
  analytics: AnalyticsData | null;
  initialTab?: string;
}

export default function ResumeDetailView({ user, resume, resumes, analytics, initialTab }: ResumeDetailViewProps) {
  const router = useRouter();
  const validInitialTab = TABS.some((t) => t.id === initialTab) ? (initialTab as string) : 'overview';

  const [activeTab, setActiveTab] = useState(validInitialTab);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewResumeOpen, setIsNewResumeOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const defaultVariant = resume.variants?.find((v) => v.slug === 'default') ?? resume.variants?.[0];
  const latestVersion =
    defaultVariant?.versions && defaultVariant.versions.length > 0 ? defaultVariant.versions[0] : null;
  const pdfUrl = latestVersion?.fileUrl;
  const hasPdf = Boolean(pdfUrl && pdfUrl !== '#');
  const publicUrl = `/${user.username}/${resume.slug}`;
  const tailoredVariants = (resume.variants ?? []).filter((v) => v.slug !== 'default');

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    if (!showMenu) return;
    const handleDocumentClick = () => setShowMenu(false);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [showMenu]);

  const notify = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // Update the URL's ?tab shallowly so sections are deep-linkable / reload-safe,
  // without re-running the server component (no analytics refetch on tab change).
  const handleTabChange = (id: string) => {
    setActiveTab(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', id);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const handleShare = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}${publicUrl}`)
      .then(() => notify('Shareable link copied to clipboard!'))
      .catch((err) => console.error('Failed to copy:', err));
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      setIsDeleting(true);
      notify('Deleting resume...');
      const result = await deleteResumeAction(resume.id);
      if (result?.error) {
        notify(result.error);
        setIsDeleting(false);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Failed to delete resume:', err);
      notify('Failed to delete resume.');
      setIsDeleting(false);
    }
  };

  return (
    <PageTransition className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{resume.title}</h1>
          <p className={styles.headerMeta}>
            {latestVersion ? `Version ${latestVersion.versionNumber}` : 'No PDF uploaded yet'}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={handleShare} disabled={isDeleting}>
            <ShareNetwork size={16} />
            Share
          </Button>
          {hasPdf && (
            <Button href={pdfUrl as string} target="_blank" rel="noopener noreferrer">
              <DownloadSimple size={16} />
              Open PDF
            </Button>
          )}
          <div className={styles.menu}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              disabled={isDeleting}
              aria-haspopup="menu"
              aria-expanded={showMenu}
              aria-label="More options"
            >
              <DotsThreeVertical size={18} weight="bold" />
            </button>
            <AnimatePresence>
              {showMenu && (
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
                    onClick={() => {
                      setShowMenu(false);
                      setIsUploadOpen(true);
                    }}
                  >
                    <UploadSimple size={15} />
                    Replace file
                  </button>
                  <button
                    className={`${styles.dropdownItem} ${styles.deleteItem}`}
                    role="menuitem"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash size={15} />
                    Delete resume
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className={styles.tabsRow}>
        <ResumeSwitcher
          resumes={resumes.map((r) => ({ id: r.id, title: r.title }))}
          currentResumeId={resume.id}
          onNewResume={() => setIsNewResumeOpen(true)}
        />
        <div className={styles.tabsScroll}>
          <Tabs
            items={TABS}
            activeId={activeTab}
            onTabClick={handleTabChange}
            variant="inset"
            fill="never"
            className={styles.tabs}
            ariaLabel="Resume sections"
          />
        </div>
      </div>

      <div className={styles.section}>
        {activeTab === 'overview' && (
          <OverviewSection
            resume={resume}
            pdfUrl={pdfUrl}
            hasPdf={hasPdf}
            analytics={analytics}
            onReplace={() => setIsUploadOpen(true)}
            onOpenTracking={() => setIsTrackingOpen(true)}
          />
        )}
        {activeTab === 'variants' && (
          <VariantsSection resume={resume} username={user.username} variants={tailoredVariants} onCopied={notify} />
        )}
        {activeTab === 'versions' && (
          <VersionsSection
            versions={defaultVariant?.versions ?? []}
            username={user.username}
            resumeSlug={resume.slug}
            onUploadClick={() => setIsUploadOpen(true)}
            onCopied={notify}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsSection analytics={analytics} resumeId={resume.id} />}
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        resumeId={resume.id}
        variantId={defaultVariant?.id}
      />
      <UploadModal
        isOpen={isNewResumeOpen}
        onClose={() => setIsNewResumeOpen(false)}
        onSuccess={(result) => {
          setIsNewResumeOpen(false);
          if (result?.resumeId) {
            router.push(`/dashboard/resume/${result.resumeId}`);
          }
        }}
      />
      <TrackingLinkModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        publicUrl={publicUrl}
        onCopied={notify}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        overlayClassName={styles.modalOverlay}
        contentClassName={styles.modalContent}
        labelledBy="delete-resume-title"
      >
        <h3 id="delete-resume-title" className={styles.modalTitle} style={{ color: '#ef4444' }}>Delete resume</h3>
        <p className={styles.modalDesc}>
          Are you sure you want to delete <strong>&ldquo;{resume.title}&rdquo;</strong>? This will permanently delete all versions and variants. This action cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button tone="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>

      <AnimatePresence>
        {showToast && (
          <motion.div className={styles.toast} variants={slideUp} initial="hidden" animate="visible" exit="exit">
            <CheckCircle size={16} className={styles.toastIcon} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
