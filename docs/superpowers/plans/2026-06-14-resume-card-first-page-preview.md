# Resume card first-page previews + DialKit playground — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the iframe-based resume card preview with a pdf.js-rendered image of page 1 (works on every browser), and add a kept DialKit playground at `/playground/resume-card` to tune card layout.

**Architecture:** A lazy-loaded `pdfjs-dist` helper rasterizes page 1 of a PDF to a PNG data URL; a client `<PdfFirstPage>` component displays it with CSS `object-fit` (so `contain`/`cover` switch instantly without re-rendering) and only renders when scrolled into view. `ResumePreview` swaps its `<iframe>` for `<PdfFirstPage>`. All tunable layout values live in one shared `cardPreviewDefaults` object that both the real card and the playground import.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `pdfjs-dist`, Vitest (new — pure-function tests only), CSS modules, motion/react.

---

## File Structure

**New**
- `src/lib/cardPreviewDefaults.ts` — shared config type + default values (single source of truth).
- `src/lib/pdf/pdfFirstPage.ts` — pure scale/size math + the pdf.js render function.
- `src/lib/pdf/pdfFirstPage.test.ts` — Vitest unit tests for the pure math.
- `src/components/PdfFirstPage/PdfFirstPage.tsx` (+ `.module.css`) — the image-based preview with loading/error/empty states.
- `src/components/DialKit/useDialKit.tsx` (+ `DialKit.module.css`) — minimal live control panel (DialKit pattern).
- `src/app/playground/resume-card/page.tsx` — route entry (metadata + noindex).
- `src/app/playground/resume-card/PlaygroundClient.tsx` (+ `.module.css`) — the live grid + dials.
- `public/samples/sample-resume.pdf` — same-origin sample for the playground.
- `vitest.config.ts` — minimal Vitest config (node environment).

**Modify**
- `src/components/ResumePreview/ResumePreview.tsx` — iframe → `<PdfFirstPage>`.
- `src/components/ResumeCard/ResumeCard.tsx` — accept optional `previewConfig`, pass through.
- `src/components/ResumeCard/ResumeCard.module.css` — `.imageContainer` height → `aspect-ratio`.
- `package.json` — add deps + `test` script.

**Untouched**
- `src/app/[username]/[filename]/PdfPreview.tsx` and the public resume pages keep their iframe (full-page viewing is fine there).

---

## Task 1: Add dependencies and Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install runtime + dev dependencies**

```bash
npm install pdfjs-dist@^4.8.69
npm install -D vitest@^2.1.8
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"` (after `"lint": "eslint"`):

```json
    "lint": "eslint",
    "test": "vitest run"
```

- [ ] **Step 3: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pure-function tests only — no DOM/canvas needed.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Verify the test runner boots (no tests yet → passes vacuously)**

Run: `npm test`
Expected: exits 0 with "No test files found" or a passing run (no error).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add pdfjs-dist and vitest"
```

---

## Task 2: Shared preview config (`cardPreviewDefaults`)

**Files:**
- Create: `src/lib/cardPreviewDefaults.ts`

This is the single source of truth the card and playground both import. No test (pure constants/types).

- [ ] **Step 1: Create the config module**

Create `src/lib/cardPreviewDefaults.ts`:

```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/cardPreviewDefaults.ts
git commit -m "feat: add shared cardPreviewDefaults config"
```

---

## Task 3: Pure render math (TDD)

**Files:**
- Create: `src/lib/pdf/pdfFirstPage.ts`
- Test: `src/lib/pdf/pdfFirstPage.test.ts`

We TDD the two pure functions that decide how big to rasterize. They take a page's natural width (pdf.js viewport width at scale 1, in points) and return the pdf.js render scale and the resulting canvas pixel size — including a clamp so a high `renderScale` × high-DPI screen can't allocate an enormous canvas.

- [ ] **Step 1: Write the failing test**

Create `src/lib/pdf/pdfFirstPage.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `computeRenderScale`/`computeCanvasSize` not exported (module/file missing).

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/pdf/pdfFirstPage.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdf/pdfFirstPage.ts src/lib/pdf/pdfFirstPage.test.ts
git commit -m "feat: add pure render-scale math for pdf first page"
```

---

## Task 4: The pdf.js render function

**Files:**
- Modify: `src/lib/pdf/pdfFirstPage.ts`

Add the browser-only function that loads a PDF, renders page 1 to a canvas using the pure math above, and returns a PNG data URL. The pdf.js library and its worker are imported lazily so they only load when a preview actually renders. Not unit-tested (needs a real canvas/worker) — exercised via the playground.

- [ ] **Step 1: Append the loader + render function to `pdfFirstPage.ts`**

Add to the top of the file (above `computeRenderScale`):

```ts
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

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    return { dataUrl: canvas.toDataURL('image/png'), width, height };
  } finally {
    doc.destroy();
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors. (If TypeScript complains that `canvas` is not a valid render param for the installed pdf.js version, remove the `canvas,` line and keep only `canvasContext` + `viewport`.)

- [ ] **Step 3: Verify pure tests still pass**

Run: `npm test`
Expected: PASS — the 3 math tests still green (the new code isn't imported by the test).

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdf/pdfFirstPage.ts
git commit -m "feat: render pdf first page to a data url via pdf.js"
```

---

## Task 5: `<PdfFirstPage>` component

**Files:**
- Create: `src/components/PdfFirstPage/PdfFirstPage.tsx`
- Create: `src/components/PdfFirstPage/PdfFirstPage.module.css`

A client component that renders page 1 to an image only when scrolled into view, and shows shimmer / error / empty states. Fit mode is pure CSS (`object-fit`), so `contain`/`cover` switch instantly without re-rendering the PDF.

- [ ] **Step 1: Create the component**

Create `src/components/PdfFirstPage/PdfFirstPage.tsx`:

```tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { UploadSimple, FileText } from '@phosphor-icons/react/dist/ssr';
import { renderFirstPageToDataUrl } from '@/lib/pdf/pdfFirstPage';
import { cardPreviewDefaults, type CardPreviewConfig } from '@/lib/cardPreviewDefaults';
import styles from './PdfFirstPage.module.css';

interface PdfFirstPageProps {
  pdfUrl?: string;
  title: string;
  /** Overrides for the shared card preview defaults. */
  config?: Partial<CardPreviewConfig>;
  /** Click handler for the empty (no-PDF) placeholder. */
  onEmptyClick?: () => void;
  emptyTitle?: string;
  emptySubtext?: string;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Renders page 1 of a PDF to an <img>, so it shows identically on every browser
 * (no dependency on a native PDF viewer). Renders lazily on scroll-into-view.
 */
export default function PdfFirstPage({
  pdfUrl,
  title,
  config,
  onEmptyClick,
  emptyTitle = 'No PDF uploaded',
  emptySubtext = 'Click to upload your masterpiece',
}: PdfFirstPageProps) {
  const cfg = { ...cardPreviewDefaults, ...config };
  const hasPdf = Boolean(pdfUrl && pdfUrl !== '#');

  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [image, setImage] = useState<string | null>(null);

  // Reveal-on-scroll: don't touch pdf.js until the card is near the viewport.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !hasPdf) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasPdf]);

  // Render once in view (or when the URL / renderScale changes).
  useEffect(() => {
    if (!hasPdf || !inView || !pdfUrl) return;
    const controller = new AbortController();
    setStatus('loading');
    const cssWidth = rootRef.current?.clientWidth || 320;
    renderFirstPageToDataUrl(pdfUrl, {
      cssWidth,
      renderScale: cfg.renderScale,
      signal: controller.signal,
    })
      .then(({ dataUrl }) => {
        if (controller.signal.aborted) return;
        setImage(dataUrl);
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });
    return () => controller.abort();
  }, [hasPdf, inView, pdfUrl, cfg.renderScale]);

  const activateEmpty = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (!onEmptyClick) return;
    event.stopPropagation();
    event.preventDefault();
    onEmptyClick();
  };

  const boxStyle: React.CSSProperties = {
    aspectRatio: String(cfg.aspectRatio),
    borderRadius: cfg.cornerRadius,
    background: cfg.letterboxBg,
    padding: cfg.previewPadding,
  };

  if (!hasPdf) {
    return (
      <div className={styles.box} style={boxStyle}>
        <div
          className={styles.placeholder}
          role={onEmptyClick ? 'button' : undefined}
          tabIndex={onEmptyClick ? 0 : undefined}
          onClick={onEmptyClick ? activateEmpty : undefined}
          onKeyDown={
            onEmptyClick
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') activateEmpty(event);
                }
              : undefined
          }
          style={{ cursor: onEmptyClick ? 'pointer' : 'default' }}
        >
          <UploadSimple size={32} className={styles.placeholderIcon} />
          <span className={styles.placeholderText}>{emptyTitle}</span>
          <span className={styles.placeholderSubtext}>{emptySubtext}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={styles.box} style={boxStyle}>
      {status === 'ready' && image ? (
        <img
          src={image}
          alt={title}
          className={styles.image}
          style={{
            objectFit: cfg.fitMode,
            objectPosition: cfg.fitMode === 'cover' ? cfg.coverAnchor : 'center',
            borderRadius: cfg.cornerRadius,
          }}
        />
      ) : status === 'error' ? (
        <div className={styles.fallback}>
          <div className={styles.fallbackTile}>
            <FileText size={24} className={styles.fallbackIcon} />
          </div>
          <span className={styles.fallbackSubtext}>Preview unavailable</span>
        </div>
      ) : (
        <div className={styles.skeleton} aria-hidden="true" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the styles**

Create `src/components/PdfFirstPage/PdfFirstPage.module.css`:

```css
.box {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image {
  width: 100%;
  height: 100%;
  display: block;
  animation: fadeIn 0.3s ease;
}

.skeleton {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
    100deg,
    var(--surface-hover) 30%,
    var(--surface) 50%,
    var(--surface-hover) 70%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: var(--surface-hover);
}

.fallbackTile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.fallbackIcon {
  color: var(--text-secondary);
}

.fallbackSubtext {
  font-size: 12px;
  color: var(--text-tertiary);
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, rgba(20, 85, 51, 0.04) 0%, rgba(20, 85, 51, 0.12) 100%);
  border: 2px dashed rgba(20, 85, 51, 0.25);
  transition: background 0.3s ease, border-color 0.3s ease;
}

@media (hover: hover) {
  .placeholder:hover {
    background: linear-gradient(135deg, rgba(20, 85, 51, 0.08) 0%, rgba(20, 85, 51, 0.18) 100%);
    border-color: var(--primary);
  }
}

.placeholderIcon {
  color: var(--primary);
  margin-bottom: 12px;
}

.placeholderText {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.placeholderSubtext {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .image { animation: none; }
  .skeleton { animation: none; background: var(--surface-hover); }
  .placeholder { transition: none; }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PdfFirstPage/
git commit -m "feat: add PdfFirstPage image-based preview component"
```

---

## Task 6: Wire `PdfFirstPage` into `ResumePreview` and `ResumeCard`

**Files:**
- Modify: `src/components/ResumePreview/ResumePreview.tsx`
- Modify: `src/components/ResumeCard/ResumeCard.tsx`
- Modify: `src/components/ResumeCard/ResumeCard.module.css`

`ResumePreview` keeps its public props but delegates rendering to `PdfFirstPage`. `ResumeCard` gains an optional `previewConfig` it forwards. The card's preview box switches from a fixed 240px height to an `aspect-ratio` driven by the config.

- [ ] **Step 1: Replace `ResumePreview` internals**

Replace the entire contents of `src/components/ResumePreview/ResumePreview.tsx` with:

```tsx
'use client';

import React from 'react';
import PdfFirstPage from '@/components/PdfFirstPage/PdfFirstPage';
import type { CardPreviewConfig } from '@/lib/cardPreviewDefaults';

interface ResumePreviewProps {
  pdfUrl?: string;
  title: string;
  /** Overrides for the shared card preview defaults. */
  config?: Partial<CardPreviewConfig>;
  /**
   * Click handler for the empty (no-PDF) placeholder. When omitted the
   * placeholder is non-interactive (e.g. on the dashboard card, where the whole
   * card already links to the detail page).
   */
  onEmptyClick?: () => void;
  emptyTitle?: string;
  emptySubtext?: string;
}

/**
 * The shared PDF thumbnail. Renders page 1 to an image via pdf.js, so it shows
 * identically on every browser — including the Android Chrome / in-app webviews
 * that can't render a PDF inline in an iframe. The parent owns size, border and
 * rounding.
 */
export default function ResumePreview({
  pdfUrl,
  title,
  config,
  onEmptyClick,
  emptyTitle,
  emptySubtext,
}: ResumePreviewProps) {
  return (
    <PdfFirstPage
      pdfUrl={pdfUrl}
      title={title}
      config={config}
      onEmptyClick={onEmptyClick}
      emptyTitle={emptyTitle}
      emptySubtext={emptySubtext}
    />
  );
}
```

- [ ] **Step 2: Delete the now-unused CSS**

The old iframe/skeleton/fallback styles now live in `PdfFirstPage.module.css`. Delete `src/components/ResumePreview/ResumePreview.module.css` (no longer imported).

```bash
git rm src/components/ResumePreview/ResumePreview.module.css
```

- [ ] **Step 3: Forward `previewConfig` from `ResumeCard`**

In `src/components/ResumeCard/ResumeCard.tsx`:

Add the import near the other imports (after line 21):

```tsx
import type { CardPreviewConfig } from '@/lib/cardPreviewDefaults';
```

Add to `ResumeCardProps` (after the `onReplaceClick?` line, ~line 38):

```tsx
  /** Overrides for the preview layout (used by the playground). */
  previewConfig?: Partial<CardPreviewConfig>;
```

Add `previewConfig` to the destructured props (after `onReplaceClick,`, ~line 56):

```tsx
  onReplaceClick,
  previewConfig,
```

Pass it to the preview. Replace this line (~149):

```tsx
          <ResumePreview pdfUrl={pdfUrl} title={title} />
```

with:

```tsx
          <ResumePreview pdfUrl={pdfUrl} title={title} config={previewConfig} />
```

- [ ] **Step 4: Make the preview box aspect-ratio driven**

In `src/components/ResumeCard/ResumeCard.module.css`, replace the `.imageContainer` rule:

```css
.imageContainer {
  height: 240px;
  background: var(--surface-hover);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  position: relative;
}
```

with (height now comes from the preview's own `aspect-ratio`):

```css
.imageContainer {
  background: var(--surface-hover);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  position: relative;
}
```

- [ ] **Step 5: Verify it compiles and the dashboard still builds**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors; build succeeds.

- [ ] **Step 6: Manually verify the dashboard preview renders**

Run: `npm run dev`, open `/dashboard` in Chrome with at least one resume that has a PDF.
Expected: each card shows the rendered first page as an image (not an iframe). Check Elements panel — the preview is an `<img>`, no `<iframe>`.

- [ ] **Step 7: Commit**

```bash
git add src/components/ResumePreview/ src/components/ResumeCard/
git commit -m "feat: render resume cards via PdfFirstPage image preview"
```

---

## Task 7: Minimal DialKit control panel

**Files:**
- Create: `src/components/DialKit/useDialKit.tsx`
- Create: `src/components/DialKit/DialKit.module.css`

A lightweight live control panel (the DialKit pattern). `useDialKit` takes a schema describing each control, returns the current values plus a `panel` node to render. Supports number sliders, toggles, selects, and color pickers — enough for our dials.

- [ ] **Step 1: Create the hook + panel**

Create `src/components/DialKit/useDialKit.tsx`:

```tsx
'use client';

import React, { useState } from 'react';
import styles from './DialKit.module.css';

type NumberControl = { type: 'number'; value: number; min: number; max: number; step?: number };
type ToggleControl = { type: 'toggle'; value: boolean };
type SelectControl = { type: 'select'; value: string; options: string[] };
type ColorControl = { type: 'color'; value: string };
type Control = NumberControl | ToggleControl | SelectControl | ColorControl;

export type DialSchema = Record<string, Control>;

type ValueOf<C> = C extends NumberControl
  ? number
  : C extends ToggleControl
    ? boolean
    : C extends SelectControl
      ? string
      : C extends ColorControl
        ? string
        : never;

type Values<S extends DialSchema> = { [K in keyof S]: ValueOf<S[K]> };

/** Live control panel. Returns current values and a `panel` node to render. */
export function useDialKit<S extends DialSchema>(
  title: string,
  schema: S,
): { values: Values<S>; panel: React.ReactNode } {
  const [values, setValues] = useState<Values<S>>(() => {
    const initial = {} as Values<S>;
    (Object.keys(schema) as (keyof S)[]).forEach((key) => {
      initial[key] = schema[key].value as Values<S>[keyof S];
    });
    return initial;
  });

  const set = <K extends keyof S>(key: K, value: Values<S>[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const panel = (
    <aside className={styles.panel} aria-label={`${title} controls`}>
      <h2 className={styles.title}>{title}</h2>
      {(Object.keys(schema) as (keyof S & string)[]).map((key) => {
        const control = schema[key];
        return (
          <label key={key} className={styles.row}>
            <span className={styles.label}>{key}</span>
            {control.type === 'number' && (
              <span className={styles.numberControl}>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step ?? 0.01}
                  value={values[key] as number}
                  onChange={(e) => set(key, Number(e.target.value) as Values<S>[typeof key])}
                />
                <output className={styles.value}>{(values[key] as number).toFixed(2)}</output>
              </span>
            )}
            {control.type === 'toggle' && (
              <input
                type="checkbox"
                checked={values[key] as boolean}
                onChange={(e) => set(key, e.target.checked as Values<S>[typeof key])}
              />
            )}
            {control.type === 'select' && (
              <select
                value={values[key] as string}
                onChange={(e) => set(key, e.target.value as Values<S>[typeof key])}
              >
                {control.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
            {control.type === 'color' && (
              <input
                type="color"
                value={values[key] as string}
                onChange={(e) => set(key, e.target.value as Values<S>[typeof key])}
              />
            )}
          </label>
        );
      })}
    </aside>
  );

  return { values, panel };
}
```

- [ ] **Step 2: Create the styles**

Create `src/components/DialKit/DialKit.module.css`:

```css
.panel {
  position: sticky;
  top: 24px;
  align-self: start;
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
  margin: 0;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--text-primary);
}

.label {
  flex-shrink: 0;
}

.numberControl {
  display: flex;
  align-items: center;
  gap: 8px;
}

.numberControl input[type='range'] {
  width: 120px;
}

.value {
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--text-tertiary);
  width: 38px;
  text-align: right;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/DialKit/
git commit -m "feat: add minimal DialKit live control panel"
```

---

## Task 8: Same-origin sample PDF

**Files:**
- Create: `public/samples/sample-resume.pdf`

A small same-origin PDF so the playground works offline / without CORS. (Real UploadThing URLs can also be pasted in.)

- [ ] **Step 1: Write a minimal one-page PDF**

Run this exact command from the repo root to create the file:

```bash
mkdir -p public/samples && cat > public/samples/sample-resume.pdf <<'PDF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT /F1 28 Tf 60 760 Td (Jane Doe) Tj ET
BT /F1 13 Tf 60 730 Td (Senior Product Engineer) Tj ET
BT /F1 11 Tf 60 700 Td (Experience  -  Education  -  Skills) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000412 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
484
%%EOF
PDF
echo "wrote public/samples/sample-resume.pdf"
```

- [ ] **Step 2: Verify the PDF opens**

Run: `npm run dev`, then open `http://localhost:3000/samples/sample-resume.pdf` in the browser.
Expected: a one-page PDF showing "Jane Doe / Senior Product Engineer". (If the browser can't render it, the bytes are still a valid PDF for pdf.js — the playground in Task 9 is the real check.)

- [ ] **Step 3: Commit**

```bash
git add public/samples/sample-resume.pdf
git commit -m "chore: add same-origin sample resume pdf for playground"
```

---

## Task 9: The playground route

**Files:**
- Create: `src/app/playground/resume-card/page.tsx`
- Create: `src/app/playground/resume-card/PlaygroundClient.tsx`
- Create: `src/app/playground/resume-card/Playground.module.css`

A kept, `noindex` route outside auth. Renders a live grid of mock cards bound to the DialKit values, a "paste a PDF URL" input, and an old-iframe vs new-pdf.js side-by-side toggle.

- [ ] **Step 1: Create the route entry (server component, noindex)**

Create `src/app/playground/resume-card/page.tsx`:

```tsx
import type { Metadata } from 'next';
import PlaygroundClient from './PlaygroundClient';

export const metadata: Metadata = {
  title: 'Resume card playground',
  robots: { index: false, follow: false },
};

export default function ResumeCardPlaygroundPage() {
  return <PlaygroundClient />;
}
```

- [ ] **Step 2: Create the client playground**

Create `src/app/playground/resume-card/PlaygroundClient.tsx`:

```tsx
'use client';

import React, { useState } from 'react';
import { useDialKit } from '@/components/DialKit/useDialKit';
import PdfFirstPage from '@/components/PdfFirstPage/PdfFirstPage';
import { cardPreviewDefaults, type FitMode, type CoverAnchor } from '@/lib/cardPreviewDefaults';
import styles from './Playground.module.css';

const SAMPLE_URL = '/samples/sample-resume.pdf';
const BROKEN_URL = '/samples/does-not-exist.pdf';

export default function PlaygroundClient() {
  const [extraUrl, setExtraUrl] = useState('');
  const [showOldVsNew, setShowOldVsNew] = useState(false);

  const { values, panel } = useDialKit('Card preview', {
    aspectRatio: { type: 'number', value: cardPreviewDefaults.aspectRatio, min: 0.4, max: 1.4, step: 0.001 },
    fitMode: { type: 'select', value: cardPreviewDefaults.fitMode, options: ['contain', 'cover'] },
    coverAnchor: { type: 'select', value: cardPreviewDefaults.coverAnchor, options: ['top', 'center'] },
    renderScale: { type: 'number', value: cardPreviewDefaults.renderScale, min: 1, max: 4, step: 0.25 },
    cornerRadius: { type: 'number', value: cardPreviewDefaults.cornerRadius, min: 0, max: 24, step: 1 },
    cardWidth: { type: 'number', value: 320, min: 220, max: 460, step: 10 },
    previewPadding: { type: 'number', value: cardPreviewDefaults.previewPadding, min: 0, max: 32, step: 1 },
    letterboxBg: { type: 'color', value: '#ffffff' },
    showTitle: { type: 'toggle', value: true },
    showMeta: { type: 'toggle', value: true },
  });

  const config = {
    aspectRatio: values.aspectRatio,
    fitMode: values.fitMode as FitMode,
    coverAnchor: values.coverAnchor as CoverAnchor,
    renderScale: values.renderScale,
    cornerRadius: values.cornerRadius,
    previewPadding: values.previewPadding,
    letterboxBg: values.letterboxBg,
  };

  const urls = [SAMPLE_URL, SAMPLE_URL, BROKEN_URL, ...(extraUrl ? [extraUrl] : [])];

  return (
    <div className={styles.layout}>
      <div className={styles.controls}>
        {panel}
        <div className={styles.extraControls}>
          <label className={styles.urlRow}>
            <span>Paste a PDF URL</span>
            <input
              type="url"
              placeholder="https://…/resume.pdf"
              value={extraUrl}
              onChange={(e) => setExtraUrl(e.target.value)}
            />
          </label>
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={showOldVsNew}
              onChange={(e) => setShowOldVsNew(e.target.checked)}
            />
            <span>Compare old iframe vs new pdf.js</span>
          </label>
        </div>
      </div>

      <main className={styles.stage}>
        {showOldVsNew ? (
          <div className={styles.compareRow}>
            <figure className={styles.compareCell}>
              <figcaption>Old: native iframe</figcaption>
              <div className={styles.card} style={{ width: values.cardWidth }}>
                <div
                  className={styles.preview}
                  style={{ aspectRatio: String(values.aspectRatio) }}
                >
                  <iframe
                    src={`${SAMPLE_URL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    title="old preview"
                    className={styles.iframe}
                  />
                </div>
              </div>
            </figure>
            <figure className={styles.compareCell}>
              <figcaption>New: pdf.js image</figcaption>
              <div className={styles.card} style={{ width: values.cardWidth }}>
                <div className={styles.preview}>
                  <PdfFirstPage pdfUrl={SAMPLE_URL} title="new preview" config={config} />
                </div>
              </div>
            </figure>
          </div>
        ) : (
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${values.cardWidth}px, 1fr))` }}
          >
            {urls.map((url, i) => (
              <div key={`${url}-${i}`} className={styles.card}>
                <div className={styles.preview}>
                  <PdfFirstPage pdfUrl={url} title={`Sample ${i + 1}`} config={config} />
                </div>
                {values.showTitle && <h3 className={styles.cardTitle}>Sample resume {i + 1}</h3>}
                {values.showMeta && <p className={styles.cardMeta}>v1 · 14/06/2026</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Create the styles**

Create `src/app/playground/resume-card/Playground.module.css`:

```css
.layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 24px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.extraControls {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: 13px;
}

.urlRow {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.urlRow input {
  padding: 8px 10px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-primary);
}

.toggleRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage {
  flex: 1;
  min-width: 0;
}

.grid {
  display: grid;
  gap: 24px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.preview {
  background: var(--surface-hover);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  position: relative;
}

.iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.cardTitle {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 14px 16px 4px;
}

.cardMeta {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 16px 16px;
}

.compareRow {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.compareCell {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compareCell figcaption {
  font-size: 13px;
  color: var(--text-secondary);
}
```

- [ ] **Step 4: Verify it compiles and builds**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors; the `/playground/resume-card` route appears in the build output.

- [ ] **Step 5: Manually verify the playground**

Run: `npm run dev`, open `http://localhost:3000/playground/resume-card`.
Expected:
- A grid of cards: two render the sample resume as a crisp image; one shows the "Preview unavailable" error state (the broken URL).
- Dragging `aspectRatio`, `fitMode`, `renderScale`, `cardWidth`, etc. updates the cards live.
- Switching `fitMode` between `contain`/`cover` changes the crop instantly (no re-render flash).
- Pasting a real UploadThing PDF URL adds a fourth card that renders it.
- Toggling "Compare old iframe vs new pdf.js" shows them side by side.

- [ ] **Step 6: Commit**

```bash
git add src/app/playground/
git commit -m "feat: add resume card DialKit playground"
```

---

## Task 10: Final verification + tune defaults

**Files:**
- Modify (maybe): `src/lib/cardPreviewDefaults.ts`

- [ ] **Step 1: Full check**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: tests pass, no type errors, lint clean, build succeeds.

- [ ] **Step 2: Cross-browser sanity (the core fix)**

With `npm run dev` running, open `/dashboard` (or the playground) in a browser where the old iframe failed — e.g. a Chromium with the PDF viewer disabled (`chrome://settings/content/pdfDocuments` → "Download PDFs"), or a mobile/Android device on the same network.
Expected: the first-page image still renders (proving we no longer depend on the native PDF viewer).

- [ ] **Step 3: Lock in the tuned defaults**

Once you've dialed in the look in the playground, copy the chosen `aspectRatio`, `fitMode`, `coverAnchor`, `renderScale`, `cornerRadius`, `letterboxBg`, and `previewPadding` values into `cardPreviewDefaults` in `src/lib/cardPreviewDefaults.ts`. Reload `/dashboard` to confirm the cards match the playground.

- [ ] **Step 4: Commit (if defaults changed)**

```bash
git add src/lib/cardPreviewDefaults.ts
git commit -m "feat: set tuned resume card preview defaults"
```

---

## Self-Review Notes

- **Spec coverage:** Rendering core (Tasks 4–5), card swap (Task 6), playground + DialKit + samples + old-vs-new toggle (Tasks 7–9), unit test of render helper math (Task 3), public pages untouched (Task 6 only edits card path) — all covered.
- **Testing reality:** The repo had no test runner and pdf.js can't be meaningfully unit-tested in jsdom, so tests cover the pure scale/size math; pdf.js IO and visuals are verified in the playground (Tasks 5/9) and cross-browser (Task 10).
- **Type consistency:** `CardPreviewConfig`, `FitMode`, `CoverAnchor`, `renderFirstPageToDataUrl`, `computeRenderScale`, `computeCanvasSize`, `useDialKit` signatures are defined once and reused as written.
- **Worker caveat:** Task 4 notes the `new URL(..., import.meta.url)` worker pattern; if a bundler can't resolve it, fall back to copying `pdf.worker.min.mjs` into `public/` and setting `workerSrc` to `/pdf.worker.min.mjs`.
