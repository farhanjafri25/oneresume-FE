import React from 'react';
import styles from './settings.module.css';
import Skeleton from '@/components/Skeleton/Skeleton';

export default function SettingsLoading() {
  return (
    <div className={styles.container} aria-busy="true">
      <div className={styles.card}>
        <div className={styles.profileSection}>
          <Skeleton width={80} height={80} radius={999} />
          <div className={styles.profileInfo}>
            <Skeleton width={160} height={24} radius={6} style={{ marginBottom: 8 }} />
            <Skeleton width={200} height={15} radius={6} />
          </div>
        </div>

        <div className={styles.detailsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className={styles.detailField} key={i}>
              <Skeleton width={90} height={12} radius={4} style={{ marginBottom: 10 }} />
              <Skeleton width="70%" height={16} radius={6} />
            </div>
          ))}
        </div>

        <div className={styles.alert}>
          <Skeleton width="100%" height={56} radius={12} />
        </div>
      </div>
    </div>
  );
}
