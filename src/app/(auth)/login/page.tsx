'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { loginUser, loginWithGoogle } from '@/app/actions/auth';
import Button from '@/components/Button/Button';
import { transitions } from '@/lib/motion';
import styles from './page.module.css';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginUser, null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let checkInterval: ReturnType<typeof setInterval> | undefined;

    const initGoogleSignIn = () => {
      if (initializedRef.current) {
        if (checkInterval) clearInterval(checkInterval);
        return;
      }

      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && googleBtnRef.current) {
        const google = (window as any).google;
        initializedRef.current = true;

        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          callback: async (response: any) => {
            setGoogleError(null);
            setIsGooglePending(true);
            const result = await loginWithGoogle(response.credential);
            setIsGooglePending(false);
            if (result?.error) {
              setGoogleError(result.error);
            }
          },
        });

        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: googleBtnRef.current.clientWidth || 336,
          text: 'signin_with',
          shape: 'rectangular',
        });

        if (checkInterval) clearInterval(checkInterval);
      }
    };

    initGoogleSignIn();
    if (!initializedRef.current) {
      checkInterval = setInterval(initGoogleSignIn, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.base}
      >
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            <img src="/logo.svg" alt="OneCV" className={styles.logoImg} />
          </Link>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>

        {(state?.error || googleError) && (
          <div className={styles.errorAlert}>
            {state?.error || googleError}
          </div>
        )}

        <div
          ref={googleBtnRef}
          className={styles.googleBtnWrapper}
          style={{ pointerEvents: isGooglePending ? 'none' : 'auto', opacity: isGooglePending ? 0.6 : 1 }}
        />

        <div className={styles.divider}>or</div>

        <form className={styles.form} action={formAction}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" placeholder="alex@example.com" required disabled={isPending || isGooglePending} />
          </div>
          
          <div className={styles.inputGroup}>
            <div className={styles.passwordHeader}>
              <label htmlFor="password">Password</label>
            </div>
            <input type="password" name="password" id="password" placeholder="••••••••" required disabled={isPending || isGooglePending} />
          </div>

          <Button type="submit" className={styles.submitBtn} disabled={isPending || isGooglePending}>
            {isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link href="/signup" className={styles.link}>Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
