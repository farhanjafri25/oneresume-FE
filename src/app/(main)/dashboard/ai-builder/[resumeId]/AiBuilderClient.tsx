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
import { hasCurrentPreview } from './AiBuilderPreviewFreshness';
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

type Step = 'jd_input' | 'editing' | 'success';

const STEPS: StepItem[] = [
  { id: 'jd_input', label: 'Job description' },
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

  // Edge-fade hints so it's obvious the layout strip scrolls past the cards in
  // view (users were missing layouts hidden off the right edge).
  const filmstripRef = useRef<HTMLDivElement>(null);
  const [filmstripEdges, setFilmstripEdges] = useState({
    start: false,
    end: false,
  });

  const updateFilmstripEdges = useCallback(() => {
    const el = filmstripRef.current;
    if (!el) return;
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setFilmstripEdges((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end },
    );
  }, []);

  // Recompute when the strip mounts/changes width (editing content appears once
  // formData lands, themes loading) and on window resize.
  useEffect(() => {
    updateFilmstripEdges();
    window.addEventListener('resize', updateFilmstripEdges);
    return () => window.removeEventListener('resize', updateFilmstripEdges);
  }, [step, formData, themes, updateFilmstripEdges]);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Content version: bumped (debounced) on every edit so previews know when a
  // cached render has gone stale. Lazy rendering keys off this — a layout only
  // re-renders if it's on screen and its last render predates the current
  // version.
  const [previewVersion, setPreviewVersion] = useState(0);

  // Refs let fetchPreview read current values without re-creating the callback
  // or refetching on every keystroke.
  const formDataRef = useRef(formData);
  const previewCacheRef = useRef(previewCache);
  const previewLoadingRef = useRef(previewLoading);
  const previewVersionRef = useRef(0);
  const selectedThemeIdRef = useRef(selectedThemeId);
  // Per-layout: the content version its cached render reflects.
  const renderedVersionRef = useRef<Record<string, number>>({});
  // Layouts whose thumbnails are currently scrolled into view.
  const visibleThemesRef = useRef<Set<string>>(new Set());
  // Indirection so fetchPreview can re-invoke itself (mid-render catch-up)
  // without referencing its own binding before it's declared.
  const fetchPreviewRef = useRef<(themeId: string) => void>(() => {});
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
  useEffect(() => {
    previewVersionRef.current = previewVersion;
  }, [previewVersion]);
  useEffect(() => {
    selectedThemeIdRef.current = selectedThemeId;
  }, [selectedThemeId]);

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

  // Renders a single layout if it's stale. Idempotent and safe to call from
  // multiple triggers (visibility, selection, version bump) — it no-ops when
  // the layout is already current or a render is in flight, so callers don't
  // coordinate. One render runs per layout at a time; if the content changes
  // mid-render, the trailing re-check below renders again to catch up.
  const fetchPreview = useCallback(async (themeId: string) => {
    const data = formDataRef.current;
    if (!data || !themeId) return;
    if (previewLoadingRef.current[themeId]) return;
    const version = previewVersionRef.current;
    if (
      hasCurrentPreview(
        previewCacheRef.current,
        renderedVersionRef.current,
        themeId,
        version,
      )
    ) {
      return;
    }
    setPreviewLoading((p) => ({ ...p, [themeId]: true }));
    setPreviewError((p) => ({ ...p, [themeId]: false }));
    try {
      const res = await previewResumeAction(themeId, data);
      if (!res.error && res.html) {
        setPreviewCache((p) => ({ ...p, [themeId]: res.html }));
        renderedVersionRef.current[themeId] = version;
      } else {
        setPreviewError((p) => ({ ...p, [themeId]: true }));
      }
    } catch (err) {
      console.error('Failed to render layout preview:', err);
      setPreviewError((p) => ({ ...p, [themeId]: true }));
    } finally {
      setPreviewLoading((p) => ({ ...p, [themeId]: false }));
    }
    // Content changed while this render was in flight — re-render to catch up,
    // but only for layouts still on screen (the hero or a visible thumbnail).
    if (
      previewVersionRef.current !== version &&
      (themeId === selectedThemeIdRef.current ||
        visibleThemesRef.current.has(themeId))
    ) {
      fetchPreviewRef.current(themeId);
    }
  }, []);
  useEffect(() => {
    fetchPreviewRef.current = fetchPreview;
  }, [fetchPreview]);

  // Flips false→true once tailoring lands the data. Gating previews on this
  // (not just `step`) matters now that we enter the editing step before
  // formData exists — the previews fetch when the data arrives.
  const formDataReady = formData != null;

  // Render the always-on-screen layouts (the hero, plus any thumbnails already
  // in view) on enter, theme switch, and after each edit settles. Off-screen
  // thumbnails are left to the IntersectionObserver below — they render only
  // once scrolled to. fetchPreview no-ops on anything already current.
  useEffect(() => {
    if (step !== 'editing' || !formDataReady) return;
    const ids = [selectedThemeId, ...visibleThemesRef.current].filter(
      (id, i, arr) => arr.indexOf(id) === i,
    );
    runWithLimit(
      ids.map((id) => () => fetchPreview(id)),
      2,
    );
  }, [step, formDataReady, selectedThemeId, previewVersion, fetchPreview]);

  // Lazily render thumbnails as they scroll into view (with a little prefetch
  // margin), and remember which are visible so edits can refresh just those.
  useEffect(() => {
    if (step !== 'editing' || !formDataReady || themes.length === 0) return;
    const strip = filmstripRef.current;
    if (!strip) return;
    const io = new IntersectionObserver(
      (entries) => {
        const toRender: string[] = [];
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-theme-id');
          if (!id) continue;
          if (entry.isIntersecting) {
            visibleThemesRef.current.add(id);
            toRender.push(id);
          } else {
            visibleThemesRef.current.delete(id);
          }
        }
        if (toRender.length) {
          runWithLimit(
            toRender.map((id) => () => fetchPreview(id)),
            2,
          );
        }
      },
      { root: strip, rootMargin: '0px 240px', threshold: 0.01 },
    );
    strip
      .querySelectorAll('[data-theme-id]')
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [step, formDataReady, themes, fetchPreview]);

  // Debounced bump of the content version after edits. The render effect above
  // reacts to it, refreshing the hero and any visible thumbnails; off-screen
  // ones refresh when next scrolled to. Skip the first run (entering editing).
  useEffect(() => {
    if (step !== 'editing' || !formData) return;
    if (skipFirstEditRefresh.current) {
      skipFirstEditRefresh.current = false;
      return;
    }
    const t = setTimeout(() => setPreviewVersion((v) => v + 1), 800);
    return () => clearTimeout(t);
  }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading-phase timers. The index is reset to 0 in handleTailor before the
  // step flips, so the effect only schedules the advances.
  useEffect(() => {
    // Tailoring is in flight while we're on the editing step but formData
    // hasn't arrived yet.
    if (!(step === 'editing' && !formData)) return;
    const timers = LOADING_DELAYS.map((d, i) =>
      setTimeout(() => setLoadingPhaseIndex(i + 1), d),
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [step, formData]);

  const handleTailor = async () => {
    if (!jd.trim()) return;
    setLoadingPhaseIndex(0);
    // Move straight onto the Edit & layout step; the tailoring loader shows
    // in-place there until formData arrives.
    setStep('editing');
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
  } else if (step === 'editing' && !formData) {
    content = (
      <div className={styles.tailoringLoader}>
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
                {themes.length > 0 && (
                  <span className={styles.layoutCount}>{themes.length}</span>
                )}
              </span>
            </div>

            <div
              className={styles.filmstripViewport}
              data-edge-start={filmstripEdges.start ? '' : undefined}
              data-edge-end={filmstripEdges.end ? '' : undefined}
            >
            <div
              className={styles.themeFilmstrip}
              ref={filmstripRef}
              onScroll={updateFilmstripEdges}
            >
              {themes.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    data-theme-id={theme.id}
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
            </div>

            <div className={styles.heroPreviewWrap}>
              <ResumeHtmlPreview
                className={styles.heroLivePreview}
                matted
                html={previewCache[selectedThemeId] || ''}
                loading={!!previewLoading[selectedThemeId]}
                error={!!previewError[selectedThemeId]}
                onRetry={() => fetchPreview(selectedThemeId)}
                scale={0.5}
                emptyLabel="Rendering your resume…"
                ariaLabel="Live resume preview"
              />
              <Button
                variant="secondary"
                size="sm"
                className={styles.heroExpandBtn}
                onClick={() => setPreviewModalOpen(true)}
                disabled={!previewCache[selectedThemeId]}
                aria-label="Open larger preview"
                title="Open larger"
              >
                <ArrowsOutSimple size={16} />
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
            matted
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
