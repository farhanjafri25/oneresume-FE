'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, MessageSquare, Settings } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';
import { User } from '@/types';
import styles from './TopNav.module.css';

const NAV_TABS = [
  { name: 'Resumes', href: '/dashboard' },
  { name: 'Variants', href: '/dashboard/variants' },
];

const FEEDBACK_EMAIL = 'hello@onecv.co';

export default function TopNav({ user }: { user?: User }) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const closeMenu = () => setIsProfileOpen(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleDocumentClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [isProfileOpen]);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  const activeTab = NAV_TABS.find((tab) => tab.href === pathname)?.name;

  useEffect(() => {
    const container = containerRef.current;
    const activeTabElement = activeTabRef.current;

    const updateClip = () => {
      if (!container) return;

      if (!activeTab || !activeTabElement) {
        // No active tab on this route: hide the highlight pill.
        container.style.clipPath = 'inset(0 100% 0 0 round 9999px)';
        return;
      }

      const { offsetLeft, offsetWidth } = activeTabElement;
      const clipLeft = offsetLeft;
      const clipRight = offsetLeft + offsetWidth;
      const right = 100 - (clipRight / container.offsetWidth) * 100;
      const left = (clipLeft / container.offsetWidth) * 100;

      container.style.clipPath = `inset(0 ${right.toFixed(2)}% 0 ${left.toFixed(2)}% round 9999px)`;
    };

    updateClip();
    window.addEventListener('resize', updateClip);
    return () => window.removeEventListener('resize', updateClip);
  }, [activeTab]);

  const renderTab = (
    tab: (typeof NAV_TABS)[number],
    isOverlay: boolean
  ) => (
    <li key={tab.name}>
      <Link
        href={tab.href}
        ref={!isOverlay && activeTab === tab.name ? activeTabRef : undefined}
        className={styles.link}
        onClick={closeMenu}
        tabIndex={isOverlay ? -1 : undefined}
        aria-hidden={isOverlay ? true : undefined}
      >
        {tab.name}
      </Link>
    </li>
  );

  return (
    <nav className={styles.container}>
      <div className={`${styles.left} ${styles.flat}`}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          <img src="/logo.svg" alt="OneCV" className={styles.logoImg} />
        </Link>
      </div>

      {user && (
        <div className={styles.center}>
          <ul className={styles.list}>
            {NAV_TABS.map((tab) => renderTab(tab, false))}
          </ul>

          <div aria-hidden className={styles.clipContainer} ref={containerRef}>
            <ul className={`${styles.list} ${styles.listOverlay}`}>
              {NAV_TABS.map((tab) => renderTab(tab, true))}
            </ul>
          </div>
        </div>
      )}

      <div className={`${user ? styles.right : styles.rightPublic} ${styles.flat}`}>
        {user ? (
          <div className={styles.profileMenu} ref={profileMenuRef}>
            <button
              type="button"
              className={styles.avatar}
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
              title={user.username}
            >
              <img src={`https://ui-avatars.com/api/?name=${user.username}&background=random`} alt="User Avatar" />
            </button>

            {isProfileOpen && (
              <div className={styles.profileDropdown} role="menu">
                <Link
                  href="/settings"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={closeMenu}
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <a
                  href={`mailto:${FEEDBACK_EMAIL}?subject=OneCV%20Feedback`}
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={closeMenu}
                >
                  <MessageSquare size={16} />
                  Give Feedback
                </a>
                <div className={styles.dropdownDivider} />
                <form action={logoutUser} onSubmit={closeMenu}>
                  <button
                    type="submit"
                    className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    role="menuitem"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={styles.link} onClick={closeMenu}>Sign In</Link>
        )}
      </div>
    </nav>
  );
}
