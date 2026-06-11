'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { signupUser, loginWithGoogle, verifyOtpAction, resendOtpAction } from '@/app/actions/auth';
import { transitions } from '@/lib/motion';
import styles from '../login/page.module.css';

export default function SignupPage() {
  const [signupState, signupAction, isSignupPending] = useActionState(signupUser, null);
  const [verifyState, verifyAction, isVerifyPending] = useActionState(verifyOtpAction, null);
  
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const requiresOtp = signupState?.requiresOtp;
  const email = signupState?.email;

  useEffect(() => {
    if (requiresOtp) return; // Don't init google signin on OTP screen

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
            const result = await loginWithGoogle(response.credential, true);
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
          text: 'signup_with',
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
  }, [requiresOtp]);

  const handleResend = async () => {
    if (!email) return;
    setResendStatus('Sending...');
    const result = await resendOtpAction(email);
    if (result?.error) {
      setResendStatus(`Error: ${result.error}`);
    } else {
      setResendStatus('Code sent!');
      setTimeout(() => setResendStatus(null), 3000);
    }
  };

  if (requiresOtp && email) {
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
            <h1 className={styles.title}>Verify your email</h1>
            <p className={styles.subtitle}>We sent a 6-digit code to {email}</p>
          </div>

          {verifyState?.error && (
            <div className={styles.errorAlert}>
              {verifyState.error}
            </div>
          )}

          <form className={styles.form} action={verifyAction}>
            <input type="hidden" name="email" value={email} />
            
            <div className={styles.inputGroup}>
              <label htmlFor="code">Verification Code</label>
              <input 
                type="text" 
                name="code" 
                id="code" 
                placeholder="123456" 
                maxLength={6}
                required 
                disabled={isVerifyPending} 
              />
            </div>

            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={isVerifyPending}>
              {isVerifyPending ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button 
              type="button" 
              onClick={handleResend}
              style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px' }}
            >
              {resendStatus || 'Resend Code'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
          <h1 className={styles.title}>Create an account</h1>
          <p className={styles.subtitle}>Get started with OneCV today</p>
        </div>

        {(signupState?.error || googleError) && (
          <div className={styles.errorAlert}>
            {signupState?.error || googleError}
          </div>
        )}

        <div
          ref={googleBtnRef}
          className={styles.googleBtnWrapper}
          style={{ pointerEvents: isGooglePending ? 'none' : 'auto', opacity: isGooglePending ? 0.6 : 1 }}
        />

        <div className={styles.divider}>or</div>

        <form className={styles.form} action={signupAction}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input type="text" name="username" id="username" placeholder="alexj" required disabled={isSignupPending || isGooglePending} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" placeholder="alex@example.com" required disabled={isSignupPending || isGooglePending} />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input type="password" name="password" id="password" placeholder="••••••••" required disabled={isSignupPending || isGooglePending} />
          </div>

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={isSignupPending || isGooglePending}>
            {isSignupPending ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link href="/login" className={styles.link}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
