'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/motion/Modal';
import Button from '@/components/Button/Button';
import { deleteAccountAction } from '@/app/actions/account';
import { useFocusOnMount } from './useFocusOnMount';
import { User } from '@/types';
import styles from './accountModals.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function DeleteAccountModal({ isOpen, onClose, user }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const confirmRef = useFocusOnMount<HTMLInputElement>();

  // Matches either the exact username or the literal word DELETE.
  const confirmed =
    confirmText === user.username || confirmText.trim().toUpperCase() === 'DELETE';

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmed || submitting) return;
    setSubmitting(true);
    // On success the action clears the session and redirects to /login, so this
    // component unmounts before returning. A returned value means it failed.
    const result = await deleteAccountAction();
    if (result?.error) {
      setSubmitting(false);
      toast.error(result.error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassName={styles.overlay}
      contentClassName={styles.modal}
      labelledBy="delete-account-title"
    >
      <div className={styles.header}>
        <h2 id="delete-account-title" className={styles.title}>Delete account</h2>
      </div>

      <p className={styles.warning}>
        This permanently deletes your account and all your resumes, versions, and
        analytics. <span className={styles.warningStrong}>This cannot be undone.</span>
      </p>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          handleDelete();
        }}
      >
        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="delete-confirm">
            Type <strong>{user.username}</strong> or <strong>DELETE</strong> to confirm
          </label>
          <input
            ref={confirmRef}
            className={styles.input}
            type="text"
            id="delete-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={submitting}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" disabled={!confirmed} loading={submitting}>
            Delete account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
