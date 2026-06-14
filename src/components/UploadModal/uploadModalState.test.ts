import { describe, expect, it } from 'vitest';
import { shouldProcessUploadSuccess } from './uploadModalState';

describe('shouldProcessUploadSuccess', () => {
  it('processes a successful action state once', () => {
    const state = { success: true, resumeId: 'resume-1' };

    expect(shouldProcessUploadSuccess(state, null)).toBe(true);
    expect(shouldProcessUploadSuccess(state, state)).toBe(false);
  });

  it('ignores empty and failed action states', () => {
    expect(shouldProcessUploadSuccess(null, null)).toBe(false);
    expect(shouldProcessUploadSuccess({ error: 'Upload failed' }, null)).toBe(false);
  });
});
