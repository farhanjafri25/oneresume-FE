import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refresh, revalidatePath } from 'next/cache';
import { refreshResumeSurfaces } from './resumeCache';

vi.mock('next/cache', () => ({
  refresh: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe('refreshResumeSurfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revalidates the dashboard layout and the changed resume page', () => {
    refreshResumeSurfaces('resume-1');

    expect(revalidatePath).toHaveBeenCalledWith('/dashboard', 'layout');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/resume/resume-1');
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
