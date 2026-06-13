'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { CloudArrowUp, Lock } from '@phosphor-icons/react/dist/ssr';
import { uploadResumeAction } from '@/app/actions/upload';
import Button from '@/components/Button/Button';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

export default function UploadStep({ patch, next }: StepProps) {
  const [formState, formAction, isPending] = useActionState(uploadResumeAction, null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = formState as { success?: boolean; resumeId?: string; slug?: string } | null;
    if (s?.success && s.resumeId) {
      patch({ resumeId: s.resumeId, slug: s.slug ?? null });
      next();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);

  const error = (formState as { error?: string } | null)?.error;

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Welcome — upload your CV</h2>
      <p className={styles.subtitle}>
        In about a minute you&apos;ll get an instant ATS score and a shareable link you can
        track. Start with your most recent CV &mdash; PDF only, up to 2MB.
      </p>

      <form action={formAction}>
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
          <div className={styles.dropzoneIcon}><CloudArrowUp size={22} /></div>
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

        <div className={styles.btnRow} style={{ justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            loading={isPending}
            disabled={!selectedFileName}
          >
            {isPending ? 'Uploading…' : 'Continue'}
          </Button>
        </div>
      </form>

      <div className={styles.lockRow}>
        <Lock size={14} />
        <span>Secure. We never share your data.</span>
      </div>
    </div>
  );
}
