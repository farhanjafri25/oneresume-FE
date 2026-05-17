import React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import styles from './TopNav.module.css';

export default function TopNav() {
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>OneResume</Link>
        </div>
        
        <div className={styles.center}>
          <Link href="/dashboard" className={`${styles.link} ${styles.active}`}>Resumes</Link>
          <Link href="/dashboard/variants" className={styles.link}>Variants</Link>
          <Link href="/settings" className={styles.link}>Settings</Link>
        </div>
        
        <div className={styles.right}>
          <button className={styles.iconButton}>
            <Bell size={18} />
          </button>
          <div className={styles.avatar}>
            <img src="https://ui-avatars.com/api/?name=Alex+Johnson&background=random" alt="User Avatar" />
          </div>
        </div>
      </nav>
    </div>
  );
}
