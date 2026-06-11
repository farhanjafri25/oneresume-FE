# Onboarding Design Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the accessibility and motion-polish gaps in the newly simplified 3-step onboarding flow (Upload → ATS Score → Copy Link).

**Architecture:** Five targeted fixes across the onboarding step components, the shared onboarding CSS module, and the analytics page. No new dependencies — reuse the existing `motion/react` tokens in `src/lib/motion.ts`. Reduced-motion is already handled globally by `MotionProvider` (`MotionConfig reducedMotion="user"`) plus the `prefers-reduced-motion` block in `globals.css`, so no per-component reduced-motion code is required.

**Tech Stack:** Next.js 16 (App Router), React 19, `motion` (framer) v12, CSS Modules.

**Verification note:** These are accessibility + visual/animation changes; automated unit tests add little value here. Each task verifies with `npx tsc --noEmit`, `npm run build`, and a specific manual observation. Keyboard/SR checks are done by hand.

---

## File Structure

- `src/app/(onboarding)/onboarding/steps/UploadStep.tsx` — dropzone becomes a keyboard-accessible `<label>` + visually-hidden input; optional drag-and-drop.
- `src/app/(onboarding)/onboarding/Onboarding.module.css` — `:focus-within` ring on dropzone, `.srOnly` util, `.evalCard` min-height, drag-active style.
- `src/app/(onboarding)/onboarding/steps/ScoreStep.tsx` — stagger the metric cards.
- `src/app/(main)/dashboard/analytics/[resumeId]/WelcomeBanner.tsx` — new client component (animated, dismissible coachmark).
- `src/app/(main)/dashboard/analytics/[resumeId]/page.tsx` — render `WelcomeBanner` instead of the inline banner.

---

## Task 1: Keyboard-accessible upload dropzone (High / a11y)

**Why:** The dropzone is a `<div onClick>` wrapping a `display:none` `<input type=file>`. It cannot receive focus, has no `role`, and does not respond to Enter/Space — keyboard and screen-reader users cannot upload. It is the first screen of onboarding.

**Fix:** Make the styled dropzone a `<label htmlFor>` and visually hide (not `display:none`) the input so it stays focusable; add a `:focus-within` ring so the dropzone shows focus. Native label semantics give click + keyboard + SR support for free.

**Files:**
- Modify: `src/app/(onboarding)/onboarding/steps/UploadStep.tsx`
- Modify: `src/app/(onboarding)/onboarding/Onboarding.module.css`

- [ ] **Step 1: Add a visually-hidden utility and focus-within ring to the CSS module**

Append to `src/app/(onboarding)/onboarding/Onboarding.module.css`:

```css
/* Visually hidden but still focusable (keeps the file input keyboard-reachable). */
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus ring on the dropzone when its hidden input is focused (keyboard). */
.dropzone:focus-within {
  border-color: var(--primary);
  background: var(--surface-hover);
  box-shadow: 0 0 0 3px rgba(20, 85, 51, 0.12);
}

/* Active drag state. */
.dropzoneActive {
  border-color: var(--primary);
  background: var(--surface-hover);
}
```

- [ ] **Step 2: Convert the dropzone `<div>` to a `<label>` with a focusable input**

In `src/app/(onboarding)/onboarding/steps/UploadStep.tsx`, replace the dropzone block. Remove the `fileInputRef` and its `useRef` import usage (no longer needed — the label drives the native input). New markup:

```tsx
<label className={styles.dropzone} htmlFor="cv-file">
  <input
    id="cv-file"
    type="file"
    name="file"
    className={styles.srOnly}
    accept="application/pdf"
    disabled={isPending}
    onChange={(e) => {
      if (e.target.files?.length) setSelectedFileName(e.target.files[0].name);
    }}
  />
  <div className={styles.dropzoneIcon}><UploadCloud size={22} /></div>
  <h3 className={styles.dropzoneTitle}>
    {isPending
      ? 'Uploading…'
      : selectedFileName
      ? `Selected: ${selectedFileName}`
      : 'Click to browse or drag and drop your resume'}
  </h3>
  <p className={styles.dropzoneDesc}>PDF only up to 2MB</p>
</label>
```

Then delete the now-unused `const fileInputRef = useRef<HTMLInputElement>(null);` line and drop `useRef` from the React import if nothing else uses it.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS, no errors.

- [ ] **Step 4: Manual a11y check**

Run `npm run dev`, open `/onboarding`. Tab with the keyboard until focus reaches the dropzone — confirm a visible focus ring appears on the dashed box. Press Enter or Space — confirm the OS file picker opens. Pick a PDF — confirm the title updates to "Selected: …" and the flow auto-advances after submit.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(onboarding)/onboarding/steps/UploadStep.tsx" "src/app/(onboarding)/onboarding/Onboarding.module.css"
git commit -m "fix(onboarding): make upload dropzone keyboard and screen-reader accessible"
```

---

## Task 2: Remove the score-step height lurch (Medium / jank)

**Why:** `.evalCard` wraps both the short loading state (centered spinner, ~64px padding) and the tall report. When the report lands the card grows abruptly. A shared `min-height` floor keeps the transition steady.

**Files:**
- Modify: `src/app/(onboarding)/onboarding/Onboarding.module.css`

- [ ] **Step 1: Add a min-height to `.evalCard`**

In `Onboarding.module.css`, update the `.evalCard` rule to add a floor (keep all existing properties):

```css
.evalCard {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 36px;
  max-width: 720px;
  min-height: 440px;   /* shared floor so loading → report doesn't lurch */
  margin: 0 auto;
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Manual check**

In dev, advance to the ATS Score step. Confirm the spinner state and the loaded report occupy roughly the same vertical space (no large jump when the score arrives).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(onboarding)/onboarding/Onboarding.module.css"
git commit -m "fix(onboarding): give the score card a min-height to avoid layout lurch"
```

---

## Task 3: Stagger the ATS metric cards (Low / polish)

**Why:** All four metric cards (Parsability, Section Formatting, Action Verbs, Contact Information) currently fade in simultaneously at `stage >= 3`. Staggering them per index matches the storyboard craft used elsewhere and makes the reveal feel intentional.

**Files:**
- Modify: `src/app/(onboarding)/onboarding/steps/ScoreStep.tsx`

- [ ] **Step 1: Convert the metric cards to staggered `motion.div`s**

In `ScoreStep.tsx`, replace the metric-cards `.map` block (inside the `styles.skillsGrid` motion container) with per-card motion + index delay:

```tsx
{metrics.map(({ icon: Icon, title, value }, i) => (
  <motion.div
    key={title}
    className={styles.skillsCol}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 12 }}
    transition={{ ...transitions.base, delay: i * 0.06 }}
  >
    <h4 className={`${styles.skillsTitle} ${styles.matchingTitle}`}>
      <Icon size={16} />
      {title}
    </h4>
    <p className={styles.scoreBody}>{value || 'No issues detected.'}</p>
  </motion.div>
))}
```

The parent `styles.skillsGrid` stays a `motion.div` but its own `animate` can keep just the opacity fade; the children now own the staggered upward motion. `transitions` is already imported.

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 3: Manual check**

In dev, reach the score report and confirm the four cards rise in sequence (top-left first), not all at once. With OS "Reduce Motion" on, confirm they appear without the upward slide (handled globally by MotionConfig).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(onboarding)/onboarding/steps/ScoreStep.tsx"
git commit -m "polish(onboarding): stagger ATS score metric cards on reveal"
```

---

## Task 4: Animated, dismissible analytics welcome banner (Low / polish)

**Why:** The `?welcome=1` coachmark is inline server-rendered markup with no entrance and no way to dismiss; it also reappears on every refresh because the query param sticks. Extract a small client component that slides in and can be dismissed.

**Files:**
- Create: `src/app/(main)/dashboard/analytics/[resumeId]/WelcomeBanner.tsx`
- Modify: `src/app/(main)/dashboard/analytics/[resumeId]/page.tsx`

- [ ] **Step 1: Create the client banner component**

Create `src/app/(main)/dashboard/analytics/[resumeId]/WelcomeBanner.tsx`:

```tsx
'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, X } from 'lucide-react';
import { slideUp } from '@/lib/motion';

export default function WelcomeBanner() {
  const [open, setOpen] = useState(true);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={slideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
            borderRadius: '12px',
            border: '1px solid var(--primary)',
            background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
            color: 'var(--text-primary)',
            fontSize: '14px',
          }}
        >
          <Award size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            You&apos;re all set! This is your analytics home. Share your link with recruiters and
            their views will start showing up right here.
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Dismiss welcome message"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Swap the inline banner for the component in the page**

In `src/app/(main)/dashboard/analytics/[resumeId]/page.tsx`, add the import near the top:

```tsx
import WelcomeBanner from './WelcomeBanner';
```

Then replace the inline `{welcome && ( <div style={{…}}> … </div> )}` block (the one added after `<header>`) with:

```tsx
{welcome && <WelcomeBanner />}
```

The `Award` import on the page can stay (still used elsewhere) or be removed if no longer referenced — verify with the build's unused-import behavior.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 4: Manual check**

Visit `/dashboard/analytics/<resumeId>?welcome=1`. Confirm the banner slides up on load and the X dismisses it with an exit animation. With Reduce Motion on, it should appear/disappear without the slide.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/dashboard/analytics/[resumeId]/WelcomeBanner.tsx" "src/app/(main)/dashboard/analytics/[resumeId]/page.tsx"
git commit -m "polish(analytics): animate and allow dismissing the onboarding welcome banner"
```

---

## Task 5: Honor the "drag and drop" copy (Low / correctness)

**Why:** The dropzone copy promises drag-and-drop, but only `onClick`/label selection is wired. Either implement drop or soften the copy. This task implements drop (small, and the affordance already reads as a dropzone).

**Files:**
- Modify: `src/app/(onboarding)/onboarding/steps/UploadStep.tsx`

- [ ] **Step 1: Add drag state + a hidden form input synced to the dropped file**

Because the form submits via the native `<input type=file name="file">`, the simplest robust approach is to assign the dropped file to that input's `files` and trigger its change. Add to `UploadStep`:

```tsx
const [dragActive, setDragActive] = useState(false);

const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
  e.preventDefault();
  setDragActive(false);
  const file = e.dataTransfer.files?.[0];
  if (!file || isPending) return;
  const input = document.getElementById('cv-file') as HTMLInputElement | null;
  if (input) {
    input.files = e.dataTransfer.files;
    setSelectedFileName(file.name);
  }
};
```

Wire the handlers on the `<label>` and apply the active class:

```tsx
<label
  className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
  htmlFor="cv-file"
  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
  onDragLeave={() => setDragActive(false)}
  onDrop={onDrop}
>
```

(`.dropzoneActive` was added in Task 1, Step 1.)

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 3: Manual check**

In dev, drag a PDF over the dropzone — confirm it highlights (`dropzoneActive`) — and drop it — confirm "Selected: …" updates and Continue enables. If implementing drop proves flaky in the target browsers, fall back to changing the copy to "Click to browse and upload your resume" and skip the handlers.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(onboarding)/onboarding/steps/UploadStep.tsx"
git commit -m "feat(onboarding): support drag-and-drop on the upload dropzone"
```

---

## Self-Review

- **Coverage:** Tasks map 1:1 to the five critique findings (a11y dropzone, card lurch, metric stagger, welcome banner, drag-drop copy). The three "already correct" items (reduced motion, tabular-nums, tap targets/iOS zoom) need no tasks.
- **Type consistency:** `selectedFileName`/`setSelectedFileName`, `isPending`, and the `cv-file` input id are referenced consistently across Tasks 1 and 5. `.dropzoneActive` is defined in Task 1 and used in Task 5. `slideUp`/`transitions` come from the existing `src/lib/motion.ts`.
- **No placeholders:** every code step shows complete code and an exact verification command.
- **Priority:** Task 1 is the only High-severity item; Tasks 2–5 are incremental polish and can be deferred or dropped without breaking the flow.
