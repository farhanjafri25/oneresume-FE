# Revert to a version — design

**Date:** 2026-06-14
**Status:** Approved (pending implementation)

## Problem

The version history (Versions tab on a resume's detail page) lists every uploaded
version of a resume but offers no way to make an older version active again. Users
who upload a new version and then prefer an older one have no recourse short of
re-uploading the old file by hand.

## Goal

Let a user revert to any older version directly from the version history via a
per-version overflow (3-dot) menu.

## Semantics — non-destructive promote (option A)

Reverting to version N asks the backend to create a **new** top version that reuses
version N's source PDF. That new version becomes the active one (highest
`versionNumber`); all existing versions remain untouched in history.

- Nothing is deleted; history is append-only.
- "Active" continues to be derived as the highest `versionNumber` — no schema or
  derivation change on the frontend.
- The default share link (`/{username}/{slug}` and the latest `v{N}`) now serves the
  reverted content because a new latest version exists.

Rejected alternatives: an explicit `activeVersionId` pointer (would require changing
how "active" is derived everywhere), and deleting newer versions (destructive, loses
history).

## Frontend changes

### 1. `VersionsSection.tsx` — overflow menu per version

File: `src/app/(main)/dashboard/resume/[resumeId]/sections/VersionsSection.tsx`

- Add a 3-dot overflow menu to each `versionRow`, built on the **same pattern already
  used in `ResumeCard`** (`src/components/ResumeCard/ResumeCard.tsx`):
  - `DotsThreeVertical` icon button from `@phosphor-icons/react`.
  - Local `useState` for open/close; a `useEffect` document-click listener to close on
    outside click (one menu open at a time — track the open version's id).
  - `aria-haspopup="menu"`, `aria-expanded`, `role="menu"` / `role="menuitem"`.
- The menu contains a single item: **"Revert to this version."**
- The item is **hidden on the currently-active (latest) version** — reverting to the
  active version is a no-op. (If a version row has no other actions, the menu can be
  omitted entirely for the active version, or shown disabled — prefer hiding the menu
  on the active row to keep it clean.)
- Reuse / extend the existing `.dropdownMenu` / `.dropdownItem` CSS conventions; add
  the needed styles to the section's CSS module (`ResumeDetailView.module.css`) in the
  same style as `ResumeCard.module.css`.

### 2. Confirmation modal

- Clicking "Revert to this version" opens a confirmation modal matching the
  delete-confirmation pattern in `ResumeCard`:
  - Copy: "Revert to Version {N}? This creates a new active version with this content.
    Your other versions are kept."
  - Buttons: a secondary "Cancel" and a primary "Revert" (shared `Button` component —
    flat green pill; no all-caps, no emojis per UI conventions).
- Confirm triggers the server action with an in-flight loading/disabled state on the
  Revert button.
- On success: `toast.success('Reverted to Version {N}.')` and refresh the view so the
  timeline shows the new active version. On error: `toast.error(...)`.

### 3. New prop: `variantId`

- `VersionsSection` currently receives `versions`, `username`, `resumeSlug`,
  `onUploadClick`. Add `variantId: string | undefined`.
- Thread it from `ResumeDetailView` — `defaultVariant?.id` is already computed
  (line ~84) and already passed to the upload modal; pass the same value into
  `VersionsSection`.
- The revert action needs `resumeId`, `variantId`, and the target `versionId`.
  `resumeId` is available in `ResumeDetailView`; pass it down too (or pass a bound
  callback — see below).

### 4. Refresh after success

- The server action calls `refreshResumeSurfaces(resumeId)` (revalidates the cached
  surfaces). Additionally call `router.refresh()` from the client after a successful
  revert so the detail page re-renders with the new version without a manual reload.

## Server action

File: `src/app/actions/resume.ts`

Add `revertToVersionAction(resumeId, variantId, versionId)` following the exact shape
of the existing actions in this file:

```ts
export async function revertToVersionAction(
  resumeId: string,
  variantId: string,
  versionId: string,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return { error: 'Unauthorized' };

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

    if (!res.ok) return { error: 'Failed to revert version' };

    refreshResumeSurfaces(resumeId);
    return { success: true };
  } catch (err) {
    console.error('Revert Version Error:', err);
    return { error: 'An unexpected error occurred while reverting the version' };
  }
}
```

(Final endpoint path/shape per the backend handoff doc — keep the two in sync.)

## Out of scope

- Reverting tailored (non-default) variants — this design targets the default
  variant's version history shown in the Versions tab. The action is variant-generic,
  so extending later is trivial, but the UI work here is the default variant only.
- Version diff/compare, version deletion, version notes.

## Testing

- Manual: upload v1, v2, v3; revert to v1; confirm a v4 appears as Active reusing v1's
  PDF, and v1–v3 remain in history; confirm the public share link serves v1's content.
- Confirm the menu does not appear (or revert option is absent) on the active version.
- Confirm error path toasts on a failed/unauthorized request.

## Backend

Requires one new endpoint, implemented by the backend owner. See the companion
handoff doc: `2026-06-14-revert-to-version-backend-handoff.md`.
