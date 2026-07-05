import { describe, it, expect } from 'vitest';
import { buildEditorDefaults } from './editorDefaults';

describe('buildEditorDefaults', () => {
  it('derives the variant name and slug from the resume', () => {
    expect(
      buildEditorDefaults({ title: 'Product resume', slug: 'product-resume' }),
    ).toEqual({
      title: 'Product resume (edited)',
      slug: 'product-resume-edited',
    });
  });

  it('slugifies resume slugs that carry unsafe characters', () => {
    expect(
      buildEditorDefaults({ title: 'My CV', slug: 'My CV!' }).slug,
    ).toBe('my-cv-edited');
  });
});
