'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeSlash } from '@phosphor-icons/react/dist/ssr';
import Modal from '@/components/motion/Modal';
import Button from '@/components/Button/Button';
import { changePasswordAction } from '@/app/actions/account';
import { useFocusOnMount } from './useFocusOnMount';
import styles from './accountModals.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MIN_LENGTH = 8;

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const currentRef = useFocusOnMount<HTMLInputElement>();

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (newPassword.length < MIN_LENGTH) {
      setError(`New password must be at least ${MIN_LENGTH} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('currentPassword', currentPassword);
    formData.set('newPassword', newPassword);
    formData.set('confirmPassword', confirmPassword);
    const result = await changePasswordAction(null, formData);
    setSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    toast.success('Password changed');
    onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName={styles.overlay}
      contentClassName={styles.modal}
      labelledBy="change-password-title"
    >
      <div className={styles.header}>
        <h2 id="change-password-title" className={styles.title}>Change password</h2>
      </div>

      {error && <div className={styles.errorAlert} role="alert">{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="current-password">Current password</label>
          <div className={styles.passwordWrapper}>
            <input
              ref={currentRef}
              className={styles.input}
              type={show ? 'text' : 'password'}
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={submitting}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide passwords' : 'Show passwords'}
              aria-pressed={show}
            >
              {show ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="new-password">New password</label>
          <input
            className={styles.input}
            type={show ? 'text' : 'password'}
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={MIN_LENGTH}
            required
            disabled={submitting}
          />
          <span className={styles.hint}>At least {MIN_LENGTH} characters.</span>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="confirm-password">Confirm new password</label>
          <input
            className={styles.input}
            type={show ? 'text' : 'password'}
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            aria-invalid={confirmPassword.length > 0 && newPassword !== confirmPassword}
            required
            disabled={submitting}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Change password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
