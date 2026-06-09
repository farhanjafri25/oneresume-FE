export const ONBOARDED_COOKIE = 'onecv_onboarded';
export const ONBOARDING_SESSION_KEY = 'onecv_onboarding';

export type OnboardingStepKey =
  | 'welcome' | 'goal' | 'upload' | 'job' | 'evaluation' | 'variant' | 'share';

/** Rail steps in order (welcome is intentionally excluded — it has no rail). */
export const RAIL_STEPS: { key: OnboardingStepKey; label: string }[] = [
  { key: 'goal',       label: 'Your goal' },
  { key: 'upload',     label: 'Upload CV' },
  { key: 'job',        label: 'Target job' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'variant',    label: 'Tailored resume' },
  { key: 'share',      label: 'Share' },
];

export interface AiReport {
  score: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

export interface OnboardingState {
  step: OnboardingStepKey;
  targetRole: string;
  experience: string;
  resumeId: string | null;
  jd: string;
  report: AiReport | null;
  variantSlug: string | null;
  variantFileUrl: string | null;
}

export const INITIAL_ONBOARDING: OnboardingState = {
  step: 'welcome', targetRole: '', experience: '', resumeId: null,
  jd: '', report: null, variantSlug: null, variantFileUrl: null,
};

export function loadOnboarding(): OnboardingState {
  if (typeof window === 'undefined') return INITIAL_ONBOARDING;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_SESSION_KEY);
    return raw ? { ...INITIAL_ONBOARDING, ...JSON.parse(raw) } : INITIAL_ONBOARDING;
  } catch { return INITIAL_ONBOARDING; }
}

export function saveOnboarding(state: OnboardingState): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(ONBOARDING_SESSION_KEY, JSON.stringify(state)); } catch {}
}

export function clearOnboarding(): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(ONBOARDING_SESSION_KEY); } catch {}
}

/** Public tracked link, mirroring ResumeCard.submitTrackingLink. */
export function buildTrackedLink(username: string, slug: string, label: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const tag = label.trim().replace(/\s+/g, '-');
  const q = tag ? `?for=${encodeURIComponent(tag)}` : '';
  return `${origin}/${username}/${slug}${q}`;
}

/** Slugify a free-text role into a URL-safe slug (mirrors upload.ts slug logic). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Score helpers (single source of truth — AiReviewClient & ScoreGauge both import these).
export const scoreColor = (s: number) => (s >= 80 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444');
export const scoreLabel = (s: number) => (s >= 80 ? 'High Fit' : s >= 50 ? 'Medium Fit' : 'Weak Fit');

/** Human verdict shown as the score-card headline. */
export const scoreVerdict = (s: number) =>
  s >= 80 ? 'Strong match' : s >= 50 ? "You're a solid fit" : 'Some gaps to close';

/** Headroom subline — frames the gap as the lever the next step closes. */
export const scoreHeadroom = (s: number) =>
  s >= 80 ? 'Top-tier fit for this role.' : `${80 - s} points from a high-fit score.`;
