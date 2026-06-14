'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, PencilSimple } from '@phosphor-icons/react/dist/ssr';
import styles from './AvatarSelector.module.css';
import Modal from '@/components/motion/Modal';
import { updateAvatarAction } from '@/app/actions/user';
import { User } from '@/types';

interface AvatarSelectorProps {
  user: User;
}

const AVATAR_COUNT = 12;
const AVATARS = Array.from({ length: AVATAR_COUNT }, (_, i) => `/avatars/avatar-${i + 1}.svg`);

export default function AvatarSelector({ user }: AvatarSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [updatingIndex, setUpdatingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentAvatar = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username)}&background=random&size=128`;

  const handleOpen = () => {
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
  };

  const handleSelectAvatar = async (avatarUrl: string, index: number) => {
    if (isPending) return;
    setIsPending(true);
    setUpdatingIndex(index);
    setError(null);

    try {
      const res = await updateAvatarAction(avatarUrl);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Failed to update avatar:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsPending(false);
      setUpdatingIndex(null);
    }
  };

  return (
    <>
      <div 
        className={styles.avatarWrapper} 
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        <div className={styles.avatar}>
          <img src={currentAvatar} alt="User Avatar" />
          <div className={styles.overlay}>
            <span className={styles.overlayText}>Edit</span>
          </div>
        </div>
        <div className={styles.editBadge} aria-hidden="true">
          <PencilSimple size={14} weight="bold" />
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        overlayClassName={styles.modalOverlay}
        contentClassName={styles.modal}
        labelledBy="avatar-modal-title"
      >
        <div className={styles.header}>
          <div>
            <h2 id="avatar-modal-title" className={styles.title}>Choose Avatar</h2>
            <p className={styles.subtitle}>Select one of our avatars.</p>
          </div>
          <button 
            className={styles.closeBtn} 
            onClick={handleClose}
            disabled={isPending}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.grid}>
          {AVATARS.map((avatarUrl, idx) => {
            const isActive = user.avatarUrl === avatarUrl;
            const isUpdating = updatingIndex === idx;

            return (
              <button
                key={avatarUrl}
                type="button"
                className={`${styles.gridItem} ${isActive ? styles.gridItemActive : ''}`}
                onClick={() => handleSelectAvatar(avatarUrl, idx)}
                disabled={isPending}
                aria-label={`Select avatar option ${idx + 1}`}
              >
                <img src={avatarUrl} alt={`Avatar option ${idx + 1}`} />
                {isUpdating && (
                  <div className={styles.itemSpinner}>
                    <div className={styles.spinner} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {error && <p className={styles.errorText}>{error}</p>}
      </Modal>
    </>
  );
}
