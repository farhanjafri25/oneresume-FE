'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';
import { User } from '@/types';
import styles from './TopNav.module.css';

const NAV_TABS = [
  { name: 'Resumes', href: '/dashboard' },
  { name: 'Variants', href: '/dashboard/variants' },
  { name: 'Settings', href: '/settings' },
];

export default function TopNav({ user }: { user?: User }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

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
        className={`${styles.link} ${!isOverlay && activeTab === tab.name ? styles.active : ''}`}
        onClick={closeMenu}
        tabIndex={isOverlay ? -1 : undefined}
        aria-hidden={isOverlay ? true : undefined}
      >
        {tab.name}
      </Link>
    </li>
  );

  return (
    <div className={styles.container}>
      <nav className={`${styles.nav} ${isOpen ? styles.open : ''}`}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo} onClick={closeMenu}>
            <img src="/logo.svg" alt="OneCV" className={styles.logoImg} />
          </Link>
        </div>

        {/* Toggle Button for Mobile */}
        {user && (
          <button className={styles.hamburger} onClick={toggleMenu} aria-label="Toggle Menu">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        {user && (
          <div className={`${styles.center} ${isOpen ? styles.active : ''}`}>
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

        <div className={`${user ? styles.right : styles.rightPublic} ${isOpen ? styles.active : ''}`}>
          {user ? (
            <>
              <div className={styles.avatar}>
                <img src={`https://ui-avatars.com/api/?name=${user.username}&background=random`} alt="User Avatar" />
              </div>
              <form action={logoutUser} onSubmit={closeMenu}>
                <button type="submit" className={styles.iconButton} title="Logout">
                  <LogOut size={18} />
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={styles.link} onClick={closeMenu}>Sign In</Link>
          )}
        </div>
      </nav>
    </div>
  );
}
