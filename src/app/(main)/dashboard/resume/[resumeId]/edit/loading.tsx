import React from 'react';
import Skeleton from '@/components/Skeleton/Skeleton';
import styles from './ResumeEditor.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      <Skeleton width={90} height={16} style={{ marginBottom: 24 }} />

      <div className={styles.header}>
        <div className={styles.headerRow}>
          <Skeleton width={40} height={40} radius={10} />
          <Skeleton width={200} height={34} radius={8} />
        </div>
        <Skeleton width={320} height={16} />
      </div>

      <div className={styles.editGrid}>
        <div className={styles.editColumn}>
          <Skeleton width="100%" height={220} radius={12} />
          <Skeleton width="100%" height={120} radius={12} />
          <Skeleton width="100%" height={280} radius={12} />
          <Skeleton width="100%" height={56} radius={12} />
        </div>
        <Skeleton width="100%" height={560} radius={12} />
      </div>
    </div>
  );
}
