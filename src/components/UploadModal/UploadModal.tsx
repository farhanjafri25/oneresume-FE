import React from 'react';
import styles from './UploadModal.module.css';
import { X, UploadCloud, Lock } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Import Document</h2>
            <p className={styles.subtitle}>
              Upload your existing resume to let our AI begin the optimization process.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.dropzone}>
          <div className={styles.iconContainer}>
            <UploadCloud size={24} />
          </div>
          <h3 className={styles.dropzoneTitle}>Drag and drop your resume</h3>
          <p className={styles.dropzoneDesc}>PDF, DOCX, or TXT up to 10MB</p>
          
          <button className={styles.browseBtn}>BROWSE FILES</button>
        </div>

        <div className={styles.footer}>
          <Lock size={14} className={styles.lockIcon} />
          <span>End-to-end encrypted. We never share your data.</span>
        </div>
      </div>
    </div>
  );
}
