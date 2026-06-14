# Backend handoff — Revert to a version

**Date:** 2026-06-14
**Audience:** backend owner
**Frontend consumer:** `revertToVersionAction` in `src/app/actions/resume.ts`

The frontend is adding a "Revert to this version" action to the resume version
history. It needs **one new endpoint**. This doc specifies the contract the frontend
will call. If you change the path or shape, tell the frontend so the server action
stays in sync.

## Behavior (non-destructive promote)

Reverting to version `versionId` must:

1. Look up the target version belonging to the given variant.
2. Create a **new** version on that variant, reusing the target version's source file
   (`fileUrl` / underlying stored PDF) — copy the file or reference the same stored
   asset, whichever your storage model prefers.
3. Assign the new version the next sequential `versionNumber` for the variant
   (i.e. `max(versionNumber) + 1`), a fresh `id`, a fresh `publicId`, and a current
   `createdAt`.
4. **Not delete or mutate** any existing version. History is append-only.

After this call, the new version is the latest (highest `versionNumber`), so the
frontend — which derives "active" as the max `versionNumber` — treats it as active
automatically. The default share link and the latest `v{N}` link then serve the
reverted content.

## Endpoint

```
POST /api/resumes/:resumeId/variants/:variantId/revert
```

### Auth

- `Authorization: Bearer <token>` (same scheme as the existing
  `/resumes/:resumeId/variants` and upload endpoints).
- Must enforce that the authenticated user owns `resumeId` → respond 401/403 otherwise.

### Request

Headers: `Content-Type: application/json`

Body:

```json
{ "versionId": "<id of the version to revert to>" }
```

### Success — 200 (or 201)

Return the newly created version, matching the existing `Version` shape the frontend
already uses (`src/types/index.ts`):

```json
{
  "id": "<new version id>",
  "variantId": "<variantId>",
  "versionNumber": 6,
  "fileUrl": "<url to the reused PDF>",
  "publicId": "<new public id>",
  "createdAt": "<ISO timestamp>"
}
```

The frontend currently only relies on a successful (`res.ok`) response and then
re-fetches variants, so the exact body is not strictly required — but returning the
new `Version` object is preferred for future use and consistency.

## Error responses

| Status | When | Body |
| --- | --- | --- |
| 400 | Missing/invalid `versionId`, or version doesn't belong to the variant | `{ "error": "..." }` |
| 401 | Missing/invalid token | `{ "error": "Unauthorized" }` |
| 403 | Authenticated user doesn't own the resume | `{ "error": "Forbidden" }` |
| 404 | `resumeId` / `variantId` / `versionId` not found | `{ "error": "Not found" }` |

Any non-2xx causes the frontend to show a generic "Failed to revert version" toast.

## Notes / edge cases

- **Reverting to the current latest version:** the frontend hides the option on the
  active version, so this shouldn't be called — but if it is, creating a duplicate
  top version is acceptable (still non-destructive). Optionally no-op and return the
  existing latest.
- **`publicId` uniqueness:** the new version needs its own `publicId` so its
  `/{username}/{slug}/v{N}` link resolves independently.
- **File reuse vs copy:** reusing the same stored asset is fine as long as deleting a
  later version never orphans the file for the reverted version. If your storage
  refcounts or deletes by version, copy the file instead.
