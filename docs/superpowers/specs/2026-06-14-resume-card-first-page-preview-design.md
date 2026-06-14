# Resume card first-page previews + DialKit playground

**Date:** 2026-06-14
**Status:** Approved — ready for implementation planning

## Problem

Resume cards on the dashboard currently preview a resume by embedding the PDF in
an `<iframe>` (`ResumePreview.tsx`, `view=FitH`). This has three failure modes:

1. **Doesn't render at all for some users.** The iframe relies on the browser's
   built-in PDF viewer. Many environments don't have one and refuse to render
   inline — Android Chrome, in-app webviews (Instagram / LinkedIn browsers), some
   Firefox configs, locked-down corporate browsers. Those users hit the
   `navigator.pdfViewerEnabled === false` path and get a "Tap to open" fallback or
   a blank box.
2. **Looks bad as a card.** A portrait A4 page rendered into a short landscape box
   (240px tall in a ~320px card) is cropped/zoomed inconsistently.
3. **Heavy / inconsistent UX.** Iframes flicker, are slow, and render differently
   per browser.

The goal: every card shows a **crisp, consistent image of the first page**, identical
on every device, and a **playground** to tune the card layout by eye.

## Root-cause fix

Stop embedding the PDF. Render **page 1 to an image** ourselves with `pdfjs-dist`
(pdf.js). An `<img>`/`<canvas>` renders everywhere — no dependency on a native PDF
viewer. (Approach B — server-side thumbnail generation at upload time — was
considered but is out of scope: this is the frontend repo, the stack is UploadThing
with raw `utfs.sh` URLs and no image-transform CDN, and it would require a
backend `thumbnailUrl` model change. If B is added later, the card component won't
need to change — it just consumes an image.)

## Design

### 1. Rendering core — `<PdfFirstPage>`

A client component that rasterizes page 1 of a PDF to an image.

- Uses `pdfjs-dist`. The worker is lazy-loaded once and cached.
- Rendering only starts when the element scrolls into view (`IntersectionObserver`),
  so off-screen cards cost nothing.
- Renders page 1 to a `<canvas>` at a tunable DPI (`renderScale`), then displays it.
- Two fit modes from the same bitmap, so switching is instant:
  - `contain` — full page visible, letterboxed (A4-proportioned card).
  - `cover` — fills card width, top-anchored crop (compact "document peeking out").
- States: shimmer skeleton while rendering → image; **error fallback** for
  corrupt/unreachable PDFs; **empty state** for no PDF. Error + empty reuse the
  existing placeholder styling so nothing regresses.
- No reliance on `navigator.pdfViewerEnabled`; the old Android "Tap to open"
  fallback is no longer needed for previews.
- Client-only (guard SSR — pdf.js touches `DOMMatrix`/`canvas`).

### 2. `ResumeCard` / `ResumePreview` updates

- `ResumePreview` swaps its `<iframe>` for `<PdfFirstPage>`, keeping the same
  props and empty-state contract so `ResumeCard` barely changes.
- New tunable layout props, defaulted from a single shared `cardPreviewDefaults`
  object: `aspectRatio` (default A4 portrait ≈ 0.707), `fitMode` (`contain`),
  `coverAnchor` (`top`), `renderScale`, `cornerRadius`, preview padding, letterbox
  background.
- Both the card and the playground import `cardPreviewDefaults`, so dialed-in
  playground values become the shipped defaults by editing one file.
- No layout shift: the preview reserves space via fixed `aspect-ratio` before the
  image loads. Fade-in respects `prefers-reduced-motion`.

### 3. DialKit playground — `/playground/resume-card`

Standalone, kept route, outside auth, `noindex`. Live grid of mock resume cards
using sample PDFs, with a DialKit control panel bound to the same
`cardPreviewDefaults` the real card uses.

Live dials:
- `aspectRatio` (A4 ↔ square ↔ wide), `fitMode` (`contain`/`cover`), `coverAnchor`
  (top/center, only when `cover`).
- `renderScale`/DPI, `cornerRadius`, `cardWidth` (grid column min), letterbox
  background color, preview padding.
- Toggles: title on/off, version meta on/off, hover-lift on/off.

Sample data: a few bundled sample PDFs in `public/samples/` **plus a "paste a PDF
URL" input** to drop in a real UploadThing URL (and a deliberately broken URL to
exercise the error state).

Bonus: an **old-iframe vs new-pdf.js** side-by-side toggle so the "doesn't work at
all" fix is visually obvious.

When tuning is done, copy the dialed-in numbers into `cardPreviewDefaults`.

### 4. Files

**New**
- `src/components/PdfFirstPage/PdfFirstPage.tsx` (+ `.module.css`)
- `src/lib/pdf/pdfFirstPage.ts` — pdf.js loader + page-1 render helper
- `src/lib/cardPreviewDefaults.ts` — shared defaults
- `src/app/playground/resume-card/page.tsx` + `PlaygroundClient.tsx` (+ `.module.css`)
- `src/components/DialKit/useDialKit.ts` (+ panel component/css) — DialKit pattern
- `public/samples/*.pdf` — sample resumes

**Edit**
- `src/components/ResumePreview/ResumePreview.tsx` — iframe → `PdfFirstPage`
- `src/components/ResumeCard/ResumeCard.tsx` — prop pass-through

**Dependency**
- add `pdfjs-dist`

**Untouched**
- Public resume pages (`src/app/[username]/[filename]/PdfPreview.tsx`) keep their
  full iframe — full-page viewing is fine there. This change is scoped to
  card/thumbnail previews only.

### Testing

- Playground is the manual visual harness (includes a broken URL for the error state).
- Unit-test the render helper (`pdfFirstPage.ts`): page-1 → canvas dimensions and
  scale math, with a tiny fixture PDF. Guard against SSR.

## Out of scope

- Backend thumbnail generation (Approach B).
- Changing the public resume page viewers.
- Dashboard data/IA changes (still shows default variant per resume).
