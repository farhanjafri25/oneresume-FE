import React from 'react';
import styles from './AnalyticsOverview.module.css';
import Skeleton from '@/components/Skeleton/Skeleton';

export default function AnalyticsOverviewLoading() {
  return (
    <div className={styles.container} aria-busy="true">
      <header className={styles.header}>
        <div>
          <Skeleton width={180} height={30} radius={8} style={{ marginBottom: 10 }} />
          <Skeleton width={340} height={16} radius={6} />
        </div>
        <Skeleton width={260} height={40} radius={9999} />
      </header>

      <div className={styles.statsGrid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={120} radius={16} style={{ width: '100%' }} />
        ))}
      </div>

      <Skeleton height={300} radius={16} style={{ width: '100%', marginBottom: 32 }} />

      <div className={styles.detailGrid}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} height={220} radius={16} style={{ width: '100%' }} />
        ))}
      </div>

      <Skeleton height={200} radius={16} style={{ width: '100%' }} />
    </div>
  );
}
