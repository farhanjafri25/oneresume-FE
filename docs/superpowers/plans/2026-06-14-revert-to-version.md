# Revert to a Version Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-version 3-dot menu in the resume version history with a "Revert to this version" action that promotes an older version to active (non-destructively).

**Architecture:** Reverting calls a new backend endpoint (implemented separately — see backend handoff doc) via a new server action; the backend appends a new top version reusing the target's PDF, so the frontend's existing "active = highest versionNumber" derivation needs no change. The UI mirrors the existing overflow-menu + confirm-modal pattern already used in `ResumeCard` and the resume-level menu in `ResumeDetailView`.

**Tech Stack:** Next.js 16 (App Router, server actions), React 19, TypeScript, `motion/react`, `@phosphor-icons/react`, `sonner` toasts, Vitest (node env, pure-function tests).

**Reference docs:**
- Spec: `docs/superpowers/specs/2026-06-14-revert-to-version-design.md`
- Backend contract: `docs/superpowers/specs/2026-06-14-revert-to-version-backend-handoff.md`

---

## File Structure

- **Create** `src/app/(main)/dashboard/resume/[resumeId]/sections/versionMenu.ts` — pure helpers (`canRevertToVersion`, `buildRevertConfirmText`). One responsibility: decide menu visibility + build copy. Testable in node env.
- **Create** `src/app/(main)/dashboard/resume/[resumeId]/sections/versionMenu.test.ts` — Vitest unit tests for the helpers.
- **Modify** `src/app/actions/resume.ts` — add `revertToVersionAction` server action.
- **Modify** `src/app/(main)/dashboard/resume/[resumeId]/sections/VersionsSection.tsx` — add overflow menu, confirm modal, new props (`resumeId`, `variantId`), router refresh.
- **Modify** `src/app/(main)/dashboard/resume/[resumeId]/ResumeDetailView.tsx` — pass `resumeId` and `variantId` into `VersionsSection`.

No CSS changes: `ResumeDetailView.module.css` already defines `.menu`, `.menuButton`, `.dropdownMenu`, `.dropdownItem`, `.modalOverlay`, `.modalContent`, `.modalTitle`, `.modalDesc`, `.modalActions`.

---

## Task 1: Pure menu helpers (TDD)

**Files:**
- Create: `src/app/(main)/dashboard/resume/[resumeId]/sections/versionMenu.ts`
- Test: `src/app/(main)/dashboard/resume/[resumeId]/sections/versionMenu.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/(main)/dashboard/resume/[resumeId]/sections/versionMenu.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canRevertToVersion, buildRevertConfirmText } from './versionMenu';

describe('canRevertToVersion', () => {
  it('allows reverting to an older version', () => {
    expect(canRevertToVersion(2, 5)).toBe(true);
  });

  it('hides revert on the active (latest) version', () => {
    expect(canRevertToVersion(5, 5)).toBe(false);
  });

  it('returns false when there is no latest version', () => {
    expect(canRevertToVersion(1, undefined)).toBe(false);
  });
});

describe('buildRevertConfirmText', () => {
  it('names the target version and reassures history is kept', () => {
    const text = buildRevertConfirmText(2);
    expect(text).toContain('Version 2');
    expect(text).toContain('kept');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/\(main\)/dashboard/resume/\[resumeId\]/sections/versionMenu.test.ts`
Expected: FAIL — cannot find module `./versionMenu` (or `canRevertToVersion is not a function`).

- [ ] **Step 3: Write minimal implementation**

Create `src/app/(main)/dashboard/resume/[resumeId]/sections/versionMenu.ts`:

```ts
/**
 * Whether a version offers a "revert to this version" action. The active version
 * (highest versionNumber) has nothing to revert to, so its menu item is hidden.
 */
export function canRevertToVersion(
  versionNumber: number,
  latestVersionNumber: number | undefined,
): boolean {
  return latestVersionNumber !== undefined && versionNumber !== latestVersionNumber;
}

/** Confirmation copy shown before reverting. */
export function buildRevertConfirmText(versionNumber: number): string {
  return `Revert to Version ${versionNumber}? This creates a new active version with this content. Your other versions are kept.`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/\(main\)/dashboard/resume/\[resumeId\]/sections/versionMenu.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/dashboard/resume/[resumeId]/sections/versionMenu.ts" "src/app/(main)/dashboard/resume/[resumeId]/sections/versionMenu.test.ts"
git commit -m "feat: add version-menu helpers for revert action"
```

---

## Task 2: `revertToVersionAction` server action

**Files:**
- Modify: `src/app/actions/resume.ts`

This file's server actions hit `fetch` and aren't unit-tested (the project only unit-tests pure helpers, e.g. `resumeCache.test.ts`). Verification is type-check + lint. Match the existing `getResumeVariantsAction` shape exactly.

- [ ] **Step 1: Add the action**

At the end of `src/app/actions/resume.ts` (after `getResumeVariantsAction`, before the trailing newline), add:

```ts
export async function revertToVersionAction(
  resumeId: string,
  variantId: string,
  versionId: string,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized' };
    }

    const res = await fetch(
      `${API_URL}/resumes/${resumeId}/variants/${variantId}/revert`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ versionId }),
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      return { error: 'Failed to revert version' };
    }

    refreshResumeSurfaces(resumeId);
    return { success: true };
  } catch (err) {
    console.error('Revert Version Error:', err);
    return { error: 'An unexpected error occurred while reverting the version' };
  }
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors related to `resume.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/resume.ts
git commit -m "feat: add revertToVersionAction server action"
```

---

## Task 3: Overflow menu + confirm modal in `VersionsSection`

**Files:**
- Modify: `src/app/(main)/dashboard/resume/[resumeId]/sections/VersionsSection.tsx`

Replace the entire file. This adds the `resumeId`/`variantId` props, the per-version 3-dot menu (only on non-active versions, mirroring the resume-level menu at `ResumeDetailView.tsx:215-266`), the confirm modal (mirroring the delete modal pattern), and `router.refresh()` on success.

- [ ] **Step 1: Replace the file contents**

Write `src/app/(main)/dashboard/resume/[resumeId]/sections/VersionsSection.tsx`:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Link as LinkIcon,
  ArrowSquareOut,
  Clock,
  UploadSimple,
  DotsThreeVertical,
  ArrowCounterClockwise,
} from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import Button from '@/components/Button/Button';
import Modal from '@/components/motion/Modal';
import Tooltip from '@/components/Tooltip/Tooltip';
import { Version } from '@/types';
import { sortVersionsDesc } from '@/lib/versions';
import { revertToVersionAction } from '@/app/actions/resume';
import { canRevertToVersion, buildRevertConfirmText } from './versionMenu';
import styles from '../ResumeDetailView.module.css';

interface VersionsSectionProps {
  versions: Version[];
  username: string;
  resumeSlug: string;
  resumeId: string;
  variantId?: string;
  onUploadClick: () => void;
}

function formatDate(dateStr: string | Date) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
}

export default function VersionsSection({
  versions,
  username,
  resumeSlug,
  resumeId,
  variantId,
  onUploadClick,
}: VersionsSectionProps) {
  const router = useRouter();

  // Sort defensively so the timeline + "Active" badge are correct regardless of
  // the order the caller/API supplies. Latest = highest versionNumber.
  const sortedVersions = sortVersionsDesc(versions);
  const latestVersionNumber = sortedVersions[0]?.versionNumber;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmVersion, setConfirmVersion] = useState<Version | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  // Close the open menu on any outside click (the menu itself stops propagation).
  useEffect(() => {
    if (!openMenuId) return;
    const handleDocumentClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [openMenuId]);

  const copyLink = (versionNumber: number) => {
    const url = `${window.location.origin}/${username}/${resumeSlug}/v${versionNumber}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(`Copied link for Version ${versionNumber}!`))
      .catch(() => toast.error("Couldn't copy link. Please try again."));
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const openRevertConfirm = (e: React.MouseEvent, version: Version) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setConfirmVersion(version);
  };

  const confirmRevert = async () => {
    if (!confirmVersion || !variantId) return;
    const target = confirmVersion;
    setIsReverting(true);
    try {
      const result = await revertToVersionAction(resumeId, variantId, target.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Reverted to Version ${target.versionNumber}.`);
        setConfirmVersion(null);
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to revert version:', err);
      toast.error('Failed to revert version. Please try again.');
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <div className={styles.versionsWrap}>
      <div className={styles.versionsHeader}>
        <p className={styles.sectionLede}>Track, preview, and share every historical version of this resume.</p>
        <Button variant="secondary" size="sm" onClick={onUploadClick}>
          <UploadSimple size={14} />
          Upload new version
        </Button>
      </div>

      {sortedVersions.length === 0 ? (
        <div className={styles.emptyState}>
          <Clock size={40} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No versions found</h3>
          <p className={styles.emptyText}>Upload your first file to begin version tracking.</p>
        </div>
      ) : (
        <div className={styles.timeline}>
          {sortedVersions.map((version) => {
            const isLatest = version.versionNumber === latestVersionNumber;
            const showMenu = Boolean(variantId) && canRevertToVersion(version.versionNumber, latestVersionNumber);
            return (
              <div key={version.id} className={styles.versionRow}>
                <div className={styles.dotContainer}>
                  <div className={`${styles.dot} ${isLatest ? styles.activeDot : ''}`} />
                </div>
                <div className={styles.versionDetails}>
                  <div className={styles.versionHeader}>
                    <span className={styles.versionTitle}>Version {version.versionNumber}</span>
                    {isLatest && <span className={styles.badge}>Active</span>}
                  </div>
                  <span className={styles.versionDate}>{formatDate(version.createdAt)}</span>
                </div>
                <div className={styles.versionActions}>
                  <Button size="sm" onClick={() => copyLink(version.versionNumber)}>
                    <LinkIcon size={14} />
                    Copy share link
                  </Button>
                  {version.fileUrl && (
                    <Button variant="secondary" size="sm" href={version.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ArrowSquareOut size={14} />
                      View PDF
                    </Button>
                  )}
                  {showMenu && (
                    <div className={styles.menu}>
                      <Tooltip label="More options" disabled={openMenuId === version.id}>
                        <button
                          type="button"
                          className={styles.menuButton}
                          onClick={(e) => toggleMenu(e, version.id)}
                          aria-label="More options"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === version.id}
                        >
                          <DotsThreeVertical size={18} weight="bold" />
                        </button>
                      </Tooltip>
                      <AnimatePresence>
                        {openMenuId === version.id && (
                          <motion.div
                            className={styles.dropdownMenu}
                            role="menu"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            style={{ transformOrigin: 'top right' }}
                          >
                            <button
                              className={styles.dropdownItem}
                              role="menuitem"
                              onClick={(e) => openRevertConfirm(e, version)}
                            >
                              <ArrowCounterClockwise size={15} />
                              Revert to this version
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={confirmVersion !== null}
        onClose={() => {
          if (!isReverting) setConfirmVersion(null);
        }}
        overlayClassName={styles.modalOverlay}
        contentClassName={styles.modalContent}
        labelledBy="revert-version-title"
      >
        <h3 id="revert-version-title" className={styles.modalTitle}>Revert to this version</h3>
        <p className={styles.modalDesc}>
          {confirmVersion ? buildRevertConfirmText(confirmVersion.versionNumber) : ''}
        </p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setConfirmVersion(null)} disabled={isReverting}>
            Cancel
          </Button>
          <Button onClick={confirmRevert} loading={isReverting}>
            Revert
          </Button>
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: errors only about `VersionsSection` missing the new required `resumeId` prop at its call site in `ResumeDetailView.tsx` (fixed in Task 4). No other errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(main)/dashboard/resume/[resumeId]/sections/VersionsSection.tsx"
git commit -m "feat: add revert overflow menu and confirm modal to VersionsSection"
```

---

## Task 4: Pass `resumeId` and `variantId` from `ResumeDetailView`

**Files:**
- Modify: `src/app/(main)/dashboard/resume/[resumeId]/ResumeDetailView.tsx:299-306`

`defaultVariant` is already computed (~line 84) and `resume.id` is in scope (already passed to `UploadModal`).

- [ ] **Step 1: Add the two props to the `VersionsSection` call**

Find:

```tsx
        {activeTab === 'versions' && (
          <VersionsSection
            versions={versions}
            username={user.username}
            resumeSlug={resume.slug}
            onUploadClick={() => setIsUploadOpen(true)}
          />
        )}
```

Replace with:

```tsx
        {activeTab === 'versions' && (
          <VersionsSection
            versions={versions}
            username={user.username}
            resumeSlug={resume.slug}
            resumeId={resume.id}
            variantId={defaultVariant?.id}
            onUploadClick={() => setIsUploadOpen(true)}
          />
        )}
```

- [ ] **Step 2: Type-check, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass, no errors.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS (includes the new `versionMenu` tests).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/dashboard/resume/[resumeId]/ResumeDetailView.tsx"
git commit -m "feat: wire resumeId and variantId into VersionsSection"
```

---

## Manual Verification (after backend endpoint is live)

Cannot fully run until the backend `POST /resumes/:resumeId/variants/:variantId/revert` endpoint exists (see backend handoff doc). Until then, verify the UI shell:

- [ ] On the Versions tab, every version **except the active one** shows a 3-dot menu; the active version shows none.
- [ ] Clicking the menu opens a single "Revert to this version" item; clicking outside closes it.
- [ ] Clicking the item opens a confirm modal naming the correct version number; Cancel dismisses it.
- [ ] (With backend live) Confirm → success toast, timeline refreshes, the reverted content becomes the new Active version, older versions remain, and the public `v{N}` link serves the reverted PDF.
- [ ] (With backend live) Force an error response → error toast, modal stays usable.

---

## Self-Review Notes

- **Spec coverage:** overflow menu (Task 3), hidden on active version (`canRevertToVersion`, Tasks 1+3), confirm modal (Task 3), `variantId` thread-through (Task 4), `revertToVersionAction` (Task 2), `refreshResumeSurfaces` + `router.refresh()` (Tasks 2+3), non-destructive semantics (backend handoff). All covered.
- **Type consistency:** helper names `canRevertToVersion` / `buildRevertConfirmText` used identically in Tasks 1 and 3; action signature `revertToVersionAction(resumeId, variantId, versionId)` matches between Tasks 2 and 3; `VersionsSection` props added in Task 3 match the call site updated in Task 4.
- **No placeholders:** every code step is complete and runnable.
