interface RenderScaleInput {
  /** Page width at pdf.js scale 1 (points/px). */
  pageWidthPx: number;
  /** CSS width the preview will be displayed at. */
  targetCssWidth: number;
  /** Sharpness multiplier from the card config. */
  renderScale: number;
  /** Screen device pixel ratio. */
  devicePixelRatio: number;
  /** Hard cap on the rendered canvas width, in px. */
  maxCanvasWidth?: number;
}

/** The pdf.js render scale that fills `targetCssWidth` crisply, clamped for safety. */
export function computeRenderScale({
  pageWidthPx,
  targetCssWidth,
  renderScale,
  devicePixelRatio,
  maxCanvasWidth = 2400,
}: RenderScaleInput): number {
  const ideal = (targetCssWidth / pageWidthPx) * renderScale * devicePixelRatio;
  const maxScale = maxCanvasWidth / pageWidthPx;
  return Math.min(ideal, maxScale);
}

interface CanvasSizeInput {
  pageWidthPx: number;
  pageHeightPx: number;
  scale: number;
}

/** Whole-pixel canvas dimensions for a given page and scale. */
export function computeCanvasSize({ pageWidthPx, pageHeightPx, scale }: CanvasSizeInput): {
  width: number;
  height: number;
} {
  return {
    width: Math.round(pageWidthPx * scale),
    height: Math.round(pageHeightPx * scale),
  };
}
