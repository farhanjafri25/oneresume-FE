import { describe, expect, it } from 'vitest';
import { keepSelectedPreviewOnly } from './AiBuilderPreviewCache';

describe('keepSelectedPreviewOnly', () => {
  it('drops cached previews for non-selected themes after content edits', () => {
    expect(
      keepSelectedPreviewOnly(
        {
          'theme-1': '<html>old selected</html>',
          'theme-2': '<html>old other</html>',
          'theme-3': '<html>old other</html>',
        },
        'theme-1',
      ),
    ).toEqual({
      'theme-1': '<html>old selected</html>',
    });
  });
});
