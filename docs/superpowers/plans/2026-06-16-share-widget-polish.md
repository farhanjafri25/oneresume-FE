# Share Widget Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the already-shipped `ShareWidget` from "works" to "crafted" by applying Emil Kowalski's design-engineering rules and Josh Puckett's Interface Craft (storyboard animation + critique).

**Architecture:** Pure refinement of one component (`src/components/ShareWidget/`). No new files, no API changes, no behaviour changes to what's shared. Two surfaces change: the CSS module (press feedback, touch targets, GPU hints) and the component (storyboard-structured staggered reveal, data-driven rows, FAB icon that reflects open state).

**Tech Stack:** React 19, `motion/react` (variants + `useReducedMotion`), CSS Modules, `@phosphor-icons/react`.

---

## Design Critique (what this plan fixes)

Applying the Interface Craft critique lens to the current component:

**Behavioural**
- **Press has no feedback.** The FAB and menu rows have hover + focus states but no `:active` response. Emil's rule — "make buttons feel responsive → `transform: scale(0.97)` on `:active`" — is unmet; the shared `Button` already does this, so the FAB feels less alive than the rest of the app.
- **The FAB icon contradicts its own state.** When open, `aria-label` becomes "Close share menu" but the icon stays `ShareNetwork`. The visual and the semantics disagree. A `Share ↔ X` cross-fade resolves it and reinforces the toggle affordance.
- **The reveal is one flat pop.** The whole card scales in as a single unit. For a *rarely-opened* surface (a referral nudge — Emil's frequency principle says delight is warranted here, unlike 100×/day UI), a staggered top-to-bottom reveal reads as more considered.

**Visual / structural**
- **Animation values are inline magic numbers.** `scale: 0.96`, `y: 8` live in JSX. Interface Craft wants every timing/spring/offset as a named, tunable constant with a storyboard comment you can read like a shot list.
- **Rows aren't fully data-driven.** Channels map from `SHARE_CHANNELS`, but Copy/Close are hand-written. Unifying the reveal so every row is a `motion` child of one stagger parent is both cleaner and required for stagger ordering.
- **Touch rows sit just under the 44px target.** ~42px on touch; bump to a guaranteed 44px.

Out of scope (intentionally): no DialKit panel (a dev-only live-tuning tool — YAGNI for production); no backdrop/scrim (keeps the surface light, matches the reference); no multi-colour social icons (monochrome is more cohesive — Emil/critique value consistency over decoration).

---

## File Structure

- Modify: `src/components/ShareWidget/ShareWidget.module.css` — press feedback, touch sizing, GPU hint, `.fabIcon`, drop `.menuList`.
- Modify: `src/components/ShareWidget/ShareWidget.tsx` — storyboard comment, `MOTION` + variant config, data-driven rows as direct stagger children, FAB icon cross-fade, reduced-motion branches.

No test file changes: the polish is visual/motion and not unit-testable. The existing `src/lib/share.test.ts` (URL builders) must stay green, and `eslint` + `tsc` must stay clean — those are the regression gates. Verification is a manual visual checklist plus the existing suite.

---

### Task 1: Press feedback, touch targets, and GPU hints (Emil)

**Files:**
- Modify: `src/components/ShareWidget/ShareWidget.module.css`

- [ ] **Step 1: Add `:active` press feedback to the FAB**

In `.fab`, the transition already lists `transform`. Add an `:active` rule directly after the `.fab:focus-visible` block:

```css
.fab:active {
  transform: scale(0.94);
}
```

- [ ] **Step 2: Add a GPU hint + `.fabIcon` wrapper class**

The card animates `transform`/`opacity` only (good — no layout properties). Add a compositor hint to `.card`, and a class for the cross-fading icon span the component will introduce in Task 2. Append to `.card` and add a new rule:

```css
.card {
  /* ...existing declarations... */
  will-change: transform, opacity;
}

.fabIcon {
  display: inline-flex;
  line-height: 0;
}
```

- [ ] **Step 3: Give menu rows press feedback**

Extend `.menuItem`'s transition to include `transform`, and add an `:active` rule after the `.menuItem:focus-visible` block:

```css
.menuItem {
  /* change the existing transition line to: */
  transition: background 0.15s ease, transform 0.1s ease;
}

.menuItem:active {
  transform: scale(0.99);
}
```

- [ ] **Step 4: Guarantee 44px touch targets**

In the existing `@media (hover: none)` block, add a `min-height` alongside the padding bump:

```css
@media (hover: none) {
  .menuItem {
    min-height: 44px;
    padding: 12px 10px;
  }
}
```

- [ ] **Step 5: Remove the now-unused `.menuList` rule**

Task 2 flattens the markup so every row is a direct child of the card (required for stagger ordering). Delete the `.menuList` block entirely, and add `display: flex; flex-direction: column;` to `.card` so the rows still stack:

```css
.card {
  /* ...existing declarations... */
  display: flex;
  flex-direction: column;
}
/* delete the entire `.menuList { ... }` rule */
```

- [ ] **Step 6: Verify CSS compiles (lint)**

Run: `npx eslint src/components/ShareWidget/ShareWidget.module.css || true` then `npx stylelint` is not configured — instead confirm via the build in Task 3. For now run: `npx tsc --noEmit`
Expected: exit 0 (CSS module class references resolve once Task 2 lands; if run before Task 2, `.menuList` removal will surface an unused-class TS error only if the component still references it — do Task 2 before re-running).

- [ ] **Step 7: Commit**

```bash
git add src/components/ShareWidget/ShareWidget.module.css
git commit -m "polish: add press feedback, 44px touch rows, and GPU hint to ShareWidget"
```

---

### Task 2: Storyboard-structured staggered reveal + FAB icon state (Interface Craft + Emil)

**Files:**
- Modify: `src/components/ShareWidget/ShareWidget.tsx`

- [ ] **Step 1: Replace the component with the storyboard-structured version**

Rewrite `src/components/ShareWidget/ShareWidget.tsx` in full:

```tsx
'use client';

/* ─────────────────────────────────────────────────────────
 * SHARE WIDGET — OPEN ANIMATION STORYBOARD
 *
 * Trigger: user taps the FAB. A referral nudge is rarely opened,
 * so a small staggered reveal is warranted — product-frequent UI
 * would not animate (Emil's frequency principle).
 *
 *   open     card scales in 0.96 → 1, rises 8 → 0   (origin: bottom-right)
 *   stagger  nudge then each row fades + rises, 40ms apart, top → bottom
 *   close    card fades + scales out as one unit (no stagger)
 *   toggle   FAB icon cross-fades Share ↔ X to match its open state
 *
 * Reduced motion: opacity only — no scale, slide, stagger, or rotate.
 * ───────────────────────────────────────────────────────── */

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import {
  XLogo,
  ThreadsLogo,
  LinkedinLogo,
  ShareNetwork,
  Link as LinkIcon,
  X as CloseIcon,
} from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { springs } from '@/lib/motion';
import {
  SHARE_CHANNELS,
  ONECV_SHARE_MESSAGE,
  getProductUrl,
  copyToClipboard,
  type ShareChannelId,
} from '@/lib/share';
import styles from './ShareWidget.module.css';

type IconComponent = React.ComponentType<{ size?: number; weight?: string; className?: string }>;

/** Channel id -> icon, kept here so `share.ts` stays framework-pure. */
const CHANNEL_ICONS: Record<ShareChannelId, IconComponent> = {
  x: XLogo,
  threads: ThreadsLogo,
  linkedin: LinkedinLogo,
};

/* Tunable motion values — the single place to adjust the reveal. */
const MOTION = {
  rowStagger: 0.04, // s between each row on open
  rowOffsetY: 6, // px each row rises from
  card: springs.smooth, // container scale/opacity spring
  row: springs.micro, // per-row spring (snappier)
  iconSwap: springs.micro, // FAB icon cross-fade
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...MOTION.card, staggerChildren: MOTION.rowStagger },
  },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: MOTION.card },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: MOTION.rowOffsetY },
  visible: { opacity: 1, y: 0, transition: MOTION.row },
  exit: { opacity: 0 },
};

/* Reduced motion: opacity only, no stagger or translate. */
const reducedCardVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
const reducedRowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Floating "Share OneCV" referral widget — a bottom-right FAB that expands into a
 * menu for posting about the product on X / Threads / LinkedIn or copying the link.
 * Mirrors the app's dropdown convention (ResumeSwitcher): toggle state, click-outside
 * + Escape to close, and a spring reveal that respects reduced motion.
 */
export default function ShareWidget() {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const fabRef = useRef<HTMLButtonElement>(null);
  const productUrl = getProductUrl();

  // Close on outside-click or Escape. The FAB and card stop propagation so clicks
  // inside the widget don't bubble to this document-level listener.
  useEffect(() => {
    if (!open) return;
    const handleClick = () => setOpen(false);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(productUrl);
    if (ok) toast.success('Link copied');
    else toast.error("Couldn't copy the link. Please try again.");
    setOpen(false);
  };

  const closeAndFocus = () => {
    setOpen(false);
    fabRef.current?.focus();
  };

  const cardV = reduceMotion ? reducedCardVariants : cardVariants;
  const rowV = reduceMotion ? reducedRowVariants : rowVariants;

  // Data-driven rows: channels first, then Copy link; Close sits below a divider.
  const channelRows = SHARE_CHANNELS.map((channel) => ({
    key: channel.id,
    Icon: CHANNEL_ICONS[channel.id],
    label: channel.label,
    href: channel.buildUrl(productUrl, ONECV_SHARE_MESSAGE),
  }));

  return (
    <div className={styles.root}>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.card}
            role="menu"
            aria-label="Share OneCV"
            onClick={(e) => e.stopPropagation()}
            variants={cardV}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: 'bottom right' }}
          >
            <motion.p className={styles.nudge} variants={rowV}>
              Love OneCV? Pass it on.
            </motion.p>

            {channelRows.map(({ key, Icon, label, href }) => (
              <motion.a
                key={key}
                className={styles.menuItem}
                role="menuitem"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                variants={rowV}
              >
                <Icon size={18} className={styles.menuIcon} />
                <span>{label}</span>
              </motion.a>
            ))}

            <motion.button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={handleCopy}
              variants={rowV}
            >
              <LinkIcon size={18} className={styles.menuIcon} />
              <span>Copy link</span>
            </motion.button>

            <motion.div className={styles.divider} variants={rowV} />

            <motion.button
              type="button"
              className={`${styles.menuItem} ${styles.closeItem}`}
              role="menuitem"
              onClick={closeAndFocus}
              variants={rowV}
            >
              <CloseIcon size={18} className={styles.menuIcon} />
              <span>Close</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        ref={fabRef}
        type="button"
        className={styles.fab}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? 'Close share menu' : 'Share OneCV'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'share'}
            className={styles.fabIcon}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -90 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, rotate: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 90 }}
            transition={MOTION.iconSwap}
          >
            {open ? <CloseIcon size={22} weight="bold" /> : <ShareNetwork size={22} weight="bold" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}
```

Key correctness notes for the implementer:
- The card is now `display: flex; flex-direction: column` (Task 1), and **every row is a direct `motion` child of the card** — `staggerChildren` only orders direct motion children, so the old `.menuList` wrapper had to go.
- Children use `variants={rowV}` with **no** `initial`/`animate` props — they inherit the parent's animation state via motion's variant propagation, which is what drives the stagger.
- The divider is a `motion.div` so it participates in the stagger rather than snapping in mid-reveal.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0 (no errors).

- [ ] **Step 3: Lint**

Run: `npx eslint src/components/ShareWidget/ShareWidget.tsx`
Expected: exit 0 (no warnings/errors).

- [ ] **Step 4: Commit**

```bash
git add src/components/ShareWidget/ShareWidget.tsx
git commit -m "polish: storyboard-structured staggered reveal + stateful FAB icon for ShareWidget"
```

---

### Task 3: Verify the regression gates and the experience

**Files:** none (verification only)

- [ ] **Step 1: Unit tests stay green**

Run: `npx vitest run src/lib/share.test.ts`
Expected: `Test Files 1 passed`, `Tests 5 passed`.

- [ ] **Step 2: Full lint + typecheck**

Run: `npx eslint src/components/ShareWidget/ && npx tsc --noEmit`
Expected: both exit 0.

- [ ] **Step 3: Production build (catches RSC/client-boundary issues)**

Run: `npm run build`
Expected: build completes; `/dashboard` and `/dashboard/resume/[resumeId]` compile without error.

- [ ] **Step 4: Manual visual checklist** (`npm run dev`, log in, open `/dashboard`)

  - Tap the FAB: it presses in (scale 0.94), the icon cross-fades Share → X, and the card reveals top-to-bottom (nudge, then rows, then Close) — not a single flat pop.
  - Tap a row: it presses (subtle scale). Hover (desktop): background lightens. Focus (Tab): visible ring.
  - Close via the FAB, the Close row, outside-click, and Escape — Escape/Close return focus to the FAB; the icon cross-fades X → Share.
  - Copy link → "Link copied" toast appears **above** the FAB (doesn't cover it).
  - Toggle OS "Reduce motion": reopen — the reveal is a plain fade with no scale/slide/stagger/rotate.
  - Touch viewport (≤768px): rows are ≥44px tall; the card fits the screen.

---

## Self-Review

- **Spec coverage:** Every critique item maps to a task — press feedback (T1 s1,3), 44px targets (T1 s4), GPU hint (T1 s2), stateful FAB icon (T2), storyboard constants + stagger (T2), data-driven rows (T2). ✓
- **Placeholder scan:** No TBD/TODO; all code is complete and copy-pasteable. ✓
- **Type consistency:** `MOTION`, `cardVariants`/`rowVariants` (+ reduced variants), `CHANNEL_ICONS`, `channelRows`, `cardV`/`rowV` are defined once and referenced consistently; `IconComponent` includes `weight` (used by the FAB icons). ✓
- **Behavioural safety:** No change to what is shared, the URLs, the toasts, or the dismiss logic — `src/lib/share.ts` and the mount points are untouched, so `share.test.ts` remains the accurate contract. ✓
- **Stagger correctness:** Flattening `.menuList` is required for `staggerChildren`; called out explicitly in T1 s5 and T2 s1. ✓

---

## Appendix: deferred ideas (not in scope)

- **DialKit panel** to live-tune `MOTION.rowStagger` / `rowOffsetY` during design review — a dev-only affordance; wire up behind a dev flag only if iterating heavily on the feel.
- **First-mount FAB entrance** — deliberately omitted: the FAB is seen on every dashboard load, so animating its appearance violates Emil's frequency principle.
