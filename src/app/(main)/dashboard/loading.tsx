import React from 'react';
import styles from './Dashboard.module.css';
import Skeleton from '@/components/Skeleton/Skeleton';

export default function DashboardLoading() {
  return (
    <div className={styles.container} aria-busy="true">
      <header className={styles.header}>
        <div>
          <Skeleton width={220} height={34} radius={8} style={{ marginBottom: 10 }} />
          <Skeleton width={300} height={16} radius={6} />
        </div>
        <Skeleton width={160} height={44} radius={999} />
      </header>

      <div className={styles.grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={380} radius={24} style={{ width: '100%' }} />
        ))}
      </div>
    </div>
  );
}
