'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, AlertCircle, Eye, Wrench } from 'lucide-react';
import {
  tailorResumeAction, createVariantAction, getThemesAction, previewResumeAction,
} from '@/app/actions/ai';
import { slugify } from '@/lib/onboarding';
import { useLoadingPhases } from '@/lib/useLoadingPhases';
import styles from '../Onboarding.module.css';
import { StepProps } from './types';

interface Theme { id: string; name: string; description: string; vibe: string; }

/** Full tailored payload from the AI; we expose a few fields and pass the rest through. */
interface TailoredData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  skills: string;
  experiences: unknown[];
  education: unknown[];
}

const PHASES = [
  { delay: 0, text: 'Downloading your resume PDF…' },
  { delay: 3000, text: 'Deconstructing your resume with advanced AI…' },
  { delay: 6500, text: 'Tailoring your summary and aligning keywords…' },
  { delay: 10000, text: 'Rewriting achievements to match the job…' },
];

export default function VariantStep({ state, patch, next, back }: StepProps) {
  const [formData, setFormData] = useState<TailoredData | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState('theme-1');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const [variantTitle, setVariantTitle] = useState('');
  const [variantSlug, setVariantSlug] = useState('');

  const [tailoring, setTailoring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const phase = useLoadingPhases(PHASES, tailoring);

  // Load themes once.
  useEffect(() => {
    getThemesAction().then((res) => {
      if (res && !res.error) setThemes(res as Theme[]);
    });
  }, []);

  const runTailor = useCallback(async () => {
    if (!state.resumeId || !state.jd.trim()) {
      setError('Missing resume or job description. Please go back.');
      return;
    }
    setTailoring(true);
    setError(null);
    try {
      const res = await tailorResumeAction(state.resumeId, state.jd);
      if (res?.error) { setError(res.error); return; }
      const data = res as TailoredData;
      setFormData(data);
      const role = state.targetRole.trim() || data.title || 'Tailored';
      setVariantTitle(`${role} Resume`);
      setVariantSlug(slugify(role) || `variant-${Date.now()}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Tailoring failed. Please try again.');
    } finally {
      setTailoring(false);
    }
  }, [state.resumeId, state.jd, state.targetRole]);

  // Kick off tailoring once.
  useEffect(() => {
    if (formData || startedRef.current) return;
    startedRef.current = true;
    runTailor();
  }, [formData, runTailor]);

  const refreshPreview = useCallback(async (themeId: string, data: TailoredData | null) => {
    if (!data) return;
    setPreviewLoading(true);
    try {
      const res = await previewResumeAction(themeId, data);
      if (!res.error && res.html) setPreviewHtml(res.html);
    } catch {
      // non-fatal — preview is best-effort
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Re-render preview when the theme changes or data first arrives.
  useEffect(() => {
    if (formData) refreshPreview(selectedThemeId, formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThemeId, formData]);

  const updateField = (key: keyof TailoredData, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!formData) return;
    if (!variantTitle.trim() || !variantSlug.trim()) {
      setError('Variant title and URL slug are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await createVariantAction(
        state.resumeId!,
        variantTitle.trim(),
        variantSlug.trim().toLowerCase(),
        selectedThemeId,
        formData,
      );
      if (result?.error) {
        setError(result.error);
      } else {
        patch({ variantSlug: result.slug, variantFileUrl: result.fileUrl });
        next();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (tailoring) {
    return (
      <div className={styles.evalCard}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <h3 className={styles.loadingTitle}>Tailoring your resume</h3>
          <p className={styles.loadingSubtitle}>{phase}</p>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className={styles.evalCard}>
        <div className={styles.errorAlert}><AlertCircle size={18} /><span>{error}</span></div>
        <div className={styles.btnRow}>
          <button type="button" className={styles.secondaryBtn} onClick={back}>
            <ArrowLeft size={16} />
            Back
          </button>
          <button type="button" className={styles.primaryBtn} onClick={() => { startedRef.current = true; runTailor(); }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className={styles.split}>
      {/* Left: compact tailored content editor */}
      <div className={styles.formPanel}>
        <h2 className={styles.title}>Review &amp; refine</h2>
        <p className={styles.subtitle}>
          The AI rewrote your summary and skills to match the job. Tweak anything, then build your PDF.
          You can fine-tune every detail later in the full builder.
        </p>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Full name</label>
          <input className={styles.input} value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Job title</label>
          <input className={styles.input} value={formData.title} onChange={(e) => updateField('title', e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Professional summary (tailored)</label>
          <textarea
            className={styles.textarea}
            style={{ minHeight: 120 }}
            value={formData.summary}
            onChange={(e) => updateField('summary', e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Skills</label>
          <input className={styles.input} value={formData.skills} onChange={(e) => updateField('skills', e.target.value)} />
        </div>

        <button type="button" className={styles.secondaryBtn} onClick={back}>
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Right: theme picker, live preview, save config */}
      <div className={styles.formPanel}>
        <h3 className={styles.sectionHead}>
          <Wrench size={16} /> Layout &amp; save
        </h3>

        <div className={styles.themesGrid}>
          {themes.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <div
                key={theme.id}
                className={`${styles.themeCard} ${isSelected ? styles.selectedThemeCard : ''}`}
                onClick={() => setSelectedThemeId(theme.id)}
              >
                <div className={styles.themeName}>
                  <span>{theme.name}</span>
                  {isSelected && <span className={styles.themeBadge}>Active</span>}
                </div>
                <div className={styles.themeMeta}>{theme.description}</div>
              </div>
            );
          })}
        </div>

        <div className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Eye size={14} style={{ color: 'var(--primary)' }} /> Live preview
        </div>
        <div className={styles.previewFrameWrap}>
          {previewLoading && (
            <div className={styles.previewPlaceholder} style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
              Refreshing layout…
            </div>
          )}
          {previewHtml ? (
            <iframe
              title="Resume theme preview"
              srcDoc={previewHtml}
              sandbox="allow-scripts"
              className={styles.previewFrame}
            />
          ) : (
            <div className={styles.previewPlaceholder}>Generating preview…</div>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Variant title</label>
          <input
            className={styles.input}
            value={variantTitle}
            onChange={(e) => setVariantTitle(e.target.value)}
            placeholder="e.g. Google Frontend Resume"
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Unique URL slug</label>
          <input
            className={styles.input}
            value={variantSlug}
            onChange={(e) => setVariantSlug(e.target.value)}
            placeholder="e.g. google-frontend"
          />
        </div>

        {error && <div className={styles.errorAlert}><AlertCircle size={18} /><span>{error}</span></div>}

        <button
          type="button"
          className={`${styles.primaryBtn} ${styles.fullWidth}`}
          onClick={handleSave}
          disabled={saving || !variantTitle.trim() || !variantSlug.trim()}
        >
          {saving ? 'Generating PDF…' : 'Build my resume'}
        </button>
      </div>
    </div>
  );
}
