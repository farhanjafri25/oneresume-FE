# AI Resume Builder — Design-Engineering Polish Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layer Emil Kowalski's design-engineering craft and Josh Puckett's Interface Craft principles onto the already-shipped AI Resume Builder redesign — correct form semantics, label/input a11y, motion, focus management, and loading-state polish — without changing the IA.

**Architecture:** The builder lives at `src/app/(main)/dashboard/ai-builder/[resumeId]/` (`page.tsx`, `AiBuilderClient.tsx`, `AiBuilder.module.css`) and uses two shared components built in the redesign: `src/components/Stepper/` and `src/components/ResumeHtmlPreview/`. This plan extracts two pure helpers into `src/lib` / a Stepper sibling so they become unit-testable, then applies focused craft fixes file-by-file. Motion uses `motion/react`, already wrapped app-wide in `MotionConfig reducedMotion="user"` (`src/components/motion/MotionProvider.tsx`), so new animations inherit reduced-motion handling.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, CSS Modules, `motion` (Framer Motion) v12, Vitest v2 (node env, pure-function tests only — `vitest.config.ts` sets `environment: 'node'`, `include: ['src/**/*.test.ts']`). Phosphor icons. Sonner toasts.

**Testing note:** The Vitest config runs in **node** and only matches `*.test.ts` (not `.tsx`) — DOM/component rendering is not testable here. So pure logic (concurrency limiter, step-status) is built test-first; visual/interaction tasks are verified by `npx tsc --noEmit`, `npm run lint`, `npm run build`, and a manual dev-server checklist (Task 10). Do not fabricate component tests the harness can't run.

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `src/lib/concurrency.ts` | Bounded-concurrency runner (`runWithLimit`) | Create |
| `src/lib/concurrency.test.ts` | Unit tests for the runner | Create |
| `src/components/Stepper/stepStatus.ts` | Pure `statusFor` + `StepStatus` type | Create |
| `src/components/Stepper/stepStatus.test.ts` | Unit tests for `statusFor` | Create |
| `src/components/Stepper/Stepper.tsx` | Consume `stepStatus`; add `aria-current` | Modify |
| `src/components/Stepper/Stepper.module.css` | Remove weight-shift on current label | Modify |
| `src/components/ResumeHtmlPreview/ResumeHtmlPreview.tsx` | Shimmer skeleton while loading | Modify |
| `src/components/ResumeHtmlPreview/ResumeHtmlPreview.module.css` | Shimmer keyframe (transform-only) | Modify |
| `src/components/motion/Modal.tsx` | Return focus to trigger on close; focus panel on open | Modify |
| `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx` | Forms, labels, input types, step-transition motion, thumbnail polish, import extracted helpers | Modify |
| `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilder.module.css` | Label cursor, thumbnail press feedback, hover-guard back link | Modify |

---

## Task 1: Extract `runWithLimit` into a tested util

**Why:** `runWithLimit` is currently a private function inside `AiBuilderClient.tsx`, so it can't be tested and can't be reused. Extracting it to `src/lib` makes it unit-testable (node env) and matches the codebase's "centralized helpers" convention.

**Files:**
- Create: `src/lib/concurrency.ts`
- Test: `src/lib/concurrency.test.ts`
- Modify: `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/concurrency.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { runWithLimit } from './concurrency';

describe('runWithLimit', () => {
  it('runs every task exactly once', async () => {
    const done: number[] = [];
    await runWithLimit(
      [0, 1, 2, 3, 4].map((i) => () => Promise.resolve().then(() => { done.push(i); })),
      2,
    );
    expect(done.slice().sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it('never exceeds the concurrency limit', async () => {
    let active = 0;
    let peak = 0;
    const task = () =>
      new Promise<void>((resolve) => {
        active += 1;
        peak = Math.max(peak, active);
        setTimeout(() => { active -= 1; resolve(); }, 5);
      });
    await runWithLimit(Array.from({ length: 8 }, () => task), 3);
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
  });

  it('handles fewer tasks than the limit', async () => {
    const done: number[] = [];
    await runWithLimit([() => Promise.resolve().then(() => { done.push(1); })], 4);
    expect(done).toEqual([1]);
  });

  it('resolves immediately for an empty task list', async () => {
    await expect(runWithLimit([], 3)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/lib/concurrency.test.ts`
Expected: FAIL — `Failed to resolve import "./concurrency"` (module does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/concurrency.ts`:

```ts
/**
 * Run an array of async thunks with a maximum number running at once. Used to
 * render resume-layout previews (an AI/render call) without firing all of them
 * in a single burst. Resolves when every thunk has completed.
 */
export async function runWithLimit(
  thunks: Array<() => Promise<void>>,
  limit: number,
): Promise<void> {
  const queue = [...thunks];
  const workers = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length) {
        const fn = queue.shift();
        if (fn) await fn();
      }
    },
  );
  await Promise.all(workers);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/lib/concurrency.test.ts`
Expected: PASS (4 passing).

- [ ] **Step 5: Replace the inline copy in AiBuilderClient**

In `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx`, delete the local function:

```ts
/** Run thunks with bounded concurrency (preview is an AI/render call). */
async function runWithLimit(thunks: Array<() => Promise<void>>, limit: number) {
  const queue = [...thunks];
  const workers = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length) {
        const fn = queue.shift();
        if (fn) await fn();
      }
    },
  );
  await Promise.all(workers);
}
```

Add to the import block near the other `@/lib` / `@/components` imports:

```ts
import { runWithLimit } from '@/lib/concurrency';
```

- [ ] **Step 6: Verify typecheck and lint pass**

Run: `npx tsc --noEmit && npx eslint "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx" "src/lib/concurrency.ts"`
Expected: no output (clean).

- [ ] **Step 7: Commit**

```bash
git add src/lib/concurrency.ts src/lib/concurrency.test.ts "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx"
git commit -m "refactor: extract runWithLimit to tested lib/concurrency helper"
```

---

## Task 2: Extract `statusFor` into a tested util

**Why:** The Stepper's `statusFor` is pure logic embedded in a `.tsx` file (which imports React/Phosphor and so can't be loaded by the node-env test runner). Moving it to a sibling `.ts` makes it testable and keeps `Stepper.tsx` presentational.

**Files:**
- Create: `src/components/Stepper/stepStatus.ts`
- Test: `src/components/Stepper/stepStatus.test.ts`
- Modify: `src/components/Stepper/Stepper.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/Stepper/stepStatus.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { statusFor } from './stepStatus';

describe('statusFor', () => {
  it('marks earlier steps complete', () => {
    expect(statusFor(0, 2)).toBe('complete');
    expect(statusFor(1, 2)).toBe('complete');
  });

  it('marks the current step', () => {
    expect(statusFor(2, 2)).toBe('current');
  });

  it('marks later steps upcoming', () => {
    expect(statusFor(3, 2)).toBe('upcoming');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/components/Stepper/stepStatus.test.ts`
Expected: FAIL — cannot resolve `./stepStatus`.

- [ ] **Step 3: Write the implementation**

Create `src/components/Stepper/stepStatus.ts`:

```ts
export type StepStatus = 'complete' | 'current' | 'upcoming';

/**
 * Status of a step is a pure function of its index vs. the current index, so
 * the Stepper stays fully derived from the parent's state machine.
 */
export function statusFor(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return 'complete';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/components/Stepper/stepStatus.test.ts`
Expected: PASS (3 passing).

- [ ] **Step 5: Wire Stepper.tsx to the extracted helper**

In `src/components/Stepper/Stepper.tsx`, delete the inline type + function:

```ts
type StepStatus = 'complete' | 'current' | 'upcoming';
```

```ts
/**
 * Status of a node is a pure function of its index vs. the current index, so
 * the stepper is fully derived from the parent's state machine — no internal state.
 */
function statusFor(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return 'complete';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}
```

Add the import below the existing imports:

```ts
import { statusFor } from './stepStatus';
```

(`StepStatus` is no longer referenced by name in `Stepper.tsx`; if a stray reference remains, import it too: `import { statusFor, type StepStatus } from './stepStatus';`.)

- [ ] **Step 6: Verify typecheck and lint pass**

Run: `npx tsc --noEmit && npx eslint src/components/Stepper/Stepper.tsx src/components/Stepper/stepStatus.ts`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/Stepper/stepStatus.ts src/components/Stepper/stepStatus.test.ts src/components/Stepper/Stepper.tsx
git commit -m "refactor: extract Stepper statusFor into tested stepStatus module"
```

---

## Task 3: Make the JD step a real form (Enter + Cmd/Ctrl+Enter submit)

**Why (emil forms-controls):** Inputs should be wrapped in a `<form>` so the action is keyboard-submittable, and textareas should submit on Cmd/Ctrl+Enter. Right now the JD textarea and button are loose siblings, so a keyboard user must mouse to the button.

**Files:**
- Modify: `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx`

- [ ] **Step 1: Make `handleTailor` accept a form event**

Change the signature:

```ts
  const handleTailor = async () => {
    if (!jd.trim()) return;
```

to:

```ts
  const handleTailor = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!jd.trim()) return;
```

- [ ] **Step 2: Wrap the JD card in a form and add the keyboard handler**

Replace the JD card block:

```tsx
    content = (
      <div className={styles.jdCard}>
        <span className={styles.jdLabel}>Paste the job description</span>
        <textarea
          className={styles.jdTextarea}
          placeholder="Paste the job description here. e.g. 'We are looking for a Senior React Engineer with 4+ years of experience in Next.js, TypeScript and AWS…'"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
```

with:

```tsx
    content = (
      <form className={styles.jdCard} onSubmit={handleTailor}>
        <label className={styles.jdLabel} htmlFor="jd-input">
          Paste the job description
        </label>
        <textarea
          id="jd-input"
          className={styles.jdTextarea}
          placeholder="Paste the job description here. e.g. 'We are looking for a Senior React Engineer with 4+ years of experience in Next.js, TypeScript and AWS…'"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleTailor();
          }}
        />
```

- [ ] **Step 3: Make the button submit the form and close the form tag**

Replace the closing of the JD block:

```tsx
        <Button fullWidth onClick={handleTailor} disabled={!jd.trim()}>
          <PaperPlaneTilt size={16} />
          Tailor resume content
        </Button>
      </div>
    );
```

with:

```tsx
        <Button type="submit" fullWidth disabled={!jd.trim()}>
          <PaperPlaneTilt size={16} />
          Tailor resume content
        </Button>
      </form>
    );
```

- [ ] **Step 4: Verify typecheck/lint**

Run: `npx tsc --noEmit && npx eslint "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx"`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx"
git commit -m "feat: submit JD step via form (Enter / Cmd+Enter)"
```

---

## Task 4: Make the save bar a real form (Enter submits)

**Why (emil forms-controls):** The Build & save action has two text inputs; wrapping them in a `<form>` lets the user press Enter from either field to save. The form must wrap **only** the save bar — not the whole editing column — so editing the resume fields never triggers a save.

**Files:**
- Modify: `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx`

- [ ] **Step 1: Make `handleSaveVariant` accept a form event**

Change:

```ts
  const handleSaveVariant = async () => {
    if (!formData) return;
```

to:

```ts
  const handleSaveVariant = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData) return;
```

- [ ] **Step 2: Convert the bottom bar div to a form**

Replace the opening tag and error row:

```tsx
        {/* Sticky save bar */}
        <div className={styles.bottomBar}>
          {error && (
```

with:

```tsx
        {/* Sticky save bar */}
        <form className={styles.bottomBar} onSubmit={handleSaveVariant}>
          {error && (
```

- [ ] **Step 3: Make the save button a submit button and close the form**

Replace:

```tsx
            <div className={styles.bottomBarButton}>
              <Button
                loading={saving}
                onClick={handleSaveVariant}
                disabled={!variantTitle.trim() || !variantSlug.trim()}
              >
                {!saving && <FloppyDisk size={16} />}
                {saving ? 'Generating PDF…' : 'Build & save variant'}
              </Button>
            </div>
          </div>
        </div>
```

with:

```tsx
            <div className={styles.bottomBarButton}>
              <Button
                type="submit"
                loading={saving}
                disabled={!variantTitle.trim() || !variantSlug.trim()}
              >
                {!saving && <FloppyDisk size={16} />}
                {saving ? 'Generating PDF…' : 'Build & save variant'}
              </Button>
            </div>
          </div>
        </form>
```

- [ ] **Step 4: Verify typecheck/lint**

Run: `npx tsc --noEmit && npx eslint "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx"`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx"
git commit -m "feat: submit save bar via form (Enter to save variant)"
```

---

## Task 5: Associate labels with inputs + correct input types

**Why (emil forms-controls):** Clicking a label should focus its input, and inputs should declare semantic `type`s (`email`, `tel`, `url`) for correct mobile keyboards and validation. Today every field label is a `<span>` and contact fields are all `type="text"`. Converting the `.fieldGroup` wrapper to a `<label>` makes the whole field row a click target for its single input (no `htmlFor`/`id` churn needed).

**Files:**
- Modify: `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx`
- Modify: `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilder.module.css`

- [ ] **Step 1: Make the field-group wrapper a label in the CSS**

In `AiBuilder.module.css`, update `.fieldGroup` to add a pointer cursor (it becomes a `<label>`):

```css
.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
```

becomes:

```css
.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

label.fieldGroup {
  cursor: text;
}
```

- [ ] **Step 2: Convert every `.fieldGroup` div to a label**

In `AiBuilderClient.tsx`, change each field wrapper from `<div className={styles.fieldGroup}>…</div>` to `<label className={styles.fieldGroup}>…</label>`. Each `.fieldGroup` contains exactly one input/textarea, so a wrapping label is valid and focuses that control. This applies to: the 6 contact fields, the summary field, the 4 experience fields per card, the skills field, and the 2 education fields per card, plus the 2 save-bar fields (variant title, URL slug).

Example — the Full name field becomes:

```tsx
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Full name</span>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                    />
                  </label>
```

Apply the same div→label swap to every other `.fieldGroup` occurrence (keep the inner `<span className={styles.fieldLabel}>` and the control unchanged except for Step 3's type changes).

- [ ] **Step 3: Set correct input types and disable spellcheck on identity fields**

In the contact section, change these three inputs:

- Email: `type="text"` → `type="email"` and add `autoComplete="email" spellCheck={false}`
- Phone: `type="text"` → `type="tel"` and add `autoComplete="tel" spellCheck={false}`
- LinkedIn: `type="text"` → `type="url"` and add `spellCheck={false}`

Example (Email):

```tsx
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      className={styles.inputField}
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </label>
```

Also add `spellCheck={false}` to the URL slug input in the save bar (slugs aren't prose).

- [ ] **Step 4: Verify typecheck/lint and build**

Run: `npx tsc --noEmit && npx eslint "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx"`
Expected: clean.

- [ ] **Step 5: Manual check**

Run `npm run dev`, reach the editing step, and click directly on a field's label text (e.g. "Email"). Expected: the corresponding input gains focus.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx" "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilder.module.css"
git commit -m "a11y: associate field labels with inputs and use semantic input types"
```

---

## Task 6: Stepper a11y + no layout shift on the current step

**Why:** (1) emil "no layout shift" — the current step's label is `font-weight: 600` while others are `500`, so width jumps as the user advances. The filled node + color already signal "current"; drop the weight change. (2) a11y — screen readers need `aria-current="step"` on the active node.

**Files:**
- Modify: `src/components/Stepper/Stepper.module.css`
- Modify: `src/components/Stepper/Stepper.tsx`

- [ ] **Step 1: Remove the weight change on the current label**

In `Stepper.module.css`, change:

```css
.step[data-status='current'] .label {
  color: var(--text-primary);
  font-weight: 600;
}
```

to:

```css
.step[data-status='current'] .label {
  color: var(--text-primary);
}
```

- [ ] **Step 2: Add `aria-current` to the current step node**

In `Stepper.tsx`, update the `<li>` in the track map:

```tsx
            <li key={step.id} className={styles.step} data-status={status}>
```

to:

```tsx
            <li
              key={step.id}
              className={styles.step}
              data-status={status}
              aria-current={status === 'current' ? 'step' : undefined}
            >
```

- [ ] **Step 3: Verify typecheck/lint**

Run: `npx tsc --noEmit && npx eslint src/components/Stepper/Stepper.tsx`
Expected: clean.

- [ ] **Step 4: Manual check**

Run `npm run dev`, paste a JD, and watch the stepper advance JD → Tailoring → Edit. Expected: labels do not shift horizontally as the active step changes.

- [ ] **Step 5: Commit**

```bash
git add src/components/Stepper/Stepper.tsx src/components/Stepper/Stepper.module.css
git commit -m "a11y: add aria-current to stepper and remove current-label width shift"
```

---

## Task 7: Animate step transitions (opacity crossfade, sticky-safe)

**Why (interface-craft + emil):** Switching states (JD → loading → editing → success) is a hard cut. A short crossfade gives spatial continuity for an infrequent, user-initiated transition (justified per emil's frequency principle). **Critical constraint:** the editing state contains `position: sticky` elements (`.previewColumn`, `.bottomBar`). A `transform`-based animation on an ancestor creates a containing block and breaks `sticky`, so the wrapper must animate **opacity only**. `overlayFade` from `@/lib/motion` is opacity-only and uses the app's spring; reuse it. Reduced motion is handled globally by `MotionConfig reducedMotion="user"`.

**Files:**
- Modify: `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx`

- [ ] **Step 1: Import AnimatePresence, motion, and overlayFade**

Add near the top imports:

```ts
import { AnimatePresence, motion } from 'motion/react';
import { overlayFade } from '@/lib/motion';
```

- [ ] **Step 2: Wrap the content in a keyed crossfade**

Replace the final return:

```tsx
  return (
    <>
      <div className={styles.stepperWrap}>
        <Stepper items={STEPS} currentId={step} />
      </div>
      {content}
    </>
  );
```

with:

```tsx
  return (
    <>
      <div className={styles.stepperWrap}>
        <Stepper items={STEPS} currentId={step} />
      </div>
      {/* Opacity-only crossfade: a transform here would create a containing
          block and break the sticky preview column + save bar. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          variants={overlayFade}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </>
  );
```

- [ ] **Step 3: Verify typecheck/lint and build**

Run: `npx tsc --noEmit && npm run build`
Expected: typecheck clean; build succeeds and lists route `/dashboard/ai-builder/[resumeId]`.

- [ ] **Step 4: Manual check (sticky not broken)**

Run `npm run dev`, reach the editing step, and scroll the long left column. Expected: the right preview column and the bottom save bar still stick correctly (transitions did not break sticky). Switching steps fades rather than cuts.

- [ ] **Step 5: Manual check (reduced motion)**

In OS settings enable "Reduce motion", reload, and advance steps. Expected: content swaps instantly with no fade (MotionConfig disables it).

- [ ] **Step 6: Commit**

```bash
git add "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx"
git commit -m "feat: crossfade AI builder step transitions (opacity-only, sticky-safe)"
```

---

## Task 8: Preview skeleton shimmer + thumbnail press/keyboard polish

**Why (interface-craft "uncommon care" + emil):** While a layout renders, the preview shows plain "Rendering…" text and thumbnails show "…". A transform-only shimmer reads as a real loading state with no layout shift (the aspect-ratio box already reserves size). Thumbnails also need press feedback (`:active scale`) and should scroll into view when focused via keyboard.

**Files:**
- Modify: `src/components/ResumeHtmlPreview/ResumeHtmlPreview.tsx`
- Modify: `src/components/ResumeHtmlPreview/ResumeHtmlPreview.module.css`
- Modify: `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx`
- Modify: `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilder.module.css`

- [ ] **Step 1: Add the shimmer skeleton branch in the preview component**

In `ResumeHtmlPreview.tsx`, replace the empty/error render:

```tsx
      ) : (
        !error && <div className={styles.empty}>{emptyLabel}</div>
      )}
```

with:

```tsx
      ) : error ? null : loading ? (
        <div className={styles.skeleton} aria-hidden="true" />
      ) : (
        <div className={styles.empty}>{emptyLabel}</div>
      )}
```

(The existing `error` block below this stays unchanged; the existing `loading && html` overlay block stays unchanged — that handles re-render over an already-rendered preview.)

- [ ] **Step 2: Add the transform-only shimmer CSS**

In `ResumeHtmlPreview.module.css`, add:

```css
.skeleton {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--surface);
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.45),
    transparent
  );
  animation: previewShimmer 1.4s ease-in-out infinite;
}

@keyframes previewShimmer {
  to {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation: none;
  }
}
```

- [ ] **Step 3: Add thumbnail press feedback and keyboard scroll-into-view**

In `AiBuilder.module.css`, add an `:active` press to the thumbnail (transform-only, no transition needed):

```css
.themeThumb:active {
  transform: scale(0.98);
}
```

And add it to the existing reduced-motion `transition: none` group is unnecessary (it's a transform on :active, not a transition), so no reduced-motion change is needed.

In `AiBuilderClient.tsx`, add an `onFocus` to the thumbnail button so keyboard focus scrolls the thumb into the horizontal strip. Change:

```tsx
                    onClick={() => setSelectedThemeId(theme.id)}
                    aria-pressed={isSelected}
                    title={theme.description}
```

to:

```tsx
                    onClick={() => setSelectedThemeId(theme.id)}
                    onFocus={(e) =>
                      e.currentTarget.scrollIntoView({
                        block: 'nearest',
                        inline: 'nearest',
                      })
                    }
                    aria-pressed={isSelected}
                    aria-label={`Use ${theme.name} layout`}
                    title={theme.description}
```

- [ ] **Step 4: Verify typecheck/lint**

Run: `npx tsc --noEmit && npx eslint "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx" src/components/ResumeHtmlPreview/ResumeHtmlPreview.tsx`
Expected: clean.

- [ ] **Step 5: Manual check**

Run `npm run dev`, reach the editing step. Expected: the hero and thumbnails show a sweeping shimmer while rendering (not plain text); tabbing through thumbnails scrolls each into view; pressing a thumbnail dips slightly.

- [ ] **Step 6: Commit**

```bash
git add src/components/ResumeHtmlPreview/ src/app/(main)/dashboard/ai-builder/
git commit -m "feat: shimmer skeleton for previews + thumbnail press/keyboard polish"
```

---

## Task 9: Return focus on Modal close

**Why (emil touch-accessibility "Focus Management"):** When a dialog closes, focus should return to the element that opened it. The shared `Modal` locks scroll and closes on Escape but never restores focus, so closing "Open larger" drops the user's focus to `<body>`. This is a safe, generic improvement that benefits every Modal usage.

**Files:**
- Modify: `src/components/motion/Modal.tsx`

- [ ] **Step 1: Capture and restore focus in the open effect**

In `Modal.tsx`, replace the effect:

```tsx
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
```

with:

```tsx
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      // Return focus to whatever opened the dialog.
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);
```

- [ ] **Step 2: Verify typecheck/lint**

Run: `npx tsc --noEmit && npx eslint src/components/motion/Modal.tsx`
Expected: clean.

- [ ] **Step 3: Manual check**

Run `npm run dev`, reach the editing step, click "Open larger", then close with Escape. Expected: focus returns to the "Open larger" button (visible focus ring). Verify the existing delete-resume modal on the resume-detail page still opens/closes normally (no regression).

- [ ] **Step 4: Commit**

```bash
git add src/components/motion/Modal.tsx
git commit -m "a11y: return focus to trigger when Modal closes"
```

---

## Task 10: Hover-guard the back link + storyboard the loading sequence + transition audit

**Why:** (1) emil touch — `.backBtn:hover` applies a `translateX` that fires on tap on touch devices; gate it behind `@media (hover: hover)`. (2) interface-craft "readable over clever" — document the loading timeline as a storyboard comment so the timing is scannable. (3) emil — confirm no `transition: all` slipped in.

**Files:**
- Modify: `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilder.module.css`
- Modify: `src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx`

- [ ] **Step 1: Gate the back-link hover**

In `AiBuilder.module.css`, replace:

```css
.backBtn:hover {
  color: var(--text-primary);
  transform: translateX(-2px);
}
```

with:

```css
@media (hover: hover) {
  .backBtn:hover {
    color: var(--text-primary);
    transform: translateX(-2px);
  }
}
```

- [ ] **Step 2: Add a storyboard comment above the loading config**

In `AiBuilderClient.tsx`, replace:

```ts
// Copy for the loading checklist. The index advances on the timers below, so the
// list and the timers stay in sync from one source of truth.
const LOADING_PHASES = [
```

with:

```ts
/* ─────────────────────────────────────────────────────────
 * LOADING STORYBOARD (cosmetic — not tied to backend progress)
 *
 *    0ms   phase 0 active: "Downloading your resume"
 * 3000ms   phase 1 active: "Reading layout and structure"
 * 6500ms   phase 2 active: "Tailoring summary and skills…"
 * 10000ms  phase 3 active: "Rewriting experience bullet points"
 *          (last phase keeps spinning until tailoring resolves)
 *
 * LOADING_PHASES drives both the timers and the checklist render,
 * so copy + timing stay in one place.
 * ───────────────────────────────────────────────────────── */
const LOADING_PHASES = [
```

- [ ] **Step 3: Audit for `transition: all`**

Run: `grep -rn "transition: all" "src/app/(main)/dashboard/ai-builder/" src/components/Stepper src/components/ResumeHtmlPreview`
Expected: no matches. If any appear, replace with explicit properties.

- [ ] **Step 4: Verify typecheck/lint**

Run: `npx tsc --noEmit && npx eslint "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx"`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/dashboard/ai-builder/[resumeId]/"
git commit -m "polish: hover-guard back link, document loading storyboard"
```

---

## Task 11: Full verification pass

**Why:** Confirm the whole polish layer is green before handing off.

**Files:** none (verification only)

- [ ] **Step 1: Run the unit tests**

Run: `npm run test`
Expected: PASS, including `concurrency.test.ts` and `stepStatus.test.ts`.

- [ ] **Step 2: Typecheck + lint the changed surface**

Run:
```bash
npx tsc --noEmit
npx eslint "src/app/(main)/dashboard/ai-builder/[resumeId]/AiBuilderClient.tsx" "src/app/(main)/dashboard/ai-builder/[resumeId]/page.tsx" src/components/Stepper src/components/ResumeHtmlPreview src/components/motion/Modal.tsx src/lib/concurrency.ts
```
Expected: clean (no new errors beyond the one pre-existing, justified `set-state-in-effect` suppression already in the file).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: succeeds; route list includes `/dashboard/ai-builder/[resumeId]`.

- [ ] **Step 4: Manual a11y + interaction checklist (npm run dev)**

Walk the flow and confirm:
- JD step: Cmd/Ctrl+Enter and the Enter key submit; clicking the "Paste the job description" label focuses the textarea.
- Editing step: clicking any field label focuses its input; email field shows the email keyboard on mobile.
- Save bar: pressing Enter in Variant title or URL slug saves.
- Stepper: labels don't shift width across steps; screen reader announces the current step.
- Previews: shimmer while rendering; tab through thumbnails scrolls them into view and shows focus rings.
- "Open larger" → Escape returns focus to the trigger.
- Step transitions crossfade; with OS reduced-motion on, they cut instantly and shimmer stops.
- Sticky preview column and save bar still stick while scrolling the editing column.

- [ ] **Step 5: Final commit (if any checklist fixes were needed)**

```bash
git add -A
git commit -m "polish: AI builder design-engineering verification fixes"
```

---

## Self-Review

**Spec coverage** (the two design skills + critique findings):
- Forms submit via keyboard → Tasks 3, 4. ✓
- Label↔input association + semantic input types + iOS 16px (already global) → Task 5. ✓
- No layout shift (stepper weight) + aria-current → Task 6. ✓
- Animation: ease/spring, reduced-motion (global), sticky-safe opacity, frequency-appropriate → Task 7. ✓
- Loading feedback/skeleton + thumbnail press + keyboard scroll-into-view → Task 8. ✓
- Focus management on close → Task 9. ✓
- Hover-on-touch guard + storyboard readability + no `transition: all` → Task 10. ✓
- Testability/centralization (extract pure helpers, TDD) → Tasks 1, 2. ✓
- Performance golden rule (transform/opacity only) → enforced in Tasks 7 (opacity), 8 (transform shimmer). ✓

**Placeholder scan:** No "TBD"/"add error handling"/"similar to Task N" — every code step shows the actual before/after. ✓

**Type consistency:** `runWithLimit(thunks, limit)` and `statusFor(index, currentIndex)` signatures are identical where defined (Tasks 1, 2) and where imported (AiBuilderClient, Stepper). `handleTailor`/`handleSaveVariant` updated to `(e?: React.FormEvent)` consistently with their `onSubmit`/`type="submit"` usage. ✓

**Known constraints honored:** Vitest is node-only, so only pure helpers are unit-tested; component/visual tasks use build + manual verification (stated up front). The pre-existing `react-hooks/set-state-in-effect` suppression on the sessionStorage prefill is left as-is.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-14-ai-builder-polish.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
