'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { User } from '@/types';
import {
  INITIAL_ONBOARDING, OnboardingState, OnboardingStepKey,
  RAIL_STEPS, loadOnboarding, saveOnboarding,
} from '@/lib/onboarding';
import { fadeUp } from '@/lib/motion';
import styles from './Onboarding.module.css';
import OnboardingHeader from './OnboardingHeader';
import WelcomeStep from './steps/WelcomeStep';
import GoalStep from './steps/GoalStep';
import UploadStep from './steps/UploadStep';
import JobStep from './steps/JobStep';
import EvaluationStep from './steps/EvaluationStep';
import VariantStep from './steps/VariantStep';
import ShareStep from './steps/ShareStep';

const ORDER: OnboardingStepKey[] =
  ['welcome', 'goal', 'upload', 'job', 'evaluation', 'variant', 'share'];

export default function OnboardingWizard({ user }: { user: User }) {
  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setState(loadOnboarding()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) saveOnboarding(state); }, [state, hydrated]);

  const patch = (p: Partial<OnboardingState>) => setState((s) => ({ ...s, ...p }));
  const go = (step: OnboardingStepKey) => patch({ step });
  const next = () => go(ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(state.step) + 1)]);
  const back = () => go(ORDER[Math.max(0, ORDER.indexOf(state.step) - 1)]);

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
            {state.step === 'welcome'    && <WelcomeStep {...stepProps} />}
            {state.step === 'goal'       && <GoalStep {...stepProps} />}
            {state.step === 'upload'     && <UploadStep {...stepProps} />}
            {state.step === 'job'        && <JobStep {...stepProps} />}
            {state.step === 'evaluation' && <EvaluationStep {...stepProps} />}
            {state.step === 'variant'    && <VariantStep {...stepProps} />}
            {state.step === 'share'      && <ShareStep {...stepProps} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
