import React, { useState, useEffect } from 'react';
import styles from './ResumeCard.module.css';
import { Link2, Upload, MoreVertical, CheckCircle, Trash2, History, BarChart2, Brain, Sparkles } from 'lucide-react';
import { deleteResumeAction } from '@/app/actions/resume';

interface ResumeCardProps {
  id: string;
  title: string;
  timeAgo: string;
  tags: string[];
  imageUrl?: string;
  pdfUrl?: string;
  publicUrl?: string;
  onUploadClick?: () => void;
  onVersionsClick?: () => void;
}

export default function ResumeCard({
  id,
  title,
  timeAgo,
  tags,
  imageUrl,
  pdfUrl,
  publicUrl,
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

  return (
    <>
      <div
        className={`${styles.card} ${isDeleting ? styles.deleting : ''}`}
        onClick={handleCardClick}
        style={{ cursor: pdfUrl && pdfUrl !== '#' && !isDeleting ? 'pointer' : 'default' }}
      >
        <div className={styles.imageContainer}>
          {pdfUrl && pdfUrl !== '#' ? (
            <>
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className={styles.pdfPreview}
                title={title}
                frameBorder="0"
                onLoad={() => setLoadedPdfUrl(pdfUrl)}
              />
              <div
                className={`${styles.pdfSkeleton} ${isPdfLoaded ? styles.pdfSkeletonHidden : ''}`}
                aria-hidden="true"
              />
            </>
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
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <span className={styles.time}>{timeAgo}</span>
          </div>

          <div className={styles.tags}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className={styles.actionsBar}>
            <button 
              className={styles.actionIconBtn} 
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/dashboard/ai-review/${id}`;
              }}
              disabled={!pdfUrl || pdfUrl === '#'}
              title={!pdfUrl || pdfUrl === '#' ? 'Please upload a PDF first to use the AI Reviewer' : 'AI Match Reviewer'}
            >
              <Brain size={16} />
            </button>
            <button 
              className={styles.actionIconBtn} 
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/dashboard/ai-builder/${id}`;
              }}
              disabled={!pdfUrl || pdfUrl === '#'}
              title={!pdfUrl || pdfUrl === '#' ? 'Please upload a PDF first to use the AI Builder' : 'AI Tailor & Build'}
            >
              <Sparkles size={16} />
            </button>
            <button 
              className={styles.actionIconBtn} 
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/dashboard/analytics/${id}`;
              }}
              title="View Page Views & Analytics"
            >
              <BarChart2 size={16} />
            </button>
            <button 
              className={styles.actionIconBtn} 
              onClick={handleCreateTrackingLink}
              title="Create Personalized Tracking Link"
            >
              <Link2 size={16} />
            </button>
            <button 
              className={styles.actionIconBtn} 
              onClick={(e) => {
                e.stopPropagation();
                onVersionsClick?.();
              }}
              title="Version History"
            >
              <History size={16} />
            </button>
          </div>

          <div className={styles.footer}>
            <button className={styles.actionBtn} onClick={handleCopyLink} disabled={isDeleting}>
              <Link2 size={16} />
              Copy Link
            </button>

            <div className={styles.rightActions}>
              <button
                className={styles.iconBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onUploadClick?.();
                }}
                disabled={isDeleting}
                title="Upload new version"
              >
                <Upload size={16} />
              </button>
              
              <div className={styles.dropdownContainer}>
                <button 
                  className={styles.iconBtn} 
                  onClick={handleToggleDropdown}
                  disabled={isDeleting}
                >
                  <MoreVertical size={16} />
                </button>

                {showDropdown && (
                  <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <div className={styles.toast}>
          <CheckCircle size={16} />
          {toastMessage}
        </div>
      )}

      {showLinkModal && (
        <div className={styles.modalOverlay} onClick={(e) => { e.stopPropagation(); setShowLinkModal(false); }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Create Custom Tracking Link</h3>
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
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={(e) => { e.stopPropagation(); setShowDeleteModal(false); }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>Delete Resume</h3>
            <p className={styles.modalDesc}>
              Are you sure you want to delete <strong>"{title}"</strong>? This will permanently delete all versions and variants. This action cannot be undone.
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
          </div>
        </div>
      )}
    </>
  );
}
