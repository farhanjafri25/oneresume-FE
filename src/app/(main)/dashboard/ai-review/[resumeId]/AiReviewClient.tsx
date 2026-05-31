'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  ListTodo, 
  Check, 
  X,
  FileText
} from 'lucide-react';
import { analyzeResumeAction } from '@/app/actions/ai';
import styles from './AiReview.module.css';

interface AiReviewClientProps {
  resumeId: string;
}

interface AiReport {
  score: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

export default function AiReviewClient({ resumeId }: AiReviewClientProps) {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('Downloading PDF resume...');
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AiReport | null>(null);
  const [checkedRecommendations, setCheckedRecommendations] = useState<Record<number, boolean>>({});

  // Dynamic status update messages during AI processing
  useEffect(() => {
    if (!loading) return;

    const phases = [
      { delay: 0, text: 'Downloading resume PDF from storage...' },
      { delay: 2500, text: 'Parsing layout natively using Gemini 2.5 Flash...' },
      { delay: 5500, text: 'Extracting skills and performing ATS keyword checks...' },
      { delay: 9000, text: 'Structuring optimization report and interactive checklist...' }
    ];

    const timers = phases.map((phase) => 
      setTimeout(() => {
        setLoadingPhase(phase.text);
      }, phase.delay)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [loading]);

  const handleAnalyze = async () => {
    if (!jd.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setCheckedRecommendations({});

    try {
      const result = await analyzeResumeAction(resumeId, jd);
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

  const toggleRecommendation = (index: number) => {
    setCheckedRecommendations((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Word counting logic
  const wordCount = jd.trim() === '' ? 0 : jd.trim().split(/\s+/).length;
  const charCount = jd.length;

  // Circular gauge score parameters
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 50) return '#f59e0b'; // Amber/Orange
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High Fit';
    if (score >= 50) return 'Medium Fit';
    return 'Weak Fit';
  };

  const getScoreShadow = (score: number) => {
    const color = getScoreColor(score);
    return `drop-shadow(0 0 8px ${color}40)`;
  };

  // SVG Gauge specifications (140px diameter, radius=56, circumference=351.85)
  const radius = 56;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = report ? circumference - (report.score / 100) * circumference : circumference;

  return (
    <div className={styles.workspace}>
      {/* LEFT SIDE: Inputs */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>
          <Sparkles size={20} style={{ color: '#a855f7' }} />
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

        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleAnalyze}
          disabled={loading || !jd.trim()}
        >
          <Send size={16} />
          {loading ? 'Analyzing...' : 'Analyze CV Alignment'}
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
              <div className={styles.gaugeContainer}>
                <svg className={styles.gaugeSvg}>
                  <circle
                    className={styles.gaugeBg}
                    cx="70"
                    cy="70"
                    r={radius}
                  />
                  <circle
                    className={styles.gaugeFill}
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={getScoreColor(report.score)}
                    strokeDasharray={circumference}
                    strokeDashoffset={scoreOffset}
                    style={{ filter: getScoreShadow(report.score) }}
                  />
                </svg>
                <div className={styles.gaugeText}>
                  <span className={styles.gaugeNumber} style={{ color: getScoreColor(report.score) }}>
                    {report.score}
                  </span>
                  <span className={styles.gaugeLabel}>
                    {getScoreLabel(report.score)}
                  </span>
                </div>
              </div>

              <div className={styles.summaryTextContent}>
                <h3 className={styles.summaryHeadline}>Executive Match Summary</h3>
                <p className={styles.summaryBody}>{report.summary}</p>
              </div>
            </div>

            {/* Skills columns */}
            <div className={styles.skillsGrid}>
              <div className={styles.skillsColumn}>
                <h4 className={`${styles.skillsColumnTitle} ${styles.matchingTitle}`}>
                  <CheckCircle2 size={16} />
                  Matching Skills ({report.matchingSkills.length})
                </h4>
                <div className={styles.pillContainer}>
                  {report.matchingSkills.map((skill, idx) => (
                    <span key={idx} className={`${styles.pill} ${styles.matchingPill}`}>
                      <Check size={11} strokeWidth={3} />
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
                  <AlertCircle size={16} />
                  Missing Keywords ({report.missingSkills.length})
                </h4>
                <div className={styles.pillContainer}>
                  {report.missingSkills.map((skill, idx) => (
                    <span key={idx} className={`${styles.pill} ${styles.missingPill}`}>
                      <X size={11} strokeWidth={3} />
                      {skill}
                    </span>
                  ))}
                  {report.missingSkills.length === 0 && (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Awesome! No major missing keywords.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step-by-Step Actionable Recommendations Checklist */}
            <div className={styles.recommendationsSection}>
              <h4 className={styles.recommendationsTitle}>
                <ListTodo size={18} style={{ color: '#a855f7' }} />
                Optimize Your Resume (Action Items)
              </h4>
              <div className={styles.checklist}>
                {report.recommendations.map((recommendation, idx) => {
                  const isChecked = !!checkedRecommendations[idx];
                  return (
                    <div 
                      key={idx} 
                      className={styles.checklistItem}
                      onClick={() => toggleRecommendation(idx)}
                    >
                      <div className={`${styles.checkbox} ${isChecked ? styles.checkedBox : ''}`}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className={`${styles.checklistText} ${isChecked ? styles.completedText : ''}`}>
                        {recommendation}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyReport}>
            <FileText size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Ready for Alignment Scan</h3>
            <p className={styles.emptyDesc}>
              Enter a Job Description on the left and click "Analyze CV Alignment" to trigger the Google Gemini scanner.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
