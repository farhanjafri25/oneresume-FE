import { describe, expect, it, vi } from 'vitest';
import { loadNotFoundHeaderData } from './notFoundHeaderData';
import type { Resume, User } from '@/types';

describe('loadNotFoundHeaderData', () => {
  it('does not call the API when there is no auth token', async () => {
    const getMe = vi.fn();
    const getResumes = vi.fn();

    const result = await loadNotFoundHeaderData(false, { getMe, getResumes });

    expect(result).toEqual({ user: undefined, resumes: [] });
    expect(getMe).not.toHaveBeenCalled();
    expect(getResumes).not.toHaveBeenCalled();
  });

  it('bounds authenticated 404 header lookups with a timeout signal', async () => {
    const signal = AbortSignal.timeout(10);
    const user = { id: 'user-1', username: 'Nihal' } as User;
    const resumes = [{ id: 'resume-1', title: 'Resume' }] as Resume[];
    const getMe = vi.fn().mockResolvedValue(user);
    const getResumes = vi.fn().mockResolvedValue(resumes);

    const result = await loadNotFoundHeaderData(true, {
      getMe,
      getResumes,
      createTimeoutSignal: () => signal,
    });

    expect(result).toEqual({ user, resumes });
    expect(getMe).toHaveBeenCalledWith({ signal });
    expect(getResumes).toHaveBeenCalledWith({ signal });
  });
});
