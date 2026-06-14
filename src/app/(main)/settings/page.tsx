import React from 'react';
import styles from './settings.module.css';
import { getMe } from '@/lib/api';
import { redirect } from 'next/navigation';
import PageTransition from '@/components/motion/PageTransition';
import AccountActions from './AccountActions';
import AvatarSelector from '@/components/AvatarSelector/AvatarSelector';

function formatDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export default async function SettingsPage() {
  let user;
  try {
    user = await getMe();
  } catch (err) {
    console.error("SettingsPage error:", err);
  }

  if (!user) {
    redirect('/login');
  }

  const memberSince = formatDate(user.createdAt);

  return (
    <PageTransition className={styles.container}>
      <div className={styles.card}>
        <div className={styles.profileSection}>
          <AvatarSelector user={user} />
          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h2>{user.name || user.username}</h2>
            </div>
            {memberSince && <p>Member since {memberSince}</p>}
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailField}>
            <span className={styles.label}>Username</span>
            <span className={styles.value}>{user.username}</span>
          </div>
          <div className={styles.detailField}>
            <span className={styles.label}>Email Address</span>
            <span className={styles.value}>{user.email}</span>
          </div>
        </div>

        <AccountActions user={user} />
      </div>
    </PageTransition>
  );
}
