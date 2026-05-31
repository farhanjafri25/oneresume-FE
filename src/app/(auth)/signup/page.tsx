'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signupUser, loginWithGoogle } from '@/app/actions/auth';
import styles from '../login/page.module.css'; // Reuse login styles

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupUser, null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const initGoogleSignIn = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        const google = (window as any).google;
        
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

        if (googleBtnRef.current) {
          google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            width: googleBtnRef.current.clientWidth || 336,
            text: 'signup_with',
            shape: 'rectangular',
          });
        }
        clearInterval(checkInterval);
      }
    };

    initGoogleSignIn();
    checkInterval = setInterval(initGoogleSignIn, 500);

    return () => clearInterval(checkInterval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>OneResume</Link>
          <h1 className={styles.title}>Create an account</h1>
          <p className={styles.subtitle}>Get started with OneResume today</p>
        </div>

        {(state?.error || googleError) && (
          <div className={styles.errorAlert}>
            {state?.error || googleError}
          </div>
        )}

        <form className={styles.form} action={formAction}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input type="text" name="username" id="username" placeholder="alexj" required disabled={isPending || isGooglePending} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" placeholder="alex@example.com" required disabled={isPending || isGooglePending} />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input type="password" name="password" id="password" placeholder="••••••••" required disabled={isPending || isGooglePending} />
          </div>

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={isPending || isGooglePending}>
            {isPending ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.divider}>or</div>

        <div 
          ref={googleBtnRef} 
          className={styles.googleBtnWrapper}
          style={{ pointerEvents: isGooglePending ? 'none' : 'auto', opacity: isGooglePending ? 0.6 : 1 }}
        />

        <p className={styles.footer}>
          Already have an account? <Link href="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
