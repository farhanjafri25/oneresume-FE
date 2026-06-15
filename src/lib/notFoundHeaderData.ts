import type { Resume, User } from '@/types';

export const NOT_FOUND_AUTH_TIMEOUT_MS = 1500;

type HeaderData = {
  user?: User;
  resumes: Resume[];
};

type HeaderDataDeps = {
  getMe: (options?: RequestInit) => Promise<User | null>;
  getResumes: (options?: RequestInit) => Promise<Resume[]>;
  createTimeoutSignal?: (ms: number) => AbortSignal;
};

function emptyHeaderData(): HeaderData {
  return { user: undefined, resumes: [] };
}

export async function loadNotFoundHeaderData(
  hasToken: boolean,
  deps: HeaderDataDeps,
  timeoutMs = NOT_FOUND_AUTH_TIMEOUT_MS,
): Promise<HeaderData> {
  if (!hasToken) {
    return emptyHeaderData();
  }

  try {
    const signal =
      deps.createTimeoutSignal?.(timeoutMs) ?? AbortSignal.timeout(timeoutMs);
    const user = (await deps.getMe({ signal })) ?? undefined;
    if (!user) {
      return emptyHeaderData();
    }

    const resumes = await deps.getResumes({ signal });
    return { user, resumes };
  } catch {
    return emptyHeaderData();
  }
}
