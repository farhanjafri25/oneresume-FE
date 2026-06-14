'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button/Button';
import { User } from '@/types';
import EditProfileModal from './EditProfileModal';
import ChangePasswordModal from './ChangePasswordModal';
import DeleteAccountModal from './DeleteAccountModal';
import styles from './settings.module.css';

interface Props {
  user: User;
}

/** Tracks a modal's open state plus a key that bumps on each open, so the modal
 *  remounts with fresh form state every time it opens (clean exit on close). */
type ModalState = { open: boolean; key: number };
const CLOSED: ModalState = { open: false, key: 0 };

export default function AccountActions({ user }: Props) {
  const router = useRouter();
  const [edit, setEdit] = useState<ModalState>(CLOSED);
  const [password, setPassword] = useState<ModalState>(CLOSED);
  const [del, setDel] = useState<ModalState>(CLOSED);

  const open = (set: React.Dispatch<React.SetStateAction<ModalState>>) =>
    set((s) => ({ open: true, key: s.key + 1 }));
  const close = (set: React.Dispatch<React.SetStateAction<ModalState>>) =>
    set((s) => ({ ...s, open: false }));

  // Pull fresh server data after a profile/email change.
  const refresh = () => router.refresh();

  return (
    <div className={styles.actions}>
      <Button variant="secondary" fullWidth onClick={() => open(setEdit)}>
        Edit profile
      </Button>

      {user.hasPassword && (
        <Button variant="secondary" fullWidth onClick={() => open(setPassword)}>
          Change password
        </Button>
      )}

      <Button variant="secondary" fullWidth onClick={() => open(setDel)}>
        Delete account
      </Button>

      <EditProfileModal
        key={`edit-${edit.key}`}
        isOpen={edit.open}
        onClose={() => close(setEdit)}
        user={user}
        onSuccess={refresh}
      />
      <ChangePasswordModal
        key={`password-${password.key}`}
        isOpen={password.open}
        onClose={() => close(setPassword)}
        onSuccess={refresh}
      />
      <DeleteAccountModal
        key={`delete-${del.key}`}
        isOpen={del.open}
        onClose={() => close(setDel)}
        user={user}
      />
    </div>
  );
}
