'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, Copy, Download, Link2 } from 'lucide-react';
import { completeOnboardingAction } from '@/app/actions/onboarding';
import { buildTrackedLink, clearOnboarding } from '@/lib/onboarding';
import { slideUp } from '@/lib/motion';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

export default function ShareStep({ state, user }: StepProps) {
  const [label, setLabel] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const slug = state.variantSlug ?? '';
  const publicLink = buildTrackedLink(user.username, slug, '');
  const trackedLink = buildTrackedLink(user.username, slug, label);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const copy = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => setToast(message)).catch(() => {});
  };

  const finish = () => {
    setFinishing(true);
    clearOnboarding();
    // Server action sets the onecv_onboarded cookie and redirects to the dashboard.
    completeOnboardingAction({ redirectTo: '/dashboard' });
  };

  return (
    <div className={styles.shareCard}>
      <CheckCircle size={56} className={styles.successIcon} />
      <h2 className={styles.title} style={{ textAlign: 'center' }}>Your resume is live 🎉</h2>
      <p className={styles.subtitle} style={{ textAlign: 'center', margin: '0 auto 8px' }}>
        Share this link and watch views roll into your <strong>Analytics</strong> tab. Add a label to
        track exactly who you sent it to.
      </p>

      {/* Plain public link */}
      <div className={styles.linkTool}>
        <label className={styles.label}>Your public link</label>
        <div className={styles.linkRow}>
          <input className={styles.input} readOnly value={publicLink} />
          <button type="button" className={styles.copyBtn} onClick={() => copy(publicLink, 'Link copied to clipboard!')}>
            <Copy size={14} />
            Copy
          </button>
        </div>
      </div>

      {/* Tracked link */}
      <div className={styles.linkTool}>
        <label className={styles.label}>Create a tracked link</label>
        <div className={styles.linkRow}>
          <input
            className={styles.input}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Google-Frontend"
          />
          <button
            type="button"
            className={styles.copyBtn}
            onClick={() => copy(trackedLink, `Tracked link${label.trim() ? ` for "${label.trim()}"` : ''} copied!`)}
          >
            <Link2 size={14} />
            Copy
          </button>
        </div>
      </div>

      <div className={styles.btnRow} style={{ justifyContent: 'center', marginTop: 28 }}>
        {state.variantFileUrl && (
          <a
            href={state.variantFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryBtn}
          >
            <Download size={16} />
            Download PDF
          </a>
        )}
        <button type="button" className={styles.primaryBtn} onClick={finish} disabled={finishing}>
          {finishing ? 'Opening dashboard…' : 'Go to dashboard'}
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
