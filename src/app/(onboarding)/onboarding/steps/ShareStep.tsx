'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, Copy } from 'lucide-react';
import { completeOnboardingAction } from '@/app/actions/onboarding';
import { buildTrackedLink, clearOnboarding } from '@/lib/onboarding';
import { slideUp } from '@/lib/motion';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

export default function ShareStep({ state, user }: StepProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const publicLink = buildTrackedLink(user.username, state.slug ?? '');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const copy = () => {
    navigator.clipboard
      .writeText(publicLink)
      .then(() => setToast('Link copied to clipboard!'))
      .catch(() => {});
  };

  const finish = () => {
    setFinishing(true);
    clearOnboarding();
    // Persists onboarding completion server-side and lands the user on their analytics page.
    completeOnboardingAction({
      redirectTo: `/dashboard/analytics/${state.resumeId}?welcome=1`,
    });
  };

  return (
    <div className={styles.shareCard}>
      <CheckCircle size={56} className={styles.successIcon} />
      <h2 className={styles.title} style={{ textAlign: 'center' }}>Your resume is live 🎉</h2>
      <p className={styles.subtitle} style={{ textAlign: 'center', margin: '0 auto 8px' }}>
        Share this link with recruiters &mdash; every view lands in your <strong>Analytics</strong>.
      </p>

      {/* Pre-generated public link — copy only */}
      <div className={styles.linkTool}>
        <label className={styles.label}>Your shareable link</label>
        <div className={styles.linkRow}>
          <input className={styles.input} readOnly value={publicLink} />
          <button type="button" className={styles.copyBtn} onClick={copy}>
            <Copy size={14} />
            Copy
          </button>
        </div>
      </div>

      <div className={styles.btnRow} style={{ justifyContent: 'center', marginTop: 28 }}>
        <button type="button" className={styles.primaryBtn} onClick={finish} disabled={finishing}>
          {finishing ? 'Opening analytics…' : 'See my analytics'}
        </button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div className={styles.toast} variants={slideUp} initial="hidden" animate="visible" exit="exit">
            <CheckCircle size={16} style={{ color: 'var(--primary)' }} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
