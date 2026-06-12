export const ONBOARDING_SESSION_KEY = 'onecv_onboarding';

export type OnboardingStepKey = 'upload' | 'score' | 'share';

export const RAIL_STEPS: { key: OnboardingStepKey; label: string }[] = [
  { key: 'upload', label: 'Upload CV' },
  { key: 'score',  label: 'ATS Score' },
  { key: 'share',  label: 'Your link' },
];

/** Linear step sequence — single source for both navigation and the progress rail. */
export const STEP_ORDER: OnboardingStepKey[] = RAIL_STEPS.map((s) => s.key);

export interface AiReport {
  score: number;
  summary: string;
  // Targeted-review fields (unused in onboarding, kept for shared typing).
  matchingSkills?: string[];
  missingSkills?: string[];
  recommendations?: string[];
  // General ATS scan fields.
  parsability?: string;
  formatting?: string;
  actionVerbs?: string;
  missingContactInfo?: string;
  keywordReadiness?: string;
  keyImprovements?: string[];
}

export interface OnboardingState {
  step: OnboardingStepKey;
  resumeId: string | null;
  /** Public slug of the uploaded resume — used to build the shareable link. */
  slug: string | null;
  report: AiReport | null;
}

export const INITIAL_ONBOARDING: OnboardingState = {
  step: 'upload', resumeId: null, slug: null, report: null,
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

/** Public shareable link to the user's resume. */
export function buildTrackedLink(username: string, slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/${username}/${slug}`;
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
