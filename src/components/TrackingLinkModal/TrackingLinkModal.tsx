'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/motion/Modal';
import Button from '@/components/Button/Button';
import styles from './TrackingLinkModal.module.css';

interface TrackingLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Relative public URL of the resume, e.g. `/username/slug`. */
  publicUrl?: string;
}

/**
 * Builds a per-application tracking link (`?for=Company-Role`) off the resume's
 * public URL and copies it to the clipboard, firing a toast on the result. This
 * stays a focused, reusable piece of UI.
 */
export default function TrackingLinkModal({ isOpen, onClose, publicUrl }: TrackingLinkModalProps) {
  const [linkLabel, setLinkLabel] = useState('');

  const close = () => {
    setLinkLabel('');
    onClose();
  };

  const submit = () => {
    if (linkLabel.trim() && publicUrl) {
      const cleanTag = linkLabel.trim().replace(/\s+/g, '-');
      const fullUrl = `${window.location.origin}${publicUrl}?for=${encodeURIComponent(cleanTag)}`;
      navigator.clipboard
        .writeText(fullUrl)
        .then(() => toast.success(`Tracking link for "${cleanTag}" copied to clipboard!`))
        .catch(() => toast.error("Couldn't copy tracking link. Please try again."));
    }
    close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      overlayClassName={styles.modalOverlay}
      contentClassName={styles.modalContent}
      labelledBy="tracking-link-title"
    >
      <h3 id="tracking-link-title" className={styles.modalTitle}>Create custom tracking link</h3>
      <p className={styles.modalDesc}>
        Enter an application label to create a personalized tracking link:
        <br />
        <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>(e.g., Google-Frontend, Netflix-Recruiter)</span>
      </p>
      <input
        type="text"
        className={styles.modalInput}
        value={linkLabel}
        onChange={(e) => setLinkLabel(e.target.value)}
        placeholder="Application label"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <div className={styles.modalActions}>
        <Button variant="secondary" onClick={close}>Cancel</Button>
        <Button onClick={submit}>Copy link</Button>
      </div>
    </Modal>
  );
}
