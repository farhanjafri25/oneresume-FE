import { redirect } from 'next/navigation';
import { getMe } from '@/lib/api';
import OnboardingWizard from './OnboardingWizard';

export default async function OnboardingPage() {
  const user = await getMe();
  if (!user) redirect('/login');
  return <OnboardingWizard user={user} />;
}
