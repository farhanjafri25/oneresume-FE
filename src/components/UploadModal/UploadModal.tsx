'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import styles from './UploadModal.module.css';
import { X, UploadCloud, Lock } from 'lucide-react';
import { uploadResumeAction } from '@/app/actions/upload';
import Modal from '@/components/motion/Modal';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId?: string;
  variantId?: string;
}

export default function UploadModal({ isOpen, onClose, resumeId, variantId }: UploadModalProps) {
  const [state, formAction, isPending] = useActionState(uploadResumeAction, null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.success) {
      setSelectedFileName(null);
      onClose();
    }
  }, [state, onClose]);

  const handleClose = () => {
    setSelectedFileName(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName={styles.overlay}
      contentClassName={styles.modal}
      labelledBy="upload-modal-title"
    >
        <div className={styles.header}>
          <div>
            <h2 id="upload-modal-title" className={styles.title}>
              {resumeId && variantId ? 'Replace Version' : 'Import Masterpiece'}
            </h2>
            <p className={styles.subtitle}>
              Upload your existing resume to let our AI begin the optimization process.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {state?.error && (
          <div style={{ color: '#991b1b', marginBottom: '16px', fontSize: '14px' }}>
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <input type="hidden" name="resumeId" value={resumeId || ''} />
          <input type="hidden" name="variantId" value={variantId || ''} />

          {!resumeId && (
            <div className={styles.inputGroup}>
              <label htmlFor="resumeName" className={styles.label}>
                Resume Title (Optional)
              </label>
              <input
                id="resumeName"
                type="text"
                name="resumeName"
                placeholder="e.g. Software Engineer Resume"
                className={styles.textInput}
                disabled={isPending}
              />
            </div>
          )}



          <div
            className={styles.dropzone}
            onClick={() => !isPending && fileInputRef.current?.click()}
            style={{ cursor: isPending ? 'not-allowed' : 'pointer' }}
          >
            <input
              type="file"
              name="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files?.length) {
                  setSelectedFileName(e.target.files[0].name);
                }
              }}
            />
            <div className={styles.iconContainer}>
              <UploadCloud size={24} />
            </div>
            <h3 className={styles.dropzoneTitle}>
              {isPending
                ? 'Uploading...'
                : selectedFileName
                ? `Selected: ${selectedFileName}`
                : 'Click to browse or drag and drop your resume'}
            </h3>
            <p className={styles.dropzoneDesc}>PDF only up to 2MB</p>

            <button
              type="button"
              className={styles.browseBtn}
              disabled={isPending}
              onClick={(e) => {
                if (selectedFileName) {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }
              }}
            >
              {selectedFileName ? 'CHANGE FILE' : 'BROWSE FILES'}
            </button>
          </div>

          {selectedFileName && (
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? 'UPLOADING...' : 'UPLOAD RESUME'}
            </button>
          )}
        </form>

        <div className={styles.footer}>
          <Lock size={14} className={styles.lockIcon} />
          <span>End-to-end encrypted. We never share your data.</span>
        </div>
    </Modal>
  );
}
