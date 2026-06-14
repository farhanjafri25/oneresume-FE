'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeSlash } from '@phosphor-icons/react/dist/ssr';
import { loginUser, loginWithGoogle } from '@/app/actions/auth';
import Button from '@/components/Button/Button';
import { transitions } from '@/lib/motion';
import { getAuthErrorState } from '../authErrorState';
import { getGoogleIdentity } from '../googleIdentity';
import styles from './page.module.css';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginUser, null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const { alertError, credentialFieldsInvalid } = getAuthErrorState({
    formError: state?.error,
    googleError,
  });

  useEffect(() => {
    let checkInterval: ReturnType<typeof setInterval> | undefined;

    const initGoogleSignIn = () => {
      if (initializedRef.current) {
        if (checkInterval) clearInterval(checkInterval);
        return;
      }

      const google = getGoogleIdentity();
      if (google?.accounts?.id && googleBtnRef.current) {
        initializedRef.current = true;

        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          callback: async (response) => {
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
          theme: 'outline',
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
      <Link href="/" className={styles.logo}>
        <Image src="/logo.svg" alt="OneCV" className={styles.logoImg} width={116} height={30} priority />
      </Link>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.base}
      >
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome back</h1>
        </div>

        {alertError && (
          <div className={styles.errorAlert} role="alert">
            {alertError}
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
            <input
              type="email"
              name="email"
              id="email"
              placeholder="alex@example.com"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              aria-invalid={credentialFieldsInvalid}
              required
              disabled={isPending || isGooglePending}
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.passwordHeader}>
              <label htmlFor="password">Password</label>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={credentialFieldsInvalid}
                required
                disabled={isPending || isGooglePending}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button type="submit" className={styles.submitBtn} disabled={isPending || isGooglePending}>
            {isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className={styles.footer}>
          Don&apos;t have an account? <Link href="/signup" className={styles.link}>Sign up</Link>
        </p>
      </motion.div>

      <div className={styles.legalBar}>
        By continuing, you agree to our{' '}
        <Link href="/terms" className={styles.legalLink}>Terms of Service</Link> and{' '}
        <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>.
      </div>
    </div>
  );
}
