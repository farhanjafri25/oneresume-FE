'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkle,
  Briefcase,
  GraduationCap,
  CheckCircle,
  WarningCircle,
  PaperPlaneTilt,
  FloppyDisk,
  DownloadSimple,
  Eye,
  CaretRight,
  ArrowsOutSimple,
  IdentificationCard,
  TextAlignLeft,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import {
  tailorResumeAction,
  createVariantAction,
  getThemesAction,
  previewResumeAction,
} from '@/app/actions/ai';
import Button from '@/components/Button/Button';
import Stepper, { StepItem } from '@/components/Stepper/Stepper';
import ResumeHtmlPreview from '@/components/ResumeHtmlPreview/ResumeHtmlPreview';
import Modal from '@/components/motion/Modal';
import { keepSelectedPreviewOnly } from './AiBuilderPreviewCache';
import styles from './AiBuilder.module.css';

interface AiBuilderClientProps {
  resumeId: string;
}

interface Theme {
  id: string;
  name: string;
  description: string;
  vibe: string;
}

interface Experience {
  job_title: string;
  company: string;
  job_dates: string;
  job_location: string;
  job_bullet_1: string;
  job_bullet_2: string;
  job_bullet_3: string;
  job_bullet_4?: string;
  job_bullet_5?: string;
}

interface Education {
  degree: string;
  institution: string;
  edu_date: string;
  edu_location?: string;
}

interface TailoredData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  skills: string;
  experiences: Experience[];
  education: Education[];
}

type Step = 'jd_input' | 'loading' | 'editing' | 'success';

const STEPS: StepItem[] = [
  { id: 'jd_input', label: 'Job description' },
  { id: 'loading', label: 'Tailoring' },
  { id: 'editing', label: 'Edit & layout' },
  { id: 'success', label: 'Done' },
];

// Copy for the loading checklist. The index advances on the timers below, so the
// list and the timers stay in sync from one source of truth.
const LOADING_PHASES = [
  'Downloading your resume',
  'Reading layout and structure',
  'Tailoring summary and skills to the role',
  'Rewriting experience bullet points',
];
const LOADING_DELAYS = [3000, 6500, 10000];

const BULLET_KEYS: (keyof Experience)[] = [
  'job_bullet_1',
  'job_bullet_2',
  'job_bullet_3',
  'job_bullet_4',
  'job_bullet_5',
];

/**
 * Normalise a backend label to readable Title Case so ALL-CAPS theme names
 * (e.g. "THE TECH MINIMAL") never reach the UI. Centralised so every label
 * site stays consistent.
 */
function toDisplayCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Build a URL-safe slug from arbitrary text. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Run thunks with bounded concurrency (preview is an AI/render call). */
async function runWithLimit(thunks: Array<() => Promise<void>>, limit: number) {
  const queue = [...thunks];
  const workers = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length) {
        const fn = queue.shift();
        if (fn) await fn();
      }
    },
  );
  await Promise.all(workers);
}

export default function AiBuilderClient({ resumeId }: AiBuilderClientProps) {
  const [step, setStep] = useState<Step>('jd_input');

  const [jd, setJd] = useState('');
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TailoredData | null>(null);

  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState('theme-1');

  const [variantTitle, setVariantTitle] = useState('');
  const [variantSlug, setVariantSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const [createdVariant, setCreatedVariant] = useState<{
    fileUrl: string;
    slug: string;
  } | null>(null);

  // Keyed live-preview cache so switching themes is instant and never refetches.
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [previewError, setPreviewError] = useState<Record<string, boolean>>({});

  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Refs let fetchPreview read current values without re-creating the callback
  // or refetching on every keystroke.
  const formDataRef = useRef(formData);
  const previewCacheRef = useRef(previewCache);
  const previewLoadingRef = useRef(previewLoading);
  const previewVersionRef = useRef(0);
  const skipFirstEditRefresh = useRef(false);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  useEffect(() => {
    previewCacheRef.current = previewCache;
  }, [previewCache]);
  useEffect(() => {
    previewLoadingRef.current = previewLoading;
  }, [previewLoading]);

  // Load available themes on startup. A failure surfaces as a toast (not a red
  // blocker on the JD form).
  useEffect(() => {
    getThemesAction()
      .then((res) => {
        if (res && res.error) {
          toast.error("Couldn't load themes. Please refresh and try again.");
        } else {
          setThemes(res);
        }
      })
      .catch(() => {
        toast.error("Couldn't load themes. Please refresh and try again.");
      });
  }, []);

  // Pre-fill JD if navigated from the AI Match Reviewer. Done in an effect (not
  // a lazy initialiser) so the controlled textarea hydrates empty and matches
  // the server-rendered HTML before the stored value is applied.
  useEffect(() => {
    const storedJd = sessionStorage.getItem('shared_jd');
    if (storedJd) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJd(storedJd);
      sessionStorage.removeItem('shared_jd');
    }
  }, []);

  const fetchPreview = useCallback(async (themeId: string, force = false) => {
    const data = formDataRef.current;
    const previewVersion = previewVersionRef.current;
    if (!data || !themeId) return;
    if (
      !force &&
      (previewCacheRef.current[themeId] || previewLoadingRef.current[themeId])
    ) {
      return;
    }
    setPreviewLoading((p) => ({ ...p, [themeId]: true }));
    setPreviewError((p) => ({ ...p, [themeId]: false }));
    try {
      const res = await previewResumeAction(themeId, data);
      if (previewVersion !== previewVersionRef.current) return;
      if (!res.error && res.html) {
        setPreviewCache((p) => ({ ...p, [themeId]: res.html }));
      } else {
        setPreviewError((p) => ({ ...p, [themeId]: true }));
      }
    } catch (err) {
      console.error('Failed to render layout preview:', err);
      if (previewVersion === previewVersionRef.current) {
        setPreviewError((p) => ({ ...p, [themeId]: true }));
      }
    } finally {
      setPreviewLoading((p) => ({ ...p, [themeId]: false }));
    }
  }, []);

  // Ensure the selected theme's hero is rendered (on enter + on theme switch).
  useEffect(() => {
    if (step === 'editing') fetchPreview(selectedThemeId);
  }, [step, selectedThemeId, fetchPreview]);

  // Lazily render the remaining thumbnails with bounded concurrency.
  useEffect(() => {
    if (step !== 'editing' || themes.length === 0) return;
    const rest = themes.map((t) => t.id).filter((id) => id !== selectedThemeId);
    runWithLimit(
      rest.map((id) => () => fetchPreview(id)),
      2,
    );
  }, [step, themes, selectedThemeId, fetchPreview]);

  // Debounced refresh of the selected theme after edits (thumbnails stay
  // directional until reselected or synced). Skip the very first run, which is
  // just entering the editing step.
  useEffect(() => {
    if (step !== 'editing' || !formData) return;
    if (skipFirstEditRefresh.current) {
      skipFirstEditRefresh.current = false;
      return;
    }
    previewVersionRef.current += 1;
    setPreviewCache((p) => keepSelectedPreviewOnly(p, selectedThemeId));
    const t = setTimeout(() => fetchPreview(selectedThemeId, true), 800);
    return () => clearTimeout(t);
  }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading-phase timers. The index is reset to 0 in handleTailor before the
  // step flips, so the effect only schedules the advances.
  useEffect(() => {
    if (step !== 'loading') return;
    const timers = LOADING_DELAYS.map((d, i) =>
      setTimeout(() => setLoadingPhaseIndex(i + 1), d),
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [step]);

  const handleTailor = async () => {
    if (!jd.trim()) return;
    setLoadingPhaseIndex(0);
    setStep('loading');
    setError(null);

    try {
      const data = await tailorResumeAction(resumeId, jd);
      if (data.error) {
        setError(data.error);
        setStep('jd_input');
      } else {
        setFormData(data);
        // Name the variant after the role we tailored to (derived from the JD),
        // not the candidate's past employer.
        const role = (data.title || '').trim();
        setVariantTitle(role ? `${role} resume` : 'Tailored resume');
        setVariantSlug(slugify(role) || 'tailored-resume');
        skipFirstEditRefresh.current = true;
        setStep('editing');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during tailoring.',
      );
      setStep('jd_input');
    }
  };

  const handleSaveVariant = async () => {
    if (!formData) return;
    if (!variantTitle.trim() || !variantSlug.trim()) {
      setError('Variant title and URL slug are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await createVariantAction(
        resumeId,
        variantTitle.trim(),
        variantSlug.trim().toLowerCase(),
        selectedThemeId,
        formData,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setCreatedVariant(result);
        setStep('success');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate PDF. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep('jd_input');
    setJd('');
    setFormData(null);
    setCreatedVariant(null);
    setError(null);
    setVariantTitle('');
    setVariantSlug('');
    setPreviewCache({});
    setPreviewLoading({});
    setPreviewError({});
    if (themes.length) setSelectedThemeId(themes[0].id);
  };

  const updateField = (key: keyof TailoredData, value: unknown) => {
    if (!formData) return;
    setFormData({ ...formData, [key]: value });
  };

  const updateExperience = (
    index: number,
    key: keyof Experience,
    value: string,
  ) => {
    if (!formData) return;
    const newExps = [...formData.experiences];
    newExps[index] = { ...newExps[index], [key]: value };
    updateField('experiences', newExps);
  };

  const updateEducation = (
    index: number,
    key: keyof Education,
    value: string,
  ) => {
    if (!formData) return;
    const newEdus = [...formData.education];
    newEdus[index] = { ...newEdus[index], [key]: value };
    updateField('education', newEdus);
  };

  const anyPreviewLoading = Object.values(previewLoading).some(Boolean);

  // ── Render per state ──────────────────────────────────────
  let content: React.ReactNode = null;

  if (step === 'jd_input') {
    content = (
      <div className={styles.jdCard}>
        <span className={styles.jdLabel}>Paste the job description</span>
        <textarea
          className={styles.jdTextarea}
          placeholder="Paste the job description here. e.g. 'We are looking for a Senior React Engineer with 4+ years of experience in Next.js, TypeScript and AWS…'"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        <p className={styles.jdHelper}>
          We&apos;ll tailor your summary, experience bullet points and skills to
          match this role.
        </p>

        {error && (
          <div className={styles.errorAlert}>
            <WarningCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <Button fullWidth onClick={handleTailor} disabled={!jd.trim()}>
          <PaperPlaneTilt size={16} />
          Tailor resume content
        </Button>
      </div>
    );
  } else if (step === 'loading') {
    content = (
      <div className={styles.loadingCard}>
        <span className={`${styles.iconTile} ${styles.loadingIcon}`}>
          <Sparkle size={22} weight="fill" />
        </span>
        <h2 className={styles.loadingTitle}>Tailoring your resume</h2>
        <p className={styles.loadingLede}>This usually takes a few seconds.</p>

        <ul className={styles.loadingChecklist}>
          {LOADING_PHASES.map((text, i) => {
            const state =
              i < loadingPhaseIndex
                ? 'done'
                : i === loadingPhaseIndex
                  ? 'active'
                  : 'upcoming';
            return (
              <li key={text} className={styles.loadingItem} data-state={state}>
                {state === 'done' ? (
                  <span className={styles.loadingCheck}>
                    <CheckCircle size={16} weight="fill" />
                  </span>
                ) : state === 'active' ? (
                  <span className={styles.loadingSpinnerWrap}>
                    <span className={styles.loadingSpinner} />
                  </span>
                ) : (
                  <span className={styles.loadingDot} />
                )}
                {text}
              </li>
            );
          })}
        </ul>
      </div>
    );
  } else if (step === 'success' && createdVariant) {
    content = (
      <div className={styles.successCard}>
        <CheckCircle size={56} weight="fill" className={styles.successIcon} />
        <h2 className={styles.successTitle}>Resume variant generated</h2>
        <p className={styles.successText}>
          Your resume was compiled with your chosen layout, rendered as an
          ATS-friendly PDF, and saved as <strong>&ldquo;{variantTitle}&rdquo;</strong>.
        </p>
        <div className={styles.successActions}>
          <Button
            href={createdVariant.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DownloadSimple size={16} />
            Download tailored PDF
          </Button>
          <Button
            variant="secondary"
            href={`/dashboard/resume/${resumeId}?tab=variants`}
          >
            View tailored variants
          </Button>
          <Button variant="ghost" onClick={handleReset}>
            Tailor for another role
          </Button>
        </div>
      </div>
    );
  } else if (step === 'editing' && formData) {
    content = (
      <>
        <div className={styles.editGrid}>
          {/* LEFT: editable content */}
          <div className={styles.editColumn}>
            <details className={styles.sectionGroup} open>
              <summary className={styles.sectionGroupHeader}>
                <IdentificationCard
                  size={18}
                  className={styles.sectionIcon}
                />
                Contact details
                <CaretRight size={16} className={styles.caret} />
              </summary>
              <div className={styles.sectionBody}>
                <div className={styles.fieldGrid}>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Full name</span>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Job title</span>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Email</span>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Phone</span>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Location</span>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>LinkedIn</span>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={formData.linkedin}
                      onChange={(e) => updateField('linkedin', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </details>

            <details className={styles.sectionGroup} open>
              <summary className={styles.sectionGroupHeader}>
                <TextAlignLeft size={18} className={styles.sectionIcon} />
                Professional summary
                <CaretRight size={16} className={styles.caret} />
              </summary>
              <div className={styles.sectionBody}>
                <textarea
                  className={styles.textAreaField}
                  rows={4}
                  value={formData.summary}
                  onChange={(e) => updateField('summary', e.target.value)}
                />
              </div>
            </details>

            <details className={styles.sectionGroup} open>
              <summary className={styles.sectionGroupHeader}>
                <Briefcase size={18} className={styles.sectionIcon} />
                Experience
                <span className={styles.sectionCount}>
                  {formData.experiences.length}
                </span>
                <CaretRight size={16} className={styles.caret} />
              </summary>
              <div className={styles.sectionBody}>
                {formData.experiences.map((exp, idx) => (
                  <div key={idx} className={styles.experienceCard}>
                    <div className={styles.fieldGrid}>
                      <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Role</span>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={exp.job_title}
                          onChange={(e) =>
                            updateExperience(idx, 'job_title', e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Company</span>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(idx, 'company', e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Dates</span>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={exp.job_dates}
                          onChange={(e) =>
                            updateExperience(idx, 'job_dates', e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Location</span>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={exp.job_location}
                          onChange={(e) =>
                            updateExperience(
                              idx,
                              'job_location',
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className={styles.achievements}>
                      <span className={styles.fieldLabel}>Achievements</span>
                      {BULLET_KEYS.filter(
                        (key) => exp[key] !== undefined,
                      ).map((key) => (
                        <div key={key} className={styles.bulletRow}>
                          <span className={styles.bulletDot} />
                          <input
                            type="text"
                            className={styles.inputField}
                            value={(exp[key] as string) ?? ''}
                            onChange={(e) =>
                              updateExperience(idx, key, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>

            <details className={styles.sectionGroup}>
              <summary className={styles.sectionGroupHeader}>
                <Wrench size={18} className={styles.sectionIcon} />
                Skills
                <CaretRight size={16} className={styles.caret} />
              </summary>
              <div className={styles.sectionBody}>
                <input
                  type="text"
                  className={styles.inputField}
                  value={formData.skills}
                  onChange={(e) => updateField('skills', e.target.value)}
                  placeholder="React, TypeScript, Node.js…"
                />
                <span className={styles.skillsHint}>
                  Separate skills with commas.
                </span>
              </div>
            </details>

            <details className={styles.sectionGroup}>
              <summary className={styles.sectionGroupHeader}>
                <GraduationCap size={18} className={styles.sectionIcon} />
                Education
                <span className={styles.sectionCount}>
                  {formData.education.length}
                </span>
                <CaretRight size={16} className={styles.caret} />
              </summary>
              <div className={styles.sectionBody}>
                {formData.education.map((edu, idx) => (
                  <div key={idx} className={styles.experienceCard}>
                    <div className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>Degree</span>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(idx, 'degree', e.target.value)
                        }
                      />
                    </div>
                    <div className={styles.fieldGrid}>
                      <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Institution</span>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={edu.institution}
                          onChange={(e) =>
                            updateEducation(idx, 'institution', e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>Graduation</span>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={edu.edu_date}
                          onChange={(e) =>
                            updateEducation(idx, 'edu_date', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>

          {/* RIGHT: theme filmstrip + sticky hero preview */}
          <div className={styles.previewColumn}>
            <div className={styles.filmstripHeader}>
              <span className={styles.previewToolbarLabel}>
                <Eye size={15} />
                Choose a layout
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  runWithLimit(
                    themes.map((t) => () => fetchPreview(t.id, true)),
                    2,
                  )
                }
                loading={anyPreviewLoading}
              >
                Sync layouts
              </Button>
            </div>

            <div className={styles.themeFilmstrip}>
              {themes.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    className={`${styles.themeThumb} ${
                      isSelected ? styles.themeThumbSelected : ''
                    }`}
                    onClick={() => setSelectedThemeId(theme.id)}
                    aria-pressed={isSelected}
                    title={theme.description}
                  >
                    {/* No retry button here — it would nest inside this button;
                        selecting an errored thumbnail re-triggers its fetch. */}
                    <ResumeHtmlPreview
                      className={styles.themeThumbFrame}
                      html={previewCache[theme.id] || ''}
                      loading={!!previewLoading[theme.id]}
                      error={!!previewError[theme.id]}
                      scale={0.28}
                      emptyLabel="…"
                      ariaLabel={`${theme.name} layout`}
                    />
                    <span className={styles.themeThumbLabel}>
                      {toDisplayCase(theme.name)}
                    </span>
                  </button>
                );
              })}
            </div>

            <ResumeHtmlPreview
              className={styles.heroLivePreview}
              html={previewCache[selectedThemeId] || ''}
              loading={!!previewLoading[selectedThemeId]}
              error={!!previewError[selectedThemeId]}
              onRetry={() => fetchPreview(selectedThemeId, true)}
              scale={0.5}
              emptyLabel="Rendering your resume…"
              ariaLabel="Live resume preview"
            />

            <div className={styles.previewActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewModalOpen(true)}
                disabled={!previewCache[selectedThemeId]}
              >
                <ArrowsOutSimple size={15} />
                Open larger
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky save bar */}
        <div className={styles.bottomBar}>
          {error && (
            <div className={styles.errorAlert}>
              <WarningCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          <div className={styles.bottomBarRow}>
            <div className={styles.bottomBarField}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Variant title</span>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. Google frontend resume"
                  value={variantTitle}
                  onChange={(e) => setVariantTitle(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.bottomBarField}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>URL slug</span>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. google-frontend"
                  value={variantSlug}
                  onChange={(e) => setVariantSlug(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.bottomBarButton}>
              <Button
                loading={saving}
                onClick={handleSaveVariant}
                disabled={!variantTitle.trim() || !variantSlug.trim()}
              >
                {!saving && <FloppyDisk size={16} />}
                {saving ? 'Generating PDF…' : 'Build & save variant'}
              </Button>
            </div>
          </div>
        </div>

        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          overlayClassName={styles.modalOverlay}
          contentClassName={styles.modalContent}
        >
          <ResumeHtmlPreview
            className={styles.modalPreview}
            html={previewCache[selectedThemeId] || ''}
            loading={!!previewLoading[selectedThemeId]}
            scale={0.62}
            ariaLabel="Enlarged resume preview"
          />
          <div className={styles.modalClose}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className={styles.stepperWrap}>
        <Stepper items={STEPS} currentId={step} />
      </div>
      {content}
    </>
  );
}
