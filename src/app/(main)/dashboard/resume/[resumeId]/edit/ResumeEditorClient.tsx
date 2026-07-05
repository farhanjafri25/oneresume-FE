'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkle, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import {
  createVariantAction,
  getResumeContentAction,
  previewResumeAction,
} from '@/app/actions/ai';
import Button from '@/components/Button/Button';
import ResumeHtmlPreview from '@/components/ResumeHtmlPreview/ResumeHtmlPreview';
import ResumeContentEditor from '@/components/ResumeContentEditor/ResumeContentEditor';
import VariantSaveBar from '@/components/ResumeContentEditor/VariantSaveBar';
import { TailoredData } from '@/types';
import { DEFAULT_THEME_ID } from '@/lib/resume-utils';
import { buildEditorDefaults } from './editorDefaults';
import styles from './ResumeEditor.module.css';

interface ResumeEditorClientProps {
  resumeId: string;
  resumeTitle: string;
  resumeSlug: string;
  initialContent: TailoredData | null;
  initialThemeId: string | null;
  contentError: string | null;
  contentNotAvailable: boolean;
}

export default function ResumeEditorClient({
  resumeId,
  resumeTitle,
  resumeSlug,
  initialContent,
  initialThemeId,
  contentError,
  contentNotAvailable,
}: ResumeEditorClientProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<TailoredData | null>(
    initialContent,
  );
  // The resume's own theme when the backend knows it; otherwise the preview
  // and the saved variant both use the default layout (flagged in the UI).
  const [themeId, setThemeId] = useState(initialThemeId ?? DEFAULT_THEME_ID);
  const usingFallbackTheme = initialThemeId == null;

  const [loadError, setLoadError] = useState(contentError);
  const [notAvailable, setNotAvailable] = useState(contentNotAvailable);
  const [retrying, setRetrying] = useState(false);

  const defaults = buildEditorDefaults({
    title: resumeTitle,
    slug: resumeSlug,
  });
  const [variantTitle, setVariantTitle] = useState(defaults.title);
  const [variantSlug, setVariantSlug] = useState(defaults.slug);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Refs so the debounced preview reads current values without re-creating
  // the callback on every keystroke.
  const formDataRef = useRef(formData);
  const themeIdRef = useRef(themeId);
  const firstPreviewRef = useRef(true);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  useEffect(() => {
    themeIdRef.current = themeId;
  }, [themeId]);

  const fetchPreview = useCallback(async () => {
    const data = formDataRef.current;
    if (!data) return;
    setPreviewLoading(true);
    setPreviewError(false);
    try {
      const res = await previewResumeAction(themeIdRef.current, data);
      if (!res.error && res.html) {
        setPreviewHtml(res.html);
      } else {
        setPreviewError(true);
      }
    } catch (err) {
      console.error('Failed to render resume preview:', err);
      setPreviewError(true);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // First render is immediate (the page just loaded content); subsequent
  // edits settle for 800 ms before re-rendering, mirroring the builder.
  useEffect(() => {
    if (!formData) return;
    if (firstPreviewRef.current) {
      firstPreviewRef.current = false;
      fetchPreview();
      return;
    }
    const t = setTimeout(fetchPreview, 800);
    return () => clearTimeout(t);
  }, [formData, fetchPreview]);

  // Warn before the tab closes with unsaved edits. In-app navigation is left
  // alone — the App Router has no supported route-change block.
  useEffect(() => {
    if (!dirty || saving) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, saving]);

  const handleChange = (next: TailoredData) => {
    setFormData(next);
    setDirty(true);
  };

  const handleRetryLoad = async () => {
    setRetrying(true);
    try {
      const res = await getResumeContentAction(resumeId);
      if (res.error) {
        setLoadError(res.error);
        setNotAvailable(Boolean(res.notAvailable));
      } else {
        setLoadError(null);
        setNotAvailable(false);
        setThemeId(res.themeId ?? DEFAULT_THEME_ID);
        setFormData(res.content as TailoredData);
      }
    } finally {
      setRetrying(false);
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    if (!variantTitle.trim() || !variantSlug.trim()) {
      setSaveError('Variant title and URL slug are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const result = await createVariantAction(
        resumeId,
        variantTitle.trim(),
        variantSlug.trim().toLowerCase(),
        themeId,
        formData,
      );
      if (result.error) {
        setSaveError(result.error);
      } else {
        setDirty(false);
        toast.success('Saved as a new variant.');
        router.push(`/dashboard/resume/${resumeId}?tab=variants`);
        router.refresh();
      }
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Failed to save. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!formData) {
    if (notAvailable) {
      return (
        <div className={styles.stateCard}>
          <h2 className={styles.stateTitle}>Nothing to edit yet</h2>
          <p className={styles.stateText}>
            This resume&apos;s content hasn&apos;t been processed into an
            editable form. Tailoring it with AI once will unlock direct
            editing.
          </p>
          <div className={styles.stateActions}>
            <Button href={`/dashboard/ai-builder/${resumeId}`}>
              <Sparkle size={16} />
              Tailor with AI
            </Button>
            <Button
              variant="secondary"
              href={`/dashboard/resume/${resumeId}`}
            >
              Back to resume
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.stateCard}>
        <WarningCircle size={40} className={styles.stateIcon} />
        <h2 className={styles.stateTitle}>
          Couldn&apos;t load this resume&apos;s content
        </h2>
        <p className={styles.stateText}>{loadError}</p>
        <div className={styles.stateActions}>
          <Button loading={retrying} onClick={handleRetryLoad}>
            Try again
          </Button>
          <Button variant="secondary" href={`/dashboard/resume/${resumeId}`}>
            Back to resume
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.editGrid}>
        <div className={styles.editColumn}>
          <ResumeContentEditor value={formData} onChange={handleChange} />
        </div>

        <div className={styles.previewColumn}>
          {usingFallbackTheme && (
            <p className={styles.previewHint}>Shown in the default layout.</p>
          )}
          <ResumeHtmlPreview
            className={styles.livePreview}
            matted
            html={previewHtml}
            loading={previewLoading}
            error={previewError}
            onRetry={fetchPreview}
            scale={0.5}
            emptyLabel="Rendering your resume…"
            ariaLabel="Live resume preview"
          />
        </div>
      </div>

      <VariantSaveBar
        title={variantTitle}
        slug={variantSlug}
        onTitleChange={setVariantTitle}
        onSlugChange={setVariantSlug}
        onSave={handleSave}
        saving={saving}
        error={saveError}
        saveLabel="Save as new variant"
        savingLabel="Saving…"
      />
    </>
  );
}
