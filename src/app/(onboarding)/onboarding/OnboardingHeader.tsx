'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SignOut } from '@phosphor-icons/react/dist/ssr';
import { logoutUser } from '@/app/actions/auth';
import { User } from '@/types';
import { RAIL_STEPS } from '@/lib/onboarding';
import styles from './Onboarding.module.css';

interface OnboardingHeaderProps {
  user: User;
  /** Index into RAIL_STEPS of the current step. */
  railIndex: number;
}

export default function OnboardingHeader({ user, railIndex }: OnboardingHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Link href="/" className={styles.logo}>
          <img src="/logo.svg" alt="OneCV" className={styles.logoImg} />
        </Link>
      </div>

      <div className={styles.headerCenter}>
        <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={RAIL_STEPS.length} aria-valuenow={Math.max(0, railIndex + 1)}>
          {RAIL_STEPS.map((step, i) => (
            <span
              key={step.key}
              className={`${styles.progressBar} ${i <= railIndex ? styles.progressBarActive : ''}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.profileMenu} ref={menuRef}>
          <button
            type="button"
            className={styles.avatar}
            onClick={() => setMenuOpen((p) => !p)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={user.username}
          >
            <img
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}
              alt="User avatar"
            />
          </button>

          {menuOpen && (
            <div className={styles.profileDropdown} role="menu">
              <form action={logoutUser} onSubmit={() => setMenuOpen(false)}>
                <button type="submit" className={`${styles.dropdownItem} ${styles.logoutItem}`} role="menuitem">
                  <SignOut size={16} />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
