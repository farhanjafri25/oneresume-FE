'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { analyzeResumeAction } from '@/app/actions/ai';
import ScoreGauge from '@/components/ScoreGauge/ScoreGauge';
import { AiReport, scoreColor, scoreVerdict, scoreHeadroom } from '@/lib/onboarding';
import { useLoadingPhases } from '@/lib/useLoadingPhases';
import { springs, transitions } from '@/lib/motion';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

const PHASES = [
  { delay: 0, text: 'Downloading your resume PDF…' },
  { delay: 2500, text: 'Parsing layout natively using advanced AI…' },
  { delay: 5500, text: 'Extracting skills and running ATS keyword checks…' },
  { delay: 9000, text: 'Structuring your match report…' },
];

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — score reveal (ms after report lands)
 *
 *   60ms   score shelf scales in (0.96 → 1); number counts up
 *  420ms   verdict + summary fade up
 *  720ms   skill groups rise; pills stagger (40ms each)
 * 1000ms   CTA fades up
 * ───────────────────────────────────────────────────────── */
const TIMING = {
  shelf: 60,    // tinted score shelf scales in
  verdict: 420, // verdict + summary fade up
  skills: 720,  // skill groups + staggered pills
  cta: 1000,    // primary CTA fades up
};

const SHELF = { initialScale: 0.96, spring: springs.smooth };
const PILLS = { stagger: 0.04, spring: springs.micro };

export default function EvaluationStep({ state, patch, next, back }: StepProps) {
  const report = state.report;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const startedRef = useRef(false);
  const phase = useLoadingPhases(PHASES, loading);

  const run = useCallback(async () => {
    if (!state.resumeId || !state.jd.trim()) {
      setError('Missing resume or job description. Please go back a step.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeResumeAction(state.resumeId, state.jd);
      if (result?.error) {
        setError(result.error);
      } else {
        patch({ report: result as AiReport });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.resumeId, state.jd]);

  // Kick off analysis once on mount if we don't already have a cached report.
  useEffect(() => {
    if (report || startedRef.current) return;
    startedRef.current = true;
    run();
  }, [report, run]);

  // Drive the staged reveal once the report is present.
  useEffect(() => {
    if (!report) return;
    setStage(0);
    const timers = [
      setTimeout(() => setStage(1), TIMING.shelf),
      setTimeout(() => setStage(2), TIMING.verdict),
      setTimeout(() => setStage(3), TIMING.skills),
      setTimeout(() => setStage(4), TIMING.cta),
    ];
    return () => timers.forEach(clearTimeout);
  }, [report]);

  if (loading) {
    return (
      <div className={styles.evalCard}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <h3 className={styles.loadingTitle}>Analyzing your resume</h3>
          <p className={styles.loadingSubtitle}>{phase}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.evalCard}>
        <div className={styles.errorAlert}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
        <div className={styles.btnRow}>
          <button type="button" className={styles.secondaryBtn} onClick={back}>
            <ArrowLeft size={16} />
            Back
          </button>
          <button type="button" className={styles.primaryBtn} onClick={() => { startedRef.current = true; run(); }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const color = scoreColor(report.score);

  return (
    <div className={styles.evalCard}>
      {/* Score + verdict — flat row, divided from the skills below. */}
      <motion.div
        className={styles.scoreRow}
        initial={{ opacity: 0, scale: SHELF.initialScale, y: 8 }}
        animate={{
          opacity: stage >= 1 ? 1 : 0,
          scale: stage >= 1 ? 1 : SHELF.initialScale,
          y: stage >= 1 ? 0 : 8,
        }}
        transition={SHELF.spring}
      >
        <ScoreGauge score={report.score} />
        <motion.div
          className={styles.scoreSummary}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 8 }}
          transition={transitions.base}
        >
          <h3 className={styles.verdict} style={{ color }}>{scoreVerdict(report.score)}</h3>
          <p className={styles.verdictSub}>{scoreHeadroom(report.score)}</p>
          <p className={styles.scoreBody}>{report.summary}</p>
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.skillsGrid}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 12 }}
        transition={transitions.base}
      >
        <div className={styles.skillsCol}>
          <h4 className={`${styles.skillsTitle} ${styles.matchingTitle}`}>
            <CheckCircle2 size={16} />
            Matching skills ({report.matchingSkills.length})
          </h4>
          <div className={styles.pills}>
            {report.matchingSkills.map((skill, i) => (
              <motion.span
                key={i}
                className={`${styles.pill} ${styles.matchingPill}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: stage >= 3 ? 1 : 0, scale: stage >= 3 ? 1 : 0.9 }}
                transition={{ ...PILLS.spring, delay: i * PILLS.stagger }}
              >
                <Check size={11} strokeWidth={3} />
                {skill}
              </motion.span>
            ))}
            {report.matchingSkills.length === 0 && (
              <p className={styles.emptyPills}>No exact skill matches detected yet.</p>
            )}
          </div>
        </div>

        <div className={styles.skillsCol}>
          <h4 className={`${styles.skillsTitle} ${styles.missingTitle}`}>
            <AlertCircle size={16} />
            Missing keywords ({report.missingSkills.length})
          </h4>
          <div className={styles.pills}>
            {report.missingSkills.map((skill, i) => (
              <motion.span
                key={i}
                className={`${styles.pill} ${styles.missingPill}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: stage >= 3 ? 1 : 0, scale: stage >= 3 ? 1 : 0.9 }}
                transition={{ ...PILLS.spring, delay: i * PILLS.stagger }}
              >
                <X size={11} strokeWidth={3} />
                {skill}
              </motion.span>
            ))}
            {report.missingSkills.length === 0 && (
              <p className={styles.emptyPills}>Awesome — no major missing keywords.</p>
            )}
          </div>
          {report.missingSkills.length > 0 && (
            <p className={styles.skillHint}>Weave these into your resume to lift your score.</p>
          )}
        </div>
      </motion.div>

      <motion.div
        className={styles.btnRow}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 8 }}
        transition={transitions.base}
      >
        <button type="button" className={styles.secondaryBtn} onClick={back}>
          <ArrowLeft size={16} />
          Edit job
        </button>
        <button type="button" className={styles.primaryBtn} onClick={next}>
          Build my resume
        </button>
      </motion.div>
    </div>
  );
}
