import { redirect } from 'next/navigation';

// Variants are no longer a top-level destination — they now live as a section
// inside each resume's detail page (/dashboard/resume/[id]?tab=variants).
// This redirect keeps any bookmarked/shared /dashboard/variants links working.
export default function VariantsPage() {
  redirect('/dashboard');
}
