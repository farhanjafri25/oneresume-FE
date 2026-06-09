'use client';

import { useEffect } from 'react';
import { motion, animate, useMotionValue, useTransform } from 'motion/react';
import { scoreColor, scoreLabel } from '@/lib/onboarding';
import { EASE_OUT_EXPO } from '@/lib/motion';
import styles from './ScoreGauge.module.css';

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* The arc fill and the number count-up share this curve + duration so they
   finish together — the score "arrives" as one motion. */
const FILL = { duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.2 } as const;

export default function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const color = scoreColor(score);

  // Count the number up from 0 → score, in step with the arc.
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => Math.round(v));
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { count.set(clamped); return; }
    const controls = animate(count, clamped, FILL);
    return () => controls.stop();
  }, [clamped, count]);

  return (
    <div className={styles.gauge}>
      <svg className={styles.svg} viewBox="0 0 140 140" width={140} height={140}>
        <circle className={styles.bg} cx="70" cy="70" r={RADIUS} />
        <motion.circle
          className={styles.fill}
          cx="70"
          cy="70"
          r={RADIUS}
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={FILL}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className={styles.text}>
        <motion.span className={styles.number} style={{ color }}>{display}</motion.span>
        <span className={styles.label}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}
