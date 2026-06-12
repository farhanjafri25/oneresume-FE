'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import {
  Sparkle, PaperPlaneTilt, CheckCircle, WarningCircle, BookOpen, ListChecks, Check, X, FileText, Pulse, Layout, Phone } from '@phosphor-icons/react/dist/ssr';
import { analyzeResumeAction, generalScanResumeAction } from '@/app/actions/ai';
import Button from '@/components/Button/Button';
import ScoreGauge from '@/components/ScoreGauge/ScoreGauge';
import Tabs from '@/components/Tabs/Tabs';
import { useLoadingPhases } from '@/lib/useLoadingPhases';
import styles from './AiReview.module.css';

interface AiReviewClientProps {
  resumeId: string;
}

interface AiReport {
  score: number;
  summary: string;
  // Targeted fields
  matchingSkills?: string[];
  missingSkills?: string[];
  recommendations?: string[];
  // General scan fields
  parsability?: string;
  formatting?: string;
  actionVerbs?: string;
  missingContactInfo?: string;
  keywordReadiness?: string;
  keyImprovements?: string[];
}

type ScanMode = 'targeted' | 'general';

const SCAN_TABS = [
  { id: 'targeted', label: 'Targeted Match' },
  { id: 'general', label: 'General Scan' },
];

// Dynamic status update messages during AI processing
const LOADING_PHASES = [
  { delay: 0, text: 'Downloading resume PDF from storage...' },
  { delay: 2500, text: 'Parsing layout natively using advanced AI...' },
  { delay: 5500, text: 'Extracting skills and performing ATS keyword checks...' },
  { delay: 9000, text: 'Structuring optimization report and interactive checklist...' }
];

export default function AiReviewClient({ resumeId }: AiReviewClientProps) {
  const router = useRouter();
  const [scanMode, setScanMode] = useState<ScanMode>('targeted');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AiReport | null>(null);
  const loadingPhase = useLoadingPhases(LOADING_PHASES, loading);

  const selectScanMode = (mode: string) => {
    setScanMode(mode as ScanMode);
    setReport(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (scanMode === 'targeted' && !jd.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      let result;
      if (scanMode === 'targeted') {
        result = await analyzeResumeAction(resumeId, jd);
      } else {
        result = await generalScanResumeAction(resumeId);
      }

      if (result.error) {
        setError(result.error);
      } else {
        setReport(result);
      }
    } catch (err: any) {
      setError(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Word counting logic
  const wordCount = jd.trim() === '' ? 0 : jd.trim().split(/\s+/).length;
  const charCount = jd.length;

  return (
    <div className={styles.workspace}>
      {/* LEFT SIDE: Inputs */}
      <div className={styles.panel}>
        
        {/* Scan mode toggle */}
        <div className={styles.scanToggle}>
          <Tabs
            items={SCAN_TABS}
            activeId={scanMode}
            onTabClick={selectScanMode}
            ariaLabel="Scan mode"
          />
        </div>

        {scanMode === 'targeted' ? (
          <>
            <div className={styles.panelTitle}>
              <Sparkle size={20} style={{ color: 'var(--primary)' }} />
              Job Description
            </div>
            <p className={styles.panelSubtitle}>
              Paste the details of the job you're aiming for. We will analyze keywords, alignment, and ATS match score.
            </p>

            <div className={styles.textareaWrapper}>
              <textarea
                className={styles.textarea}
                placeholder="Paste Job Description (JD) here... E.g., 'We are looking for a Senior React Engineer with 4 years of experience, skilled in Next.js, TypeScript, and AWS deployment...'"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                disabled={loading}
              />
              <div className={styles.textareaCounter}>
                <span>{wordCount} words | {charCount} chars</span>
                {jd && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setJd('')}
                    disabled={loading}
                  >
                    Clear text
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.panelTitle}>
              <Pulse size={20} style={{ color: 'var(--primary)' }} />
              General ATS Scan
            </div>
            <p className={styles.panelSubtitle}>
              Run a baseline check on your resume's parsability, structure, action verbs, and overall formatting without a specific Job Description.
            </p>
            <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Checks Section Formatting</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Analyzes Action Verbs Usage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Validates Contact Info Detection</span>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className={styles.errorAlert}>
            <WarningCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <Button
          fullWidth
          loading={loading}
          onClick={handleAnalyze}
          disabled={scanMode === 'targeted' && !jd.trim()}
          style={{ marginTop: 'auto' }}
        >
          {!loading && <PaperPlaneTilt size={16} />}
          {loading ? 'Analyzing…' : scanMode === 'targeted' ? 'Analyze CV alignment' : 'Run general ATS scan'}
        </Button>
      </div>

      {/* RIGHT SIDE: Output Dashboard */}
      <div className={styles.panel}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <h3 className={styles.loadingTitle}>Analyzing Your Resume</h3>
            <p className={styles.loadingSubtitle}>{loadingPhase}</p>
          </div>
        ) : report ? (
          <div className={styles.reportCard}>
            {/* Scorecard Header & Gauge */}
            <div className={styles.scoreSummarySection}>
              <ScoreGauge score={report.score} />

              <div className={styles.summaryTextContent}>
                <h3 className={styles.summaryHeadline}>Executive Match Summary</h3>
                <p className={styles.summaryBody}>{report.summary}</p>
              </div>
            </div>

            {/* Conditionally render Targeted Match or General Scan results */}
            {report.matchingSkills ? (
              <>
                {/* Skills columns */}
                <div className={styles.skillsGrid}>
                  <div className={styles.skillsColumn}>
                    <h4 className={`${styles.skillsColumnTitle} ${styles.matchingTitle}`}>
                      <CheckCircle size={16} />
                      Matching Skills ({report.matchingSkills.length})
                    </h4>
                    <div className={styles.pillContainer}>
                      {report.matchingSkills.map((skill, idx) => (
                        <span key={idx} className={`${styles.pill} ${styles.matchingPill}`}>
                          <Check size={11} weight="bold" />
                          {skill}
                        </span>
                      ))}
                      {report.matchingSkills.length === 0 && (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>No exact skill matches detected yet.</p>
                      )}
                    </div>
                  </div>

                  <div className={styles.skillsColumn}>
                    <h4 className={`${styles.skillsColumnTitle} ${styles.missingTitle}`}>
                      <WarningCircle size={16} />
                      Missing Keywords ({report.missingSkills!.length})
                    </h4>
                    <div className={styles.pillContainer}>
                      {report.missingSkills!.map((skill, idx) => (
                        <span key={idx} className={`${styles.pill} ${styles.missingPill}`}>
                          <X size={11} weight="bold" />
                          {skill}
                        </span>
                      ))}
                      {report.missingSkills!.length === 0 && (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Awesome! No major missing keywords.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Actionable Recommendations Checklist */}
                <div className={styles.recommendationsSection}>
                  <h4 className={styles.recommendationsTitle}>
                    <ListChecks size={18} style={{ color: 'var(--primary)' }} />
                    Optimize Your Resume (Action Items)
                  </h4>
                  <div className={styles.checklist}>
                    {report.recommendations!.map((recommendation, idx) => {
                      return (
                        <div 
                          key={idx} 
                          className={styles.checklistItem}
                        >
                          <span className={styles.checklistText}>
                            {recommendation}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* General Scan Metrics */}
                <div className={styles.skillsGrid}>
                  <div className={styles.skillsColumn}>
                    <h4 className={`${styles.skillsColumnTitle} ${styles.matchingTitle}`} style={{ color: 'var(--text-primary)' }}>
                      <Pulse size={16} />
                      Parsability Status
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {report.parsability}
                    </p>
                  </div>
                  <div className={styles.skillsColumn}>
                    <h4 className={`${styles.skillsColumnTitle} ${styles.matchingTitle}`} style={{ color: 'var(--text-primary)' }}>
                      <Layout size={16} />
                      Section Formatting
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {report.formatting}
                    </p>
                  </div>
                </div>

                <div className={styles.skillsGrid} style={{ marginTop: '24px' }}>
                  <div className={styles.skillsColumn}>
                    <h4 className={`${styles.skillsColumnTitle} ${styles.matchingTitle}`} style={{ color: 'var(--text-primary)' }}>
                      <Sparkle size={16} />
                      Action Verbs
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {report.actionVerbs}
                    </p>
                  </div>
                  <div className={styles.skillsColumn}>
                    <h4 className={`${styles.skillsColumnTitle} ${styles.matchingTitle}`} style={{ color: 'var(--text-primary)' }}>
                      <Phone size={16} />
                      Contact Information
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {report.missingContactInfo}
                    </p>
                  </div>
                </div>

                {report.keywordReadiness && (
                  <div className={styles.skillsGrid} style={{ marginTop: '24px' }}>
                    <div className={styles.skillsColumn} style={{ gridColumn: 'span 2' }}>
                      <h4 className={`${styles.skillsColumnTitle} ${styles.matchingTitle}`} style={{ color: 'var(--text-primary)' }}>
                        <BookOpen size={16} />
                        Keyword Readiness
                      </h4>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {report.keywordReadiness}
                      </p>
                    </div>
                  </div>
                )}

                {report.keyImprovements && report.keyImprovements.length > 0 && (
                  <div className={styles.recommendationsSection} style={{ marginTop: '32px' }}>
                    <h4 className={styles.recommendationsTitle}>
                      <ListChecks size={18} style={{ color: 'var(--primary)' }} />
                      Key Improvements (Action Items)
                    </h4>
                    <div className={styles.checklist}>
                      {report.keyImprovements.map((improvement, idx) => (
                        <div key={idx} className={styles.checklistItem}>
                          <span className={styles.checklistText}>
                            {improvement}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {scanMode === 'targeted' && (
              <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <Button
                  onClick={() => {
                    sessionStorage.setItem('shared_jd', jd);
                    router.push(`/dashboard/ai-builder/${resumeId}`);
                  }}
                >
                  <Sparkle size={18} />
                  Generate AI resume from this JD
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyReport}>
            <FileText size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Ready for Alignment Scan</h3>
            <p className={styles.emptyDesc}>
              Enter a Job Description on the left and click "Analyze CV Alignment" to trigger the AI scanner.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
