'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeSlash } from '@phosphor-icons/react/dist/ssr';
import { signupUser, loginWithGoogle, verifyOtpAction, resendOtpAction } from '@/app/actions/auth';
import Button from '@/components/Button/Button';
import { transitions } from '@/lib/motion';
import { getAuthErrorState } from '../authErrorState';
import { getGoogleIdentity } from '../googleIdentity';
import styles from '../login/page.module.css';

function LegalBar() {
  return (
    <div className={styles.legalBar}>
      By continuing, you agree to our{' '}
      <Link href="/terms" className={styles.legalLink}>Terms of Service</Link> and{' '}
      <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>.
    </div>
  );
}

export default function SignupPage() {
  const [signupState, signupAction, isSignupPending] = useActionState(signupUser, null);
  const [verifyState, verifyAction, isVerifyPending] = useActionState(verifyOtpAction, null);

  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const requiresOtp = signupState?.requiresOtp;
  const email = signupState?.email;
  const { alertError, credentialFieldsInvalid } = getAuthErrorState({
    formError: signupState?.error,
    googleError,
  });

  useEffect(() => {
    if (requiresOtp) return; // Don't init google signin on OTP screen

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
            <h1 className={styles.title}>Verify your email</h1>
            <p className={styles.subtitle}>We sent a 6-digit code to {email}</p>
          </div>

          {verifyState?.error && (
            <div className={styles.errorAlert} role="alert">
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
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                aria-invalid={!!verifyState?.error}
                required
                disabled={isVerifyPending}
              />
            </div>

            <Button type="submit" className={styles.submitBtn} disabled={isVerifyPending}>
              {isVerifyPending ? 'Verifying...' : 'Verify email'}
            </Button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Button variant="ghost" size="sm" onClick={handleResend}>
              {resendStatus || 'Resend code'}
            </Button>
          </div>
        </motion.div>

        <LegalBar />
      </div>
    );
  }

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
          <h1 className={styles.title}>Create an account</h1>
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

        <form className={styles.form} action={signupAction}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="alexj"
              autoComplete="username"
              spellCheck={false}
              aria-invalid={credentialFieldsInvalid}
              required
              disabled={isSignupPending || isGooglePending}
            />
          </div>

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
              disabled={isSignupPending || isGooglePending}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={credentialFieldsInvalid}
                required
                disabled={isSignupPending || isGooglePending}
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

          <Button type="submit" className={styles.submitBtn} disabled={isSignupPending || isGooglePending}>
            {isSignupPending ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link href="/login" className={styles.link}>Sign in</Link>
        </p>
      </motion.div>

      <LegalBar />
    </div>
  );
}
