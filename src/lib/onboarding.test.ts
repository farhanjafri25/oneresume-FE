import { afterEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_ONBOARDING, ONBOARDING_SESSION_KEY, loadOnboarding } from './onboarding';

describe('loadOnboarding', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps the removed share step to the score step', () => {
    const store = new Map<string, string>([
      [ONBOARDING_SESSION_KEY, JSON.stringify({ step: 'share', resumeId: 'resume-1' })],
    ]);

    vi.stubGlobal('window', {});
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
    });

    expect(loadOnboarding()).toEqual({ ...INITIAL_ONBOARDING, step: 'score', resumeId: 'resume-1' });
  });
});
