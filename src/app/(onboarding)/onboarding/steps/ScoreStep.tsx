'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, WarningCircle, Pulse, Layout, Sparkle, Phone } from '@phosphor-icons/react/dist/ssr';
import { generalScanResumeAction } from '@/app/actions/ai';
import ScoreGauge from '@/components/ScoreGauge/ScoreGauge';
import { AiReport, scoreColor, scoreVerdict, scoreHeadroom } from '@/lib/onboarding';
import { useLoadingPhases } from '@/lib/useLoadingPhases';
import { springs, transitions } from '@/lib/motion';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

const PHASES = [
  { delay: 0, text: 'Downloading your resume PDF…' },
  { delay: 2500, text: 'Parsing layout natively using advanced AI…' },
  { delay: 5500, text: 'Running ATS parsability and formatting checks…' },
  { delay: 9000, text: 'Structuring your score report…' },
];

/* Staged reveal once the report lands (ms after report is present). */
const TIMING = { shelf: 60, verdict: 420, metrics: 720, cta: 1000 };
const SHELF = { initialScale: 0.96, spring: springs.smooth };

export default function ScoreStep({ state, patch, next, back }: StepProps) {
  const report = state.report;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const startedRef = useRef(false);
  const phase = useLoadingPhases(PHASES, loading);

  const run = useCallback(async () => {
    if (!state.resumeId) {
      setError('Missing resume. Please go back and upload your CV.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generalScanResumeAction(state.resumeId);
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
  }, [state.resumeId]);

  // Kick off the scan once on mount unless we already have a cached report.
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
      setTimeout(() => setStage(3), TIMING.metrics),
      setTimeout(() => setStage(4), TIMING.cta),
    ];
    return () => timers.forEach(clearTimeout);
  }, [report]);

  if (loading) {
    return (
      <div className={styles.evalCard}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <h3 className={styles.loadingTitle}>Scoring your resume</h3>
          <p className={styles.loadingSubtitle}>{phase}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.evalCard}>
        <div className={styles.errorAlert}>
          <WarningCircle size={18} />
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
  const metrics = [
    { icon: Pulse, title: 'Parsability', value: report.parsability },
    { icon: Layout, title: 'Section formatting', value: report.formatting },
    { icon: Sparkle, title: 'Action verbs', value: report.actionVerbs },
    { icon: Phone, title: 'Contact information', value: report.missingContactInfo },
  ];

  return (
    <div className={styles.evalCard}>
      {/* Score + verdict */}
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

      {/* General-scan metric cards */}
      <motion.div
        className={styles.skillsGrid}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 12 }}
        transition={transitions.base}
      >
        {metrics.map(({ icon: Icon, title, value }) => (
          <div key={title} className={styles.skillsCol}>
            <h4 className={`${styles.skillsTitle} ${styles.matchingTitle}`}>
              <Icon size={16} />
              {title}
            </h4>
            <p className={styles.scoreBody}>{value || 'No issues detected.'}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        className={styles.btnRow}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 8 }}
        transition={transitions.base}
      >
        <button type="button" className={styles.secondaryBtn} onClick={back}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button type="button" className={styles.primaryBtn} onClick={next}>
          Get my link
        </button>
      </motion.div>
    </div>
  );
}
