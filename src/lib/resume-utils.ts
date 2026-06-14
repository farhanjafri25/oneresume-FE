import type { Resume } from '@/types';

/**
 * A sortable "last touched" timestamp for a resume.
 *
 * Prefers the backend's `updatedAt` the moment it exists. Until then it falls
 * back to the newest uploaded version across every variant, and finally to the
 * resume's creation time — so a freshly re-uploaded resume reads as the most
 * recent even without a dedicated `updatedAt` column.
 */
export function resumeRecency(resume: Resume): string {
  if (resume.updatedAt) return resume.updatedAt;

  let newest = resume.createdAt;
  for (const variant of resume.variants ?? []) {
    for (const version of variant.versions ?? []) {
      if (version.createdAt > newest) newest = version.createdAt;
    }
  }
  return newest;
}

/** The most recently touched resume, or `undefined` for an empty list. */
export function getMostRecentResume(resumes: Resume[]): Resume | undefined {
  if (resumes.length === 0) return undefined;
  return resumes.reduce((best, candidate) =>
    resumeRecency(candidate) > resumeRecency(best) ? candidate : best,
  );
}
