import React from 'react';
import styles from './Analytics.module.css';
import Skeleton from '@/components/Skeleton/Skeleton';

export default function AnalyticsLoading() {
  return (
    <div className={styles.container} aria-busy="true">
      <Skeleton width={150} height={18} radius={6} style={{ marginBottom: 24 }} />

      <header className={styles.header}>
        <Skeleton width={220} height={30} radius={8} style={{ marginBottom: 10 }} />
        <Skeleton width={360} height={16} radius={6} />
      </header>

      <div className={styles.statsGrid}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={120} radius={16} style={{ width: '100%' }} />
        ))}
      </div>

      <Skeleton height={280} radius={16} style={{ width: '100%', marginTop: 24 }} />
    </div>
  );
}
