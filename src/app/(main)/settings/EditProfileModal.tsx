'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/motion/Modal';
import Button from '@/components/Button/Button';
import {
  updateProfileAction,
  requestEmailChangeAction,
  verifyEmailChangeAction,
} from '@/app/actions/account';
import { useFocusOnMount } from './useFocusOnMount';
import { User } from '@/types';
import styles from './accountModals.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  /** Called after a successful change so the page can refresh server data. */
  onSuccess: () => void;
}

type Step = 'edit' | 'verifyEmail';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export default function EditProfileModal({ isOpen, onClose, user, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('edit');
  const [username, setUsername] = useState(user.username);
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const usernameRef = useFocusOnMount<HTMLInputElement>();

  const trimmedUsername = username.trim();
  const trimmedName = name.trim();
  const profileChanged =
    trimmedUsername !== user.username || trimmedName !== (user.name ?? '');
  const emailChanged = normalizeEmail(email) !== normalizeEmail(user.email);
  const dirty = profileChanged || emailChanged;

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || submitting) return;

    if (!trimmedUsername) {
      setError('Username is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Save name/username first so they aren't lost if the email step follows.
    if (profileChanged) {
      const formData = new FormData();
      formData.set('username', trimmedUsername);
      formData.set('name', trimmedName);
      const result = await updateProfileAction(null, formData);
      if (result?.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
    }

    if (emailChanged) {
      const result = await requestEmailChangeAction(email);
      setSubmitting(false);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setStep('verifyEmail');
      return;
    }

    setSubmitting(false);
    toast.success('Profile updated');
    onSuccess();
    onClose();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    const result = await verifyEmailChangeAction(email, code);
    setSubmitting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    toast.success('Email updated');
    onSuccess();
    onClose();
  };

  const handleResend = async () => {
    setResendStatus('Sending...');
    const result = await requestEmailChangeAction(email);
    if (result?.error) {
      setResendStatus(null);
      setError(result.error);
    } else {
      setResendStatus('Code sent!');
      setTimeout(() => setResendStatus(null), 3000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName={styles.overlay}
      contentClassName={styles.modal}
      labelledBy="edit-profile-title"
    >
      {step === 'edit' ? (
        <>
          <div className={styles.header}>
            <h2 id="edit-profile-title" className={styles.title}>Edit profile</h2>
          </div>

          {error && <div className={styles.errorAlert} role="alert">{error}</div>}

          <form className={styles.form} onSubmit={handleSave}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="edit-username">Username</label>
              <input
                ref={usernameRef}
                className={styles.input}
                type="text"
                id="edit-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                spellCheck={false}
                required
                disabled={submitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="edit-name">Name</label>
              <input
                className={styles.input}
                type="text"
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                disabled={submitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="edit-email">Email</label>
              <input
                className={styles.input}
                type="email"
                id="edit-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                required
                disabled={submitting}
              />
              {emailChanged && (
                <span className={styles.hint}>
                  We&apos;ll send a code to verify your new email.
                </span>
              )}
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!dirty} loading={submitting}>
                Save changes
              </Button>
            </div>
          </form>
        </>
      ) : (
        <>
          <div className={styles.header}>
            <h2 id="edit-profile-title" className={styles.title}>Verify your new email</h2>
            <p className={styles.subtitle}>We sent a 6-digit code to {email}</p>
          </div>

          {error && <div className={styles.errorAlert} role="alert">{error}</div>}

          <form className={styles.form} onSubmit={handleVerify}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="edit-email-code">Verification code</label>
              <input
                className={styles.input}
                type="text"
                id="edit-email-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                aria-invalid={!!error}
                required
                disabled={submitting}
              />
            </div>

            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep('edit')}
                disabled={submitting}
              >
                Back
              </Button>
              <Button type="submit" loading={submitting}>
                Verify
              </Button>
            </div>
          </form>

          <div className={styles.resendRow}>
            <Button variant="ghost" size="sm" onClick={handleResend} disabled={submitting}>
              {resendStatus || 'Resend code'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
