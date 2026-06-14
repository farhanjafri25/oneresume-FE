import type * as PdfjsModule from 'pdfjs-dist';

let pdfjsPromise: Promise<typeof PdfjsModule> | null = null;

/** Lazy-load pdf.js once and point it at its bundled worker. */
async function getPdfjs(): Promise<typeof PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      // `new URL(..., import.meta.url)` makes the bundler (webpack/turbopack) emit
      // the worker as an asset and hand us its URL — no CDN dependency.
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export interface FirstPageImage {
  dataUrl: string;
  width: number;
  height: number;
}

interface RenderFirstPageOptions {
  /** CSS width the preview will display at (used to pick render resolution). */
  cssWidth: number;
  /** Sharpness multiplier from the card config. */
  renderScale: number;
  /** AbortSignal to cancel an in-flight render (e.g. element scrolled away). */
  signal?: AbortSignal;
}

/** Render page 1 of `url` to a PNG data URL. Browser-only. */
export async function renderFirstPageToDataUrl(
  url: string,
  { cssWidth, renderScale, signal }: RenderFirstPageOptions,
): Promise<FirstPageImage> {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({ url });
  signal?.addEventListener('abort', () => loadingTask.destroy(), { once: true });

  const doc = await loadingTask.promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const scale = computeRenderScale({
      pageWidthPx: base.width,
      targetCssWidth: cssWidth,
      renderScale,
      devicePixelRatio: dpr,
    });
    const viewport = page.getViewport({ scale });
    const { width, height } = computeCanvasSize({
      pageWidthPx: base.width,
      pageHeightPx: base.height,
      scale,
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    await page.render({ canvasContext: ctx, viewport }).promise;
    return { dataUrl: canvas.toDataURL('image/png'), width, height };
  } finally {
    doc.destroy();
  }
}

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
