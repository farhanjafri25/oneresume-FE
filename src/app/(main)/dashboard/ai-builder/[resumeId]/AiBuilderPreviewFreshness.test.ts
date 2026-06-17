import { describe, expect, it } from 'vitest';
import { hasCurrentPreview } from './AiBuilderPreviewFreshness';

describe('hasCurrentPreview', () => {
  it('treats a matching rendered version as stale after cached html is cleared', () => {
    expect(
      hasCurrentPreview(
        {},
        {
          'theme-1': 2,
        },
        'theme-1',
        2,
      ),
    ).toBe(false);
  });
});
