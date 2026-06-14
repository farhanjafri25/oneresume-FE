'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CaretDown, Plus, Check, SquaresFour } from '@phosphor-icons/react/dist/ssr';
import styles from './ResumeSwitcher.module.css';

export interface ResumeSwitcherOption {
  id: string;
  title: string;
}

interface ResumeSwitcherProps {
  resumes: ResumeSwitcherOption[];
  currentResumeId: string;
  /** Opens the new-resume upload flow (parent owns the modal). */
  onNewResume: () => void;
}

export default function ResumeSwitcher({ resumes, currentResumeId, onNewResume }: ResumeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const current = resumes.find((r) => r.id === currentResumeId);

  // Close on outside-click or Escape (matches the app's dropdown convention,
  // and adds the Escape handling the older menus lack).
  useEffect(() => {
    if (!open) return;
    const handleClick = () => setOpen(false);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={styles.switcher}>
      <button
        type="button"
        className={styles.trigger}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch resume"
      >
        <span className={styles.triggerLabel}>{current?.title ?? 'Resume'}</span>
        <CaretDown size={14} weight="bold" className={styles.caret} data-open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.menu}
            role="menu"
            onClick={(e) => e.stopPropagation()}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: 'top left' }}
          >
            <div className={styles.menuList}>
              {resumes.map((r) => (
                <Link
                  key={r.id}
                  href={`/dashboard/resume/${r.id}`}
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  aria-current={r.id === currentResumeId ? 'true' : undefined}
                >
                  <span className={styles.menuItemLabel}>{r.title}</span>
                  {r.id === currentResumeId && <Check size={15} weight="bold" className={styles.check} />}
                </Link>
              ))}
            </div>

            <div className={styles.divider} />

            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNewResume();
              }}
            >
              <Plus size={15} />
              New resume
            </button>
            <Link href="/dashboard" className={styles.menuItem} role="menuitem" onClick={() => setOpen(false)}>
              <SquaresFour size={15} />
              View all resumes
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
