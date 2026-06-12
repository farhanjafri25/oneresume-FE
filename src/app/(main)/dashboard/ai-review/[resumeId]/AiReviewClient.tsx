'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { 
  Sparkle, PaperPlaneTilt, CheckCircle, WarningCircle, BookOpen, ListChecks, Check, X, FileText, Pulse, Layout, Phone } from '@phosphor-icons/react/dist/ssr';
import { analyzeResumeAction, generalScanResumeAction } from '@/app/actions/ai';
import ScoreGauge from '@/components/ScoreGauge/ScoreGauge';
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
}

// Dynamic status update messages during AI processing
const LOADING_PHASES = [
  { delay: 0, text: 'Downloading resume PDF from storage...' },
  { delay: 2500, text: 'Parsing layout natively using advanced AI...' },
  { delay: 5500, text: 'Extracting skills and performing ATS keyword checks...' },
  { delay: 9000, text: 'Structuring optimization report and interactive checklist...' }
];

export default function AiReviewClient({ resumeId }: AiReviewClientProps) {
  const router = useRouter();
  const [scanMode, setScanMode] = useState<'targeted' | 'general'>('targeted');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AiReport | null>(null);
  const loadingPhase = useLoadingPhases(LOADING_PHASES, loading);

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
        
        {/* Toggle Mode */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px' }}>
          <button 
            style={{ flex: 1, padding: '8px 0', borderRadius: '6px', fontSize: '14px', fontWeight: 500, background: scanMode === 'targeted' ? 'var(--bg-card)' : 'transparent', color: scanMode === 'targeted' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: scanMode === 'targeted' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => { setScanMode('targeted'); setReport(null); setError(null); }}
          >
            Targeted Match
          </button>
          <button 
            style={{ flex: 1, padding: '8px 0', borderRadius: '6px', fontSize: '14px', fontWeight: 500, background: scanMode === 'general' ? 'var(--bg-card)' : 'transparent', color: scanMode === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: scanMode === 'general' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => { setScanMode('general'); setReport(null); setError(null); }}
          >
            General Scan
          </button>
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
                  <button 
                    type="button" 
                    className={styles.clearBtn} 
                    onClick={() => setJd('')}
                    disabled={loading}
                  >
                    Clear text
                  </button>
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

        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleAnalyze}
          disabled={loading || (scanMode === 'targeted' && !jd.trim())}
          style={{ marginTop: 'auto' }}
        >
          <PaperPlaneTilt size={16} />
          {loading ? 'Analyzing...' : scanMode === 'targeted' ? 'Analyze CV Alignment' : 'Run General ATS Scan'}
        </button>
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
              </>
            )}

            {scanMode === 'targeted' && (
              <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <button 
                  type="button" 
                  className={styles.actionBtn} 
                  onClick={() => {
                    sessionStorage.setItem('shared_jd', jd);
                    router.push(`/dashboard/ai-builder/${resumeId}`);
                  }}
                  style={{ display: 'inline-flex', width: 'auto', padding: '12px 24px', fontSize: '15px' }}
                >
                  <Sparkle size={18} style={{ marginRight: '8px' }} />
                  Generate AI Resume from this JD
                </button>
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
