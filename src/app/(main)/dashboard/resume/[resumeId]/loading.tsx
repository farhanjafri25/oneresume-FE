import React from 'react';
import Skeleton from '@/components/Skeleton/Skeleton';
import styles from './ResumeDetailView.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      <Skeleton width={90} height={16} style={{ marginBottom: 24 }} />

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Skeleton width={260} height={34} radius={8} />
          <Skeleton width={120} height={16} style={{ marginTop: 10 }} />
        </div>
        <div className={styles.headerActions}>
          <Skeleton width={104} height={40} radius={999} />
          <Skeleton width={120} height={40} radius={999} />
        </div>
      </div>

      <Skeleton width={320} height={40} radius={999} style={{ marginBottom: 28 }} />

      <div className={styles.overviewGrid}>
        <Skeleton width="100%" height={520} radius={12} />
        <div className={styles.overviewSide}>
          <Skeleton width="100%" height={88} radius={12} />
          <Skeleton width="100%" height={68} radius={12} />
          <Skeleton width="100%" height={68} radius={12} />
          <Skeleton width="100%" height={68} radius={12} />
        </div>
      </div>
    </div>
  );
}
