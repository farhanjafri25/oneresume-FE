import { describe, expect, it } from 'vitest';
import { canRevertToVersion, buildRevertConfirmText } from './versionMenu';

describe('canRevertToVersion', () => {
  it('allows reverting to an older version', () => {
    expect(canRevertToVersion(2, 5)).toBe(true);
  });

  it('hides revert on the active (latest) version', () => {
    expect(canRevertToVersion(5, 5)).toBe(false);
  });

  it('returns false when there is no latest version', () => {
    expect(canRevertToVersion(1, undefined)).toBe(false);
  });
});

describe('buildRevertConfirmText', () => {
  it('names the target version and reassures history is kept', () => {
    const text = buildRevertConfirmText(2);
    expect(text).toContain('Version 2');
    expect(text).toContain('kept');
  });
});
