'use client';

import React, { useActionState, useEffect, useRef } from 'react';
import styles from './UploadModal.module.css';
import { X, UploadCloud, Lock } from 'lucide-react';
import { uploadResumeAction } from '@/app/actions/upload';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId?: string;
  variantId?: string;
}

export default function UploadModal({ isOpen, onClose, resumeId, variantId }: UploadModalProps) {
  const [state, formAction, isPending] = useActionState(uploadResumeAction, null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

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

        {state?.error && (
          <div style={{ color: '#fca5a5', marginBottom: '16px', fontSize: '14px' }}>
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <input type="hidden" name="resumeId" value={resumeId || ''} />
          <input type="hidden" name="variantId" value={variantId || ''} />
          
          <div className={styles.dropzone} onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              name="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="application/pdf"
              onChange={(e) => {
                if(e.target.files?.length) {
                  // auto-submit if a file is selected
                  e.target.form?.requestSubmit();
                }
              }}
            />
            <div className={styles.iconContainer}>
              <UploadCloud size={24} />
            </div>
            <h3 className={styles.dropzoneTitle}>
              {isPending ? 'Uploading...' : 'Click to browse or drag and drop your resume'}
            </h3>
            <p className={styles.dropzoneDesc}>PDF only up to 10MB</p>
            
            <button type="button" className={styles.browseBtn} disabled={isPending}>
              {isPending ? 'PROCESSING...' : 'BROWSE FILES'}
            </button>
          </div>
        </form>

        <div className={styles.footer}>
          <Lock size={14} className={styles.lockIcon} />
          <span>End-to-end encrypted. We never share your data.</span>
        </div>
      </div>
    </div>
  );
}
