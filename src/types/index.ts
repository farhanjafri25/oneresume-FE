export interface User {
  id: string;
  username: string;
  email: string;
  /**
   * Display name from the signup provider (e.g. Google). Optional because
   * email/password signups don't supply one — fall back to `username`.
   */
  name?: string | null;
  /**
   * True when the account was created with a password (email/password signup),
   * so it can be changed. `undefined` = backend doesn't expose it yet → treated
   * as no password (Change Password hidden until the backend ships the field).
   */
  hasPassword?: boolean;
  createdAt: string;
  avatarUrl?: string | null;
  /**
   * When the user finished onboarding (server source of truth). Survives cookie
   * clears and DB deletion. `undefined` = backend doesn't expose it yet (frontend
   * falls back to the cookie gate); `null` = not onboarded; string = onboarded.
   */
  onboardedAt?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Version {
  id: string;
  variantId: string;
  versionNumber: number;
  fileUrl: string;
  publicId: string;
  createdAt: string;
}

export interface Variant {
  id: string;
  resumeId: string;
  slug: string;
  isDefault: boolean;
  versions?: Version[];
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  slug: string;
  createdAt: string;
  /** Set once the backend tracks edits; recency logic prefers it when present. */
  updatedAt?: string;
  variants?: Variant[];
}

/**
 * One job entry in the structured resume content. Bullets are flat
 * `job_bullet_N` keys (not an array) — that's the shape the backend's tailor,
 * preview and variant endpoints all speak.
 */
export interface Experience {
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

export interface Education {
  degree: string;
  institution: string;
  edu_date: string;
  edu_location?: string;
}

/**
 * Structured resume content edited in the AI builder and the resume editor.
 * Produced by POST /resumes/:id/tailor and GET /resumes/:id/content; consumed
 * by POST /resumes/preview and POST /resumes/:id/variants. `skills` is a
 * comma-separated string.
 */
export interface TailoredData {
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

/** A resume layout, as returned by GET /resumes/themes. */
export interface Theme {
  id: string;
  name: string;
  description: string;
  vibe: string;
}
