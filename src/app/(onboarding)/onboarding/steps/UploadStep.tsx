'use client';

import React, { useRef, useState } from 'react';
import { CloudArrowUp, Lock } from '@phosphor-icons/react/dist/ssr';
import { uploadResumeAction } from '@/app/actions/upload';
import { completeOnboardingAction } from '@/app/actions/onboarding';
import { clearOnboarding } from '@/lib/onboarding';
import Button from '@/components/Button/Button';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

export default function UploadStep({ patch, next }: StepProps) {
  const [isPending, setIsPending] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSkip = async () => {
    setIsSkipping(true);
    setClientError(null);
    clearOnboarding();
    try {
      const res = await completeOnboardingAction();
      if (res?.error) {
        setClientError(res.error);
      } else {
        window.location.assign('/dashboard');
      }
    } catch (err: any) {
      console.error('Failed to skip onboarding:', err);
      setClientError('Failed to skip onboarding. Please try again.');
    } finally {
      setIsSkipping(false);
    }
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
        patch({ resumeId: res.resumeId });
        next();
      }
    } catch (err: any) {
      console.error('Action failed:', err);
      setClientError('File upload failed. The file might be too large, Max file size is 4mb.');
    } finally {
      setIsPending(false);
    }
  };

  const error = clientError;

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Welcome — upload your CV</h2>
      <p className={styles.subtitle}>
        In about a minute you&apos;ll get an instant ATS score and a shareable link you can
        track. Start with your most recent CV &mdash; PDF only, max file size 4MB.
      </p>

      <form onSubmit={handleSubmit}>
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
          <div className={styles.dropzoneIcon}><CloudArrowUp size={22} /></div>
          <h3 className={styles.dropzoneTitle}>
            {isPending
              ? 'Uploading…'
              : selectedFileName
              ? `Selected: ${selectedFileName}`
              : 'Click to browse or drag and drop your resume'}
          </h3>
          <p className={styles.dropzoneDesc}>PDF only, max file size 4MB</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
          </div>
        )}

        <div className={styles.btnRow}>
          <Button
            variant="secondary"
            onClick={handleSkip}
            loading={isSkipping}
            disabled={isPending}
          >
            Skip for now
          </Button>
          <Button
            type="submit"
            loading={isPending}
            disabled={!selectedFileName || isSkipping}
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
