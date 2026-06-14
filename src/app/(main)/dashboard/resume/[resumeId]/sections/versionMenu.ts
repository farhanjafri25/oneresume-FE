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
