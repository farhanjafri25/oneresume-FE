import React, { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
}

/**
 * A single shimmering placeholder block. Purely presentational — used inside
 * route-level loading.tsx files so the shell streams in immediately while the
 * (potentially cold) backend resolves Server Component data.
 */
export default function Skeleton({ width, height, radius, className, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={className ? `${styles.skeleton} ${className}` : styles.skeleton}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
