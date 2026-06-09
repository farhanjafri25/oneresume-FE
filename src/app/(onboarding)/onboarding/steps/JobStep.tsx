'use client';

import { ArrowLeft } from 'lucide-react';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

export default function JobStep({ state, patch, next, back }: StepProps) {
  const jd = state.jd;
  const wordCount = jd.trim() === '' ? 0 : jd.trim().split(/\s+/).length;
  const role = state.targetRole.trim() || 'a role';

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Paste a job you&rsquo;re targeting</h2>
      <p className={styles.subtitle}>
        We&rsquo;ll compare your CV against this post and score how well you fit. Paste the whole
        post &mdash; responsibilities <em>and</em> requirements &mdash; for the most accurate score.
      </p>

      <div className={styles.fieldGroup}>
        <textarea
          className={styles.textarea}
          placeholder={`Paste the full job post for ${role} you're targeting — responsibilities, requirements, and skills…`}
          value={jd}
          onChange={(e) => patch({ jd: e.target.value })}
          autoFocus
        />
        <div className={styles.counter}>
          <span>{wordCount} words · {jd.length} chars</span>
          {jd && (
            <button type="button" className={styles.clearBtn} onClick={() => patch({ jd: '' })}>
              Clear
            </button>
          )}
        </div>
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
          disabled={!jd.trim()}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
