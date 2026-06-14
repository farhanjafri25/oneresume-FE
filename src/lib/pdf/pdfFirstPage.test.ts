import { describe, it, expect } from 'vitest';
import { computeRenderScale, computeCanvasSize } from './pdfFirstPage';

describe('computeRenderScale', () => {
  it('scales so the page fills the target CSS width, times renderScale and DPR', () => {
    // 600pt-wide page shown at 300 CSS px, renderScale 2, dpr 1 → 300/600*2*1 = 1.0
    const scale = computeRenderScale({
      pageWidthPx: 600,
      targetCssWidth: 300,
      renderScale: 2,
      devicePixelRatio: 1,
    });
    expect(scale).toBeCloseTo(1.0, 5);
  });

  it('clamps the scale so the canvas never exceeds maxCanvasWidth', () => {
    // ideal = 300/600*4*3 = 6.0, but maxScale = 2400/600 = 4 → clamped to 4
    const scale = computeRenderScale({
      pageWidthPx: 600,
      targetCssWidth: 300,
      renderScale: 4,
      devicePixelRatio: 3,
      maxCanvasWidth: 2400,
    });
    expect(scale).toBeCloseTo(4.0, 5);
  });
});

describe('computeCanvasSize', () => {
  it('multiplies page dimensions by scale and rounds to whole pixels', () => {
    const size = computeCanvasSize({ pageWidthPx: 595.3, pageHeightPx: 841.9, scale: 2 });
    expect(size).toEqual({ width: 1191, height: 1684 });
  });
});
