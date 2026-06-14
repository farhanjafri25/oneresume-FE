export type FitMode = 'contain' | 'cover';
export type CoverAnchor = 'top' | 'center';

/** Everything the playground can tune about a card's first-page preview. */
export interface CardPreviewConfig {
  /** width / height of the preview box. A4 portrait ≈ 0.707. */
  aspectRatio: number;
  /** How the page image sits in the box. */
  fitMode: FitMode;
  /** When `cover`, which edge to anchor the crop to. */
  coverAnchor: CoverAnchor;
  /** Sharpness multiplier passed to the pdf.js rasterizer. */
  renderScale: number;
  /** Corner radius of the preview image, in px. */
  cornerRadius: number;
  /** Background shown behind a letterboxed (`contain`) page. */
  letterboxBg: string;
  /** Inner padding around the page image, in px. */
  previewPadding: number;
}

/** Shipped defaults. Tune these from the playground, then paste the result here. */
export const cardPreviewDefaults: CardPreviewConfig = {
  aspectRatio: 0.707,
  fitMode: 'contain',
  coverAnchor: 'top',
  renderScale: 2,
  cornerRadius: 0,
  letterboxBg: 'var(--surface)',
  previewPadding: 0,
};
