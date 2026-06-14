'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  ArrowRight,
  Brain,
  ChartBar,
  CheckCircle,
  Copy,
  Sparkle,
  Target,
} from '@phosphor-icons/react/dist/ssr';
import { completeOnboardingAction } from '@/app/actions/onboarding';
import { buildTrackedLink, clearOnboarding } from '@/lib/onboarding';
import { fadeUp, staggerContainer } from '@/lib/motion';
import Button from '@/components/Button/Button';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

export default function ShareStep({ state, user }: StepProps) {
  const [navigating, setNavigating] = useState(false);

  const publicLink = buildTrackedLink(user.username, state.slug ?? '');

  // The product's core actions, mirroring the resume card's action bar so the
  // dashboard feels familiar on arrival. Each tile deep-links into its feature.
  const features = [
    {
      icon: Brain,
      title: 'AI Match Reviewer',
      description: 'Score your resume against any job description.',
      href: `/dashboard/ai-review/${state.resumeId}`,
    },
    {
      icon: Sparkle,
      title: 'AI Tailor & Build',
      description: 'Auto-tailor your resume to a specific role.',
      href: `/dashboard/ai-builder/${state.resumeId}`,
    },
    {
      icon: ChartBar,
      title: 'Track views',
      description: 'See real-time analytics when recruiters open it.',
      href: `/dashboard/analytics/${state.resumeId}`,
    },
    {
      icon: Target,
      title: 'Per-application links',
      description: 'Create a unique tracking link per application from your dashboard.',
      href: `/dashboard?welcome=1`,
    },
  ];

  const copy = () => {
    navigator.clipboard
      .writeText(publicLink)
      .then(() => toast.success('Link copied to clipboard!'))
      .catch(() => toast.error("Couldn't copy link. Please try again."));
  };

  // Persists onboarding completion server-side and then server-redirects. Both
  // the CTA and the feature tiles route through here so onboarding is always
  // marked complete (and local state cleared) before leaving this step. If the
  // completion call fails, surface it and let the user retry rather than leaving
  // them stuck on a spinning button.
  const goTo = async (redirectTo: string) => {
    setNavigating(true);
    clearOnboarding();
    try {
      await completeOnboardingAction({ redirectTo });
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      toast.error("Couldn't open your dashboard. Please try again.");
      setNavigating(false);
    }
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
          <Button className={styles.copyBtn} onClick={copy}>
            <Copy size={14} />
            Copy
          </Button>
        </div>
      </div>

      {state.resumeId && (
        <div className={styles.nextSection}>
          <p className={styles.nextHeading}>What you can do next</p>
          <motion.div
            className={styles.featureGrid}
            variants={staggerContainer(0.06)}
            initial="hidden"
            animate="visible"
          >
            {features.map((f) => (
              <motion.button
                key={f.title}
                type="button"
                variants={fadeUp}
                className={styles.featureCard}
                onClick={() => goTo(f.href)}
                disabled={navigating}
                aria-label={`${f.title} — ${f.description}`}
              >
                <span className={styles.featureIcon}>
                  <f.icon size={18} />
                </span>
                <span className={styles.featureTitle}>
                  {f.title}
                  <ArrowRight size={13} weight="bold" className={styles.featureArrow} />
                </span>
                <span className={styles.featureDesc}>{f.description}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      <div className={styles.btnRow} style={{ justifyContent: 'center', marginTop: 28 }}>
        <Button onClick={() => goTo('/dashboard?welcome=1')} loading={navigating}>
          {navigating ? 'Opening dashboard…' : 'Go to dashboard'}
        </Button>
      </div>
    </div>
  );
}
