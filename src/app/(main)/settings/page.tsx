import React from 'react';
import styles from './settings.module.css';
import { getMe } from '@/lib/api';
import { ShieldWarning } from '@phosphor-icons/react/dist/ssr';
import { redirect } from 'next/navigation';
import PageTransition from '@/components/motion/PageTransition';
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

  return (
    <PageTransition className={styles.container}>
      <div className={styles.card}>
        <div className={styles.profileSection}>
          <AvatarSelector user={user} />
          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h2>{user.name || user.username}</h2>
              <span className={styles.proBadge}>Pro</span>
            </div>
            <p>OneCV Creator Account</p>
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
          <div className={styles.detailField}>
            <span className={styles.label}>Account ID</span>
            <span className={styles.value} style={{ fontSize: '12px', fontFamily: 'monospace' }}>{user.id}</span>
          </div>
          <div className={styles.detailField}>
            <span className={styles.label}>Member Since</span>
            <span className={styles.value}>{formatDate(user.createdAt)}</span>
          </div>
        </div>

        <div className={styles.alert}>
          <ShieldWarning size={20} className={styles.alertIcon} />
          <div>
            <h3 className={styles.alertTitle}>Profile Editing is Read-Only</h3>
            <p className={styles.alertDesc}>
              To maintain database security during active testing, profile modifications and password updates are temporarily read-only. Full configuration features will be unlocked in the upcoming release.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
