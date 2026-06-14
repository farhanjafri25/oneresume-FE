import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe, getResumes } from '@/lib/api';
import { getMostRecentResume } from '@/lib/resume-utils';
import type { Resume } from '@/types';

// The app has no public landing page. "/" routes authenticated users to their
// resumes and everyone else to login. Anyone with at least one resume lands
// directly on their most recently touched resume; only zero-resume users get
// the grid (its empty/upload state).
export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  let user = null;
  let resumes: Resume[] = [];
  if (token) {
    try {
      user = await getMe();
      if (user) {
        resumes = await getResumes();
      }
    } catch {
      // Fall through to login on auth failure.
    }
  }

  // redirect() throws NEXT_REDIRECT — keep it out of the try/catch above.
  if (!user) {
    redirect('/login');
  }
  const mostRecent = getMostRecentResume(resumes);
  redirect(mostRecent ? `/dashboard/resume/${mostRecent.id}` : '/dashboard');
}
