'use client';

import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { EASE_OUT_EXPO } from '@/lib/motion';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

/* Staged entrance — headline lands first, then subtitle, then CTA. */
const TIMING = { headline: 0.06, subtitle: 0.16, cta: 0.26 };

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE_OUT_EXPO, delay },
});

export default function WelcomeStep({ next, user }: StepProps) {
  return (
    <div className={styles.welcome}>
      <motion.h1 className={styles.welcomeTitle} {...rise(TIMING.headline)}>
        Let&rsquo;s set up your OneCV{user?.username ? `, ${user.username}` : ''}.
      </motion.h1>
      <motion.p className={styles.welcomeSubtitle} {...rise(TIMING.subtitle)}>
        Upload your CV, see how it scores against a real job, and ship a tailored
        version &mdash; in about 3 minutes.
      </motion.p>
      <motion.div {...rise(TIMING.cta)}>
        <button type="button" className={styles.primaryBtn} onClick={next}>
          Get started
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
}
