'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';
import { User } from '@/types';
import styles from './TopNav.module.css';

export default function TopNav({ user }: { user?: User }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className={styles.container}>
      <nav className={`${styles.nav} ${isOpen ? styles.open : ''}`}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo} onClick={closeMenu}>OneResume</Link>
        </div>
        
        {/* Toggle Button for Mobile */}
        {user && (
          <button className={styles.hamburger} onClick={toggleMenu} aria-label="Toggle Menu">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        {user && (
          <div className={`${styles.center} ${isOpen ? styles.active : ''}`}>
            <Link 
              href="/dashboard" 
              className={`${styles.link} ${pathname === '/dashboard' ? styles.active : ''}`}
              onClick={closeMenu}
            >
              Resumes
            </Link>

            <Link 
              href="/dashboard/variants" 
              className={`${styles.link} ${pathname === '/dashboard/variants' ? styles.active : ''}`}
              onClick={closeMenu}
            >
              Variants
            </Link>

            <Link 
              href="/settings" 
              className={`${styles.link} ${pathname === '/settings' ? styles.active : ''}`}
              onClick={closeMenu}
            >
              Settings
            </Link>
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
