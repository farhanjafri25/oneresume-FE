import { revalidatePath } from 'next/cache';

export function refreshResumeSurfaces(resumeId?: string) {
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard');
  if (resumeId) {
    revalidatePath(`/dashboard/resume/${resumeId}`);
  }
}
