'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { User } from '@/types';
import {
  INITIAL_ONBOARDING, OnboardingState, OnboardingStepKey,
  RAIL_STEPS, STEP_ORDER, loadOnboarding, saveOnboarding,
} from '@/lib/onboarding';
import { fadeUp } from '@/lib/motion';
import styles from './Onboarding.module.css';
import OnboardingHeader from './OnboardingHeader';
import UploadStep from './steps/UploadStep';
import ScoreStep from './steps/ScoreStep';

export default function OnboardingWizard({ user }: { user: User }) {
  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setState(loadOnboarding()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) saveOnboarding(state); }, [state, hydrated]);

  const patch = (p: Partial<OnboardingState>) => setState((s) => ({ ...s, ...p }));
  const go = (step: OnboardingStepKey) => patch({ step });
  const next = () => go(STEP_ORDER[Math.min(STEP_ORDER.length - 1, STEP_ORDER.indexOf(state.step) + 1)]);
  const back = () => go(STEP_ORDER[Math.max(0, STEP_ORDER.indexOf(state.step) - 1)]);

  // Avoid hydration flash: render nothing until sessionStorage is read.
  if (!hydrated) return null;

  const stepProps = { state, patch, next, back, user };
  const railIndex = RAIL_STEPS.findIndex((r) => r.key === state.step);

  return (
    <div className={styles.shell}>
      <OnboardingHeader user={user} railIndex={railIndex} />

      <div className={styles.stage}>
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={styles.stageInner}
          >
            {state.step === 'upload' && <UploadStep {...stepProps} />}
            {state.step === 'score'  && <ScoreStep {...stepProps} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
