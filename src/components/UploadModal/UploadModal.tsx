'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './UploadModal.module.css';
import { X, CloudArrowUp, Lock } from '@phosphor-icons/react/dist/ssr';
import { uploadResumeAction } from '@/app/actions/upload';
import Button from '@/components/Button/Button';
import Modal from '@/components/motion/Modal';
import { shouldProcessUploadSuccess, type UploadActionState } from './uploadModalState';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId?: string;
  variantId?: string;
  /** Called on a successful upload with the action result. When provided, the
   *  parent owns what happens next (e.g. navigate to a newly created resume);
   *  otherwise the modal just closes. */
  onSuccess?: (result: { resumeId?: string; slug?: string }) => void;
}

export default function UploadModal({ isOpen, onClose, resumeId, variantId, onSuccess }: UploadModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setSelectedFileName(null);
    setClientError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (clientError || isPending || !selectedFileName) return;

    setIsPending(true);
    setClientError(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await uploadResumeAction(null, formData);

      if (res?.error) {
        setClientError(res.error);
      } else if (res?.success && res?.resumeId) {
        setSelectedFileName(null);
        if (onSuccess) {
          onSuccess({ resumeId: res.resumeId, slug: res.slug });
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Action failed:', err);
      setClientError('File upload failed. The file might be too large max file size is 4mb.');
    } finally {
      setIsPending(false);
    }
  };

  const error = clientError;

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

        {error && (
          <div style={{ color: '#991b1b', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 4 * 1024 * 1024) {
                    setClientError('File size must be less than 4MB');
                    setSelectedFileName(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  } else {
                    setClientError(null);
                    setSelectedFileName(file.name);
                  }
                }
              }}
            />
            <div className={styles.iconContainer}>
              <CloudArrowUp size={24} />
            </div>
            <h3 className={styles.dropzoneTitle}>
              {isPending
                ? 'Uploading...'
                : selectedFileName
                ? `Selected: ${selectedFileName}`
                : 'Click to browse or drag and drop your resume'}
            </h3>
            <p className={styles.dropzoneDesc}>PDF only, max file size 4MB</p>

            <Button
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={(e) => {
                if (selectedFileName) {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }
              }}
            >
              {selectedFileName ? 'Change file' : 'Browse files'}
            </Button>
          </div>

          {selectedFileName && (
            <Button type="submit" fullWidth className={styles.submitBtn} loading={isPending}>
              {isPending ? 'Uploading…' : 'Upload resume'}
            </Button>
          )}
        </form>

        <div className={styles.footer}>
          <Lock size={14} className={styles.lockIcon} />
          <span>End-to-end encrypted. We never share your data.</span>
        </div>
    </Modal>
  );
}
