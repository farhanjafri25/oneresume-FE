export interface User {
  id: string;
  username: string;
  email: string;
  /**
   * Display name from the signup provider (e.g. Google). Optional because
   * email/password signups don't supply one — fall back to `username`.
   */
  name?: string | null;
  createdAt: string;
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
