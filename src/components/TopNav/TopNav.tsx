'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';
import { User } from '@/types';
import styles from './TopNav.module.css';

export default function TopNav({ user }: { user?: User }) {
  const pathname = usePathname();

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>OneResume</Link>
        </div>
        
        {user && (
          <div className={styles.center}>
            <Link 
              href="/dashboard" 
              className={`${styles.link} ${pathname === '/dashboard' ? styles.active : ''}`}
            >
              Resumes
            </Link>

            <Link 
              href="/dashboard/variants" 
              className={`${styles.link} ${pathname === '/dashboard/variants' ? styles.active : ''}`}
            >
              Variants
            </Link>

            <Link 
              href="/settings" 
              className={`${styles.link} ${pathname === '/settings' ? styles.active : ''}`}
            >
              Settings
            </Link>
          </div>
        )}
        
        <div className={styles.right}>
          {user ? (
            <>
              <div className={styles.avatar}>
                <img src={`https://ui-avatars.com/api/?name=${user.username}&background=random`} alt="User Avatar" />
              </div>
              <form action={logoutUser}>
                <button type="submit" className={styles.iconButton} title="Logout">
                  <LogOut size={18} />
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={styles.link}>Sign In</Link>
          )}
        </div>
      </nav>
    </div>
  );
}
