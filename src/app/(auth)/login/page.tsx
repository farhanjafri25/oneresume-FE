'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeSlash } from '@phosphor-icons/react/dist/ssr';
import {
  checkEmailExists,
  loginUser,
  signupUser,
  verifyOtpAction,
  resendOtpAction,
  loginWithGoogle,
} from '@/app/actions/auth';
import Button from '@/components/Button/Button';
import { transitions } from '@/lib/motion';
import { getAuthErrorState } from '../authErrorState';
import { getGoogleIdentity } from '../googleIdentity';
import styles from './page.module.css';

type Step = 'email' | 'password' | 'signup';

type EmailRowProps = {
  email: string;
  onChangeEmail: () => void;
};

function EmailRow({ email, onChangeEmail }: EmailRowProps) {
  return (
    <div className={styles.emailRow}>
      <span className={styles.emailValue}>{email}</span>
      <button type="button" className={styles.changeEmail} onClick={onChangeEmail}>
        Change
      </button>
    </div>
  );
}

function LegalBar() {
  return (
    <div className={styles.legalBar}>
      By continuing, you agree to our{' '}
      <Link href="/terms" className={styles.legalLink}>Terms of Service</Link> and{' '}
      <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>.
    </div>
  );
}

type PasswordStepProps = {
  email: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  onChangeEmail: () => void;
};

function PasswordStep({
  email,
  showPassword,
  onTogglePassword,
  onChangeEmail,
}: PasswordStepProps) {
  const [loginState, loginAction, isLoginPending] = useActionState(loginUser, null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { alertError: loginAlert, credentialFieldsInvalid: loginInvalid } = getAuthErrorState({
    formError: loginState?.error,
  });

  // Focus is a DOM synchronization side effect when the password step appears.
  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome back</h1>
      </div>

      {loginAlert && (
        <div className={styles.errorAlert} role="alert">{loginAlert}</div>
      )}

      <EmailRow email={email} onChangeEmail={onChangeEmail} />

      <form className={styles.form} action={loginAction}>
        <input type="hidden" name="email" value={email} />

        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <div className={styles.passwordWrapper}>
            <input
              ref={passwordInputRef}
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={loginInvalid}
              required
              disabled={isLoginPending}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={onTogglePassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <Button type="submit" className={styles.submitBtn} disabled={isLoginPending}>
          {isLoginPending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </>
  );
}

type SignupStepProps = {
  email: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  onChangeEmail: () => void;
};

function SignupStep({
  email,
  showPassword,
  onTogglePassword,
  onChangeEmail,
}: SignupStepProps) {
  const [signupState, signupAction, isSignupPending] = useActionState(signupUser, null);
  const { alertError: signupAlert, credentialFieldsInvalid: signupInvalid } = getAuthErrorState({
    formError: signupState?.error,
  });

  if (signupState?.requiresOtp) {
    return <OtpStep email={signupState.email || email} />;
  }

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Create your account</h1>
      </div>

      {signupAlert && (
        <div className={styles.errorAlert} role="alert">{signupAlert}</div>
      )}

      <EmailRow email={email} onChangeEmail={onChangeEmail} />

      <form className={styles.form} action={signupAction}>
        <input type="hidden" name="email" value={email} />

        <div className={styles.inputGroup}>
          <label htmlFor="username">Name</label>
          <input
            type="text"
            name="username"
            id="username"
            placeholder="Alex Johnson"
            autoComplete="name"
            spellCheck={false}
            aria-invalid={signupInvalid}
            required
            disabled={isSignupPending}
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
              aria-invalid={signupInvalid}
              required
              disabled={isSignupPending}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={onTogglePassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <Button type="submit" className={styles.submitBtn} disabled={isSignupPending}>
          {isSignupPending ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>
    </>
  );
}

type OtpStepProps = {
  email: string;
};

function OtpStep({ email }: OtpStepProps) {
  const [verifyState, verifyAction, isVerifyPending] = useActionState(verifyOtpAction, null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

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

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Verify your email</h1>
        <p className={styles.subtitle}>We sent a 6-digit code to {email}</p>
      </div>

      {verifyState?.error && (
        <div className={styles.errorAlert} role="alert">{verifyState.error}</div>
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
    </>
  );
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Render the Google button only while on the email step.
  useEffect(() => {
    if (step !== 'email') return;

    let rendered = false;
    let checkInterval: ReturnType<typeof setInterval> | undefined;

    const init = () => {
      if (rendered) return;
      const google = getGoogleIdentity();
      if (google?.accounts?.id && googleBtnRef.current) {
        rendered = true;

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

    init();
    if (!rendered) checkInterval = setInterval(init, 500);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isChecking) return;

    setCheckError(null);
    setIsChecking(true);
    const result = await checkEmailExists(email);
    setIsChecking(false);

    if (result?.error) {
      setCheckError(result.error);
      return;
    }

    setShowPassword(false);
    setStep(result.exists ? 'password' : 'signup');
  };

  const handleChangeEmail = () => {
    setShowPassword(false);
    setCheckError(null);
    setStep('email');
  };

  const { alertError: emailAlert } = getAuthErrorState({
    formError: checkError,
    googleError,
  });

  const renderStep = () => {
    switch (step) {
      case 'password':
        return (
          <PasswordStep
            key={email}
            email={email}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((v) => !v)}
            onChangeEmail={handleChangeEmail}
          />
        );

      case 'signup':
        return (
          <SignupStep
            key={email}
            email={email}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((v) => !v)}
            onChangeEmail={handleChangeEmail}
          />
        );

      case 'email':
      default:
        return (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Welcome</h1>
              <p className={styles.subtitle}>Sign in or create your account</p>
            </div>

            {emailAlert && (
              <div className={styles.errorAlert} role="alert">{emailAlert}</div>
            )}

            <div
              ref={googleBtnRef}
              className={styles.googleBtnWrapper}
              style={{ pointerEvents: isGooglePending ? 'none' : 'auto', opacity: isGooglePending ? 0.6 : 1 }}
            />

            <div className={styles.divider}>or</div>

            <form className={styles.form} onSubmit={handleEmailSubmit}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(checkError)}
                  required
                  disabled={isChecking || isGooglePending}
                />
              </div>

              <Button type="submit" className={styles.submitBtn} disabled={isChecking || isGooglePending}>
                {isChecking ? 'Checking...' : 'Continue'}
              </Button>
            </form>
          </>
        );
    }
  };

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
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transitions.base}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <LegalBar />
    </div>
  );
}
