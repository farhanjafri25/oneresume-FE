import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/api';

// The app has no public landing page. "/" routes authenticated users to the
// dashboard (resumes) and everyone else to login. The dashboard's own layout
// handles the onboarding gate from there.
export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  let user = null;
  if (token) {
    try {
      user = await getMe();
    } catch (e) {
      // Fall through to login on auth failure.
    }
  }

  // redirect() throws NEXT_REDIRECT — keep it out of the try/catch above.
  redirect(user ? '/dashboard' : '/login');
}
