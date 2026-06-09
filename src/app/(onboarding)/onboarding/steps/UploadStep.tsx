'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { ArrowLeft, UploadCloud, Lock } from 'lucide-react';
import { uploadResumeAction } from '@/app/actions/upload';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

export default function UploadStep({ state, patch, next, back }: StepProps) {
  const [formState, formAction, isPending] = useActionState(uploadResumeAction, null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = formState as { success?: boolean; resumeId?: string } | null;
    if (s?.success && s.resumeId) {
      patch({ resumeId: s.resumeId });
      next();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);

  const error = (formState as { error?: string } | null)?.error;

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Upload your current CV</h2>
      <p className={styles.subtitle}>
        Use your most recent CV &mdash; a complete history gives the most accurate match score.
        PDF only, up to 2MB.
      </p>

      <form action={formAction}>
        {/* New top-level resume — seed an optional title from the target role. */}
        <input
          type="hidden"
          name="resumeName"
          value={state.targetRole ? `${state.targetRole} Resume` : ''}
        />

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
              if (e.target.files?.length) setSelectedFileName(e.target.files[0].name);
            }}
          />
          <div className={styles.dropzoneIcon}><UploadCloud size={22} /></div>
          <h3 className={styles.dropzoneTitle}>
            {isPending
              ? 'Uploading…'
              : selectedFileName
              ? `Selected: ${selectedFileName}`
              : 'Click to browse or drag and drop your resume'}
          </h3>
          <p className={styles.dropzoneDesc}>PDF only up to 2MB</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
          </div>
        )}

        <div className={styles.btnRow}>
          <button type="button" className={styles.secondaryBtn} onClick={back} disabled={isPending}>
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isPending || !selectedFileName}
          >
            {isPending ? 'Uploading…' : 'Continue'}
          </button>
        </div>
      </form>

      <div className={styles.lockRow}>
        <Lock size={14} />
        <span>Secure. We never share your data.</span>
      </div>
    </div>
  );
}
