import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe, getResumes } from '@/lib/api';
import type { Resume } from '@/types';

// The app has no public landing page. "/" routes authenticated users to their
// resumes and everyone else to login. A user with exactly one resume lands
// directly on that resume's detail page; zero or multiple keep the grid.
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
  redirect(resumes.length === 1 ? `/dashboard/resume/${resumes[0].id}` : '/dashboard');
}
