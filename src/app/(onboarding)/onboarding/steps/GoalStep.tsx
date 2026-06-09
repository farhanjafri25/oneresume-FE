'use client';

import { ArrowLeft } from 'lucide-react';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

const EXPERIENCE_OPTIONS = [
  'Student / New grad',
  '0–2 years',
  '3–5 years',
  '6–10 years',
  '10+ years',
];

export default function GoalStep({ state, patch, next, back }: StepProps) {
  const canContinue = state.targetRole.trim().length > 0;

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>What role are you targeting?</h2>
      <p className={styles.subtitle}>
        We&rsquo;ll use this to sharpen your match score and pre-fill your tailored resume.
      </p>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="targetRole">Target role</label>
        <input
          id="targetRole"
          className={styles.input}
          placeholder="e.g. Senior Frontend Engineer"
          value={state.targetRole}
          onChange={(e) => patch({ targetRole: e.target.value })}
          autoFocus
        />
        <span className={styles.helper}>
          Be specific &mdash; &ldquo;Senior Frontend Engineer&rdquo; gives a sharper match than &ldquo;Engineer&rdquo;.
        </span>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="experience">Experience level</label>
        <select
          id="experience"
          className={styles.select}
          value={state.experience}
          onChange={(e) => patch({ experience: e.target.value })}
        >
          <option value="">Select experience…</option>
          {EXPERIENCE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className={styles.btnRow}>
        <button type="button" className={styles.secondaryBtn} onClick={back}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={next}
          disabled={!canContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
