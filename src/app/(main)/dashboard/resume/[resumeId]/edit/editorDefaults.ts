import { slugify } from '@/lib/resume-utils';

/**
 * Default variant name for a direct edit. Derived from the resume being
 * edited (unlike the builder, which names variants after the tailored role)
 * so repeated edits read as "<resume> (edited)" in the variants list.
 */
export function buildEditorDefaults(resume: {
  title: string;
  slug: string;
}): { title: string; slug: string } {
  return {
    title: `${resume.title} (edited)`,
    slug: slugify(`${resume.slug}-edited`),
  };
}
