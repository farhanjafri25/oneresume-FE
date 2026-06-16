'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SignOut, Chat, Gear } from '@phosphor-icons/react/dist/ssr';
import { logoutUser } from '@/app/actions/auth';
import { Resume, User } from '@/types';
import { getMostRecentResume } from '@/lib/resume-utils';
import { useActiveResume } from '@/components/ActiveResume/ActiveResumeContext';
import Tabs from '@/components/Tabs/Tabs';
import ResumeSwitcher from '@/components/ResumeSwitcher/ResumeSwitcher';
import UploadModal from '@/components/UploadModal/UploadModal';
import Button from '@/components/Button/Button';
import styles from './TopNav.module.css';

// Top-level header tabs. Each entry owns its own active predicate so adding a
// future section (beside Analytics) is a one-line change with no special-casing.
const HEADER_TABS = [
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/dashboard/analytics',
    isActive: (p: string) => p === '/dashboard/analytics' || p.startsWith('/dashboard/analytics/'),
  },
];

const FEEDBACK_URL = 'https://dlke0c2pw6g.typeform.com/to/RSXJXaMJ';

export default function TopNav({ user, resumes = [] }: { user?: User; resumes?: Resume[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeResumeId = useActiveResume();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewResumeOpen, setIsNewResumeOpen] = useState(false);

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

  const activeTab = HEADER_TABS.find((t) => t.isActive(pathname))?.id;

  // Which resume the switcher reflects. Prefer the page's own declaration
  // (context), fall back to any known resume id embedded in the URL — so new
  // per-resume routes resolve without a hardcoded prefix list — and finally to
  // the most recently touched resume on pages that have no resume of their own.
  const currentResumeId =
    activeResumeId ??
    resumes.find((r) => pathname.split('/').includes(r.id))?.id ??
    getMostRecentResume(resumes)?.id;

  const showSwitcher = Boolean(user && resumes.length > 0 && currentResumeId);

  return (
    <nav className={styles.container}>
      <div className={`${styles.left} ${styles.flat}`}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          <img src="/logo.svg" alt="OneCV" className={styles.logoImg} />
        </Link>
      </div>

      {user && (
        <div className={styles.centerGroup}>
          {showSwitcher && (
            <ResumeSwitcher
              resumes={resumes.map((r) => ({ id: r.id, title: r.title }))}
              currentResumeId={currentResumeId as string}
              onNewResume={() => setIsNewResumeOpen(true)}
            />
          )}
          <Tabs
            items={HEADER_TABS}
            activeId={activeTab}
            onTabClick={closeMenu}
            variant="frosted"
            fill="never"
            ariaLabel="Primary"
          />
        </div>
      )}

      <div className={`${user ? styles.right : styles.rightPublic} ${styles.flat}`}>
        {user ? (
          <>
          <Button
            variant="secondary"
            size="sm"
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.feedbackBtn}
          >
            Give Feedback
          </Button>
          <div className={styles.profileMenu} ref={profileMenuRef}>
            <button
              type="button"
              className={styles.avatar}
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
              title={user.username}
            >
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random`} alt="User Avatar" />
            </button>

            {isProfileOpen && (
              <div className={styles.profileDropdown} role="menu">
                <Link
                  href="/settings"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={closeMenu}
                >
                  <Gear size={16} />
                  Settings
                </Link>
                <a
                  href={FEEDBACK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.dropdownItem} ${styles.dropdownFeedback}`}
                  role="menuitem"
                  onClick={closeMenu}
                >
                  <Chat size={16} />
                  Give Feedback
                </a>
                <div className={styles.dropdownDivider} />
                <form action={logoutUser} onSubmit={closeMenu}>
                  <button
                    type="submit"
                    className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    role="menuitem"
                  >
                    <SignOut size={16} />
                    Log out
                  </button>
                </form>
              </div>
            )}
          </div>
          </>
        ) : (
          <Link href="/login" className={styles.link} onClick={closeMenu}>Sign In</Link>
        )}
      </div>

      <UploadModal
        isOpen={isNewResumeOpen}
        onClose={() => setIsNewResumeOpen(false)}
        onSuccess={(result) => {
          setIsNewResumeOpen(false);
          if (result?.resumeId) {
            router.refresh();
            router.push(`/dashboard/resume/${result.resumeId}`);
          }
        }}
      />
    </nav>
  );
}
