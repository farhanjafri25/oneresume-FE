import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>OneResume</Link>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="alex@example.com" required />
          </div>
          
          <div className={styles.inputGroup}>
            <div className={styles.passwordHeader}>
              <label htmlFor="password">Password</label>
            </div>
            <input type="password" id="password" placeholder="••••••••" required />
          </div>

          <button type="button" className={`btn-primary ${styles.submitBtn}`}>
            Sign In
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link href="/signup" className={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
