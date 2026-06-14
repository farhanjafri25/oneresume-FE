'use client';

import React from 'react';
import { Check } from '@phosphor-icons/react/dist/ssr';
import styles from './Stepper.module.css';

export interface StepItem {
  id: string;
  label: string;
}

type StepStatus = 'complete' | 'current' | 'upcoming';

interface StepperProps {
  items: StepItem[];
  /** id of the step currently in progress. */
  currentId: string;
  className?: string;
}

/**
 * Status of a node is a pure function of its index vs. the current index, so the
 * stepper is fully derived from the parent's state machine — no internal state.
 */
function statusFor(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return 'complete';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}

/**
 * Persistent step indicator shown across the whole flow. Desktop renders the
 * full horizontal track; on narrow screens it collapses to a "Step N of M"
 * label plus a thin progress bar (a 4-node track is too cramped on a phone).
 */
export default function Stepper({ items, currentId, className }: StepperProps) {
  const currentIndex = Math.max(
    0,
    items.findIndex((s) => s.id === currentId),
  );
  const current = items[currentIndex];
  const progress = items.length > 1 ? currentIndex / (items.length - 1) : 0;

  return (
    <nav
      className={[styles.stepper, className].filter(Boolean).join(' ')}
      aria-label="Progress"
    >
      {/* Desktop / wide track */}
      <ol className={styles.track}>
        {items.map((step, index) => {
          const status = statusFor(index, currentIndex);
          return (
            <li key={step.id} className={styles.step} data-status={status}>
              <span className={styles.node} aria-hidden="true">
                {status === 'complete' ? (
                  <Check size={15} weight="bold" />
                ) : (
                  <span className={styles.nodeNumber}>{index + 1}</span>
                )}
              </span>
              <span className={styles.label}>{step.label}</span>
              {index < items.length - 1 && (
                <span className={styles.connector} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Compact mobile summary */}
      <div className={styles.compact}>
        <span className={styles.compactLabel}>
          Step {currentIndex + 1} of {items.length}
          {current ? ` · ${current.label}` : ''}
        </span>
        <span className={styles.compactBar}>
          <span
            className={styles.compactFill}
            style={{ transform: `scaleX(${progress})` }}
          />
        </span>
      </div>
    </nav>
  );
}
