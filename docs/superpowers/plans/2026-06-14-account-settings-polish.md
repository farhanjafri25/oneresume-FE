# Account Settings Design-Engineering Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the newly-built account-settings UI (Edit Profile / Change Password / Delete Account modals + the settings page) into compliance with the `emil-design-engineering` and `web-design-guidelines` (Vercel Web Interface Guidelines) checklists.

**Architecture:** This is a polish pass over already-merged, working code. No behavior changes — only presentational/accessibility refinements: input sizing to stop iOS zoom, focus-into-dialog on open, modal scroll containment, typographic characters, and a page-level heading. Each task is a small, self-contained edit verified by lint + build (and a manual mobile/keyboard check at the end).

**Tech Stack:** Next.js 16 App Router, React 19, CSS Modules, `motion/react` (Framer Motion), `@phosphor-icons/react`.

> **TDD note:** These are presentational/CSS/markup changes with no unit-testable logic and no DOM test harness in this repo (`vitest` exists but there are no component-render tests for settings). So each task's verification is **ESLint (zero errors) + the existing convention it must match**, with a single end-to-end manual check (Task 8) at 375px and via keyboard. Where a change has observable output, the expected result is stated exactly.

> **House-style guardrails (do NOT "fix" these):**
> - Headings/buttons use **sentence case** ("Edit profile", "Change password"), matching the login page ("Welcome back", "Create your account"). The Web Interface Guideline's "Title Case" rule is overridden by this codebase's established convention and the user's UI memory (never all-caps; match existing components). Leave casing as-is.
> - Reduced motion is **already** handled globally by `src/components/motion/MotionProvider.tsx` (`<MotionConfig reducedMotion="user">`) plus a `prefers-reduced-motion` block in `src/app/globals.css`. The modals inherit this — do not add per-component reduced-motion code.
> - The shared `Button` (`src/components/Button/Button.module.css`) already has `touch-action: manipulation`, a 44px touch target, and hover gated behind `@media (hover: hover)`. Do not touch it.

---

### Task 1: Fix modal input sizing, touch-action, and `transition: all`

The modal `.input` uses `font-size: 14px` (triggers iOS auto-zoom on focus), omits `touch-action: manipulation`, and uses `transition: all` (a Web Interface Guidelines violation). The established convention — `src/app/(auth)/login/page.module.css:82-92` and `src/components/UploadModal/UploadModal.module.css:92` — is **16px + `touch-action: manipulation` + explicit transition properties**.

**Files:**
- Modify: `src/app/(main)/settings/accountModals.module.css` (the `.input` rule)

- [ ] **Step 1: Replace the `.input` rule**

Find:

```css
.input {
  width: 100%;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}
```

Replace with:

```css
.input {
  width: 100%;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 16px; /* >=16px prevents iOS zoom on focus */
  touch-action: manipulation;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
```

- [ ] **Step 2: Verify no `transition: all` remains in the file**

Run: `grep -n "transition: all" src/app/\(main\)/settings/accountModals.module.css`
Expected: no output (exit code 1).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/settings/accountModals.module.css
git commit -m "fix(settings): 16px modal inputs + touch-action, drop transition:all"
```

---

### Task 2: Move the focus ring to `:focus-visible`

The guideline says prefer `:focus-visible` over `:focus` for the ring so a mouse click doesn't paint a ring. Login does exactly this (`page.module.css:102-112`): `:focus` sets only the border, `:focus-visible` adds the box-shadow ring. The modal `.input:focus` currently applies the ring on every focus.

**Files:**
- Modify: `src/app/(main)/settings/accountModals.module.css` (the `.input:focus` rule)

- [ ] **Step 1: Split the focus rule**

Find:

```css
.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(20, 85, 51, 0.15);
}
```

Replace with:

```css
.input:focus {
  border-color: var(--primary);
}

.input:focus-visible {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(20, 85, 51, 0.15);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(main\)/settings/accountModals.module.css
git commit -m "fix(settings): show modal input ring on :focus-visible only"
```

---

### Task 3: Contain overscroll on the scrollable modal panel

`.modal` is `overflow-y: auto` (it scrolls when content is tall). The Web Interface Guidelines require `overscroll-behavior: contain` on modals/drawers so scroll-chaining doesn't move the page behind the dialog (notable on iOS).

**Files:**
- Modify: `src/app/(main)/settings/accountModals.module.css` (the `.modal` rule)

- [ ] **Step 1: Add the property**

Find:

```css
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  padding: 32px;
```

Replace with:

```css
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 32px;
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(main\)/settings/accountModals.module.css
git commit -m "fix(settings): contain overscroll on modal panel"
```

---

### Task 4: Create a desktop-only focus-on-open hook

When a modal opens, focus currently stays on the trigger button outside the dialog — failing the guidelines' focus-management and `autoFocus` rules (move focus into the dialog; `autoFocus` desktop-only so the mobile keyboard doesn't pop unbidden). Because each modal **remounts on open** (the `key` bumps in `AccountActions.tsx`), a `useEffect` that runs once on mount fires exactly on open. The hook focuses the primary input only on a fine-pointer/hover device.

**Files:**
- Create: `src/app/(main)/settings/useFocusOnMount.ts`

- [ ] **Step 1: Create the hook**

```ts
import { useEffect, useRef } from 'react';

/**
 * Returns a ref that focuses its element once, on mount. The account modals
 * remount each time they open (their `key` bumps in AccountActions), so "on
 * mount" means "on open". Focus is applied only on hover/fine-pointer devices
 * so opening a modal on mobile doesn't immediately pop the on-screen keyboard.
 */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      ref.current?.focus();
    }
  }, []);
  return ref;
}
```

- [ ] **Step 2: Lint the new file**

Run: `npx eslint "src/app/(main)/settings/useFocusOnMount.ts"`
Expected: no errors (no `react-hooks/set-state-in-effect` — the effect only calls `.focus()`, a DOM side-effect, never `setState`).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/settings/useFocusOnMount.ts
git commit -m "feat(settings): add desktop-only focus-on-mount hook for dialogs"
```

---

### Task 5: Focus the primary input when each modal opens

Wire the hook into each modal's primary field: Edit Profile → username; Change Password → current password; Delete Account → confirm input.

**Files:**
- Modify: `src/app/(main)/settings/EditProfileModal.tsx`
- Modify: `src/app/(main)/settings/ChangePasswordModal.tsx`
- Modify: `src/app/(main)/settings/DeleteAccountModal.tsx`

- [ ] **Step 1: EditProfileModal — import + ref + attach**

Add the import after the existing `account` action import line (`} from '@/app/actions/account';`):

```tsx
import { useFocusOnMount } from './useFocusOnMount';
```

Immediately after the `const [resendStatus, setResendStatus] = useState<string | null>(null);` line, add:

```tsx
  const usernameRef = useFocusOnMount<HTMLInputElement>();
```

On the username `<input>` (the one with `id="edit-username"`), add the ref. Find:

```tsx
              <input
                className={styles.input}
                type="text"
                id="edit-username"
                value={username}
```

Replace with:

```tsx
              <input
                ref={usernameRef}
                className={styles.input}
                type="text"
                id="edit-username"
                value={username}
```

- [ ] **Step 2: ChangePasswordModal — import + ref + attach**

Add the import after `} from '@/app/actions/account';`:

```tsx
import { useFocusOnMount } from './useFocusOnMount';
```

After `const [submitting, setSubmitting] = useState(false);`, add:

```tsx
  const currentRef = useFocusOnMount<HTMLInputElement>();
```

On the current-password `<input>` (`id="current-password"`), find:

```tsx
            <input
              className={styles.input}
              type={show ? 'text' : 'password'}
              id="current-password"
              value={currentPassword}
```

Replace with:

```tsx
            <input
              ref={currentRef}
              className={styles.input}
              type={show ? 'text' : 'password'}
              id="current-password"
              value={currentPassword}
```

- [ ] **Step 3: DeleteAccountModal — import + ref + attach**

Add the import after `} from '@/app/actions/account';` (it sits above the `import { User }` line — add it there):

```tsx
import { useFocusOnMount } from './useFocusOnMount';
```

After `const [submitting, setSubmitting] = useState(false);`, add:

```tsx
  const confirmRef = useFocusOnMount<HTMLInputElement>();
```

On the confirm `<input>` (`id="delete-confirm"`), find:

```tsx
          <input
            className={styles.input}
            type="text"
            id="delete-confirm"
            value={confirmText}
```

Replace with:

```tsx
          <input
            ref={confirmRef}
            className={styles.input}
            type="text"
            id="delete-confirm"
            value={confirmText}
```

- [ ] **Step 4: Type-check + lint the three modals**

Run: `npx tsc --noEmit && npx eslint "src/app/(main)/settings"`
Expected: no output from tsc; eslint reports only the pre-existing `page.tsx` `<img>` warning, zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/settings/EditProfileModal.tsx src/app/\(main\)/settings/ChangePasswordModal.tsx src/app/\(main\)/settings/DeleteAccountModal.tsx
git commit -m "feat(settings): focus the primary field when each account modal opens"
```

---

### Task 6: Typography + live-region fixes in EditProfileModal

Three small guideline fixes in `EditProfileModal.tsx`: real ellipsis character in the resend status, curly apostrophe in the email hint, and a polite live region so the resend status ("Code sent!") is announced to screen readers.

**Files:**
- Modify: `src/app/(main)/settings/EditProfileModal.tsx`

- [ ] **Step 1: Use a real ellipsis in the resend status**

Find:

```tsx
    setResendStatus('Sending...');
```

Replace with:

```tsx
    setResendStatus('Sending…');
```

- [ ] **Step 2: Curly apostrophe in the email-change hint**

Find:

```tsx
                <span className={styles.hint}>
                  We&apos;ll send a code to verify your new email.
                </span>
```

Replace with:

```tsx
                <span className={styles.hint}>
                  We’ll send a code to verify your new email.
                </span>
```

- [ ] **Step 3: Announce resend status politely**

Find:

```tsx
          <div className={styles.resendRow}>
            <Button variant="ghost" size="sm" onClick={handleResend} disabled={submitting}>
              {resendStatus || 'Resend code'}
            </Button>
          </div>
```

Replace with:

```tsx
          <div className={styles.resendRow} aria-live="polite">
            <Button variant="ghost" size="sm" onClick={handleResend} disabled={submitting}>
              {resendStatus || 'Resend code'}
            </Button>
          </div>
```

- [ ] **Step 4: Lint**

Run: `npx eslint "src/app/(main)/settings/EditProfileModal.tsx"`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/settings/EditProfileModal.tsx
git commit -m "fix(settings): ellipsis, curly apostrophe, polite resend status"
```

---

### Task 7: Give the settings page a top-level heading

The settings page renders the user's name as an `<h2>` with no `<h1>` above it, breaking heading hierarchy (guidelines: headings hierarchical). Add a visually-hidden `<h1>Account settings</h1>` as the page's first heading. No `.srOnly` utility exists in the repo, so define one in the settings module.

**Files:**
- Modify: `src/app/(main)/settings/settings.module.css` (add `.srOnly`)
- Modify: `src/app/(main)/settings/page.tsx` (add the `<h1>`)

- [ ] **Step 1: Add a visually-hidden utility to the CSS module**

Append to the end of `src/app/(main)/settings/settings.module.css`:

```css
/* Visually hidden but available to screen readers (page-level heading). */
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
```

- [ ] **Step 2: Render the heading as the card's first child**

In `src/app/(main)/settings/page.tsx`, find:

```tsx
      <div className={styles.card}>
        <div className={styles.profileSection}>
```

Replace with:

```tsx
      <div className={styles.card}>
        <h1 className={styles.srOnly}>Account settings</h1>
        <div className={styles.profileSection}>
```

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc --noEmit && npx eslint "src/app/(main)/settings/page.tsx"`
Expected: no tsc output; eslint shows only the pre-existing `<img>` warning.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/settings/settings.module.css src/app/\(main\)/settings/page.tsx
git commit -m "a11y(settings): add visually-hidden page heading"
```

---

### Task 8: Final verification — build + manual mobile/keyboard pass

**Files:** none (verification only)

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: build completes with `✓`; `/settings` listed as `ƒ (Dynamic)`. (The `DYNAMIC_SERVER_USAGE` digest line is expected — the page reads cookies.)

- [ ] **Step 2: Manual check at 375px (mobile)**

Run `npm run dev`, open `/settings` in a 375px-wide viewport (DevTools device toolbar, iPhone SE):
- The three action buttons are stacked full-width.
- Username + Email details are a single column.
- Open each modal: tapping a text input does **not** zoom the page (16px fix).
- A tall modal scrolls internally without scrolling the page behind it (overscroll containment).

- [ ] **Step 3: Manual keyboard/desktop check**

On desktop, open each modal with the keyboard (Tab to a button, Enter):
- Focus lands inside the dialog on the primary input (Edit Profile → username, Change Password → current password, Delete Account → confirm).
- `Esc` closes the modal; `Enter` submits the form.
- Clicking an input with the mouse shows a border but **no** focus ring; tabbing to it shows the ring (`:focus-visible`).

- [ ] **Step 4: Final commit (if any uncommitted verification tweaks)**

```bash
git status --short
# expected: clean (all changes committed in Tasks 1-7)
```

---

## Self-Review

**Spec coverage** — every audit finding maps to a task:
- iOS zoom (inputs <16px) → Task 1
- `transition: all` → Task 1
- `touch-action` on inputs → Task 1
- `:focus-visible` ring → Task 2
- `overscroll-behavior: contain` on modal → Task 3
- Focus-into-dialog on open / desktop-only autofocus → Tasks 4–5
- Real ellipsis `…` → Task 6
- Curly apostrophe → Task 6
- `aria-live` for async status → Task 6
- Heading hierarchy (missing `<h1>`) → Task 7
- Reduced motion, shared Button touch/hover, sentence-case copy → **already compliant / intentional**, documented in the guardrails header (no task, by design).

**Placeholder scan:** none — every code step contains the exact find/replace content.

**Type/name consistency:** the hook `useFocusOnMount` is defined in Task 4 and imported with that exact name and generic signature in Task 5; refs (`usernameRef`, `currentRef`, `confirmRef`) are declared and attached within the same task. `.srOnly` is defined (Task 7 Step 1) before use (Step 2).
