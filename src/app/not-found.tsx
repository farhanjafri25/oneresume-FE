import TopNav from '@/components/TopNav/TopNav';
import NotFound404 from '@/components/NotFound/NotFound404';
import { cookies } from 'next/headers';
import { getMe, getResumes } from '@/lib/api';
import { loadNotFoundHeaderData } from '@/lib/notFoundHeaderData';

/**
 * App-wide 404. Next.js renders this for unmatched URLs and for every
 * `notFound()` call (e.g. a missing public resume share page), inside the root
 * layout — so it works for logged-out visitors too.
 *
 * The header is best-effort auth-aware: signed-in visitors get the full nav,
 * everyone else (and the public share links) gets the logo + Sign In. Missing
 * tokens skip auth entirely, and slow/failed auth falls back to the public
 * header quickly.
 */
export default async function NotFound() {
  const cookieStore = await cookies();
  const hasToken = Boolean(cookieStore.get('token')?.value);
  const { user, resumes } = await loadNotFoundHeaderData(hasToken, { getMe, getResumes });

  return (
    <>
      <TopNav user={user} resumes={resumes} />
      <NotFound404 />
    </>
  );
}
