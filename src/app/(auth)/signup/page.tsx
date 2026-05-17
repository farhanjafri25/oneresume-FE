'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { signupUser } from '@/app/actions/auth';
import styles from '../login/page.module.css'; // Reuse login styles

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupUser, null);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>OneResume</Link>
          <h1 className={styles.title}>Create an account</h1>
          <p className={styles.subtitle}>Get started with OneResume today</p>
        </div>

        {state?.error && (
          <div className={styles.errorAlert}>
            {state.error}
          </div>
        )}

        <form className={styles.form} action={formAction}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input type="text" name="username" id="username" placeholder="alexj" required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" placeholder="alex@example.com" required />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input type="password" name="password" id="password" placeholder="••••••••" required />
          </div>

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={isPending}>
            {isPending ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link href="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
