import { Variant, Version } from '@/types';

/**
 * Variant/version selection helpers.
 *
 * These centralize two assumptions that were previously scattered (and brittle)
 * across the dashboard, resume detail, and modal views:
 *   1. "Which variant is the canonical/default one?"
 *   2. "Which version is the latest, and in what order do we list them?"
 *
 * Deriving these from the data (isDefault flag, max versionNumber) rather than
 * trusting array position or a hardcoded slug means the UI stays correct even if
 * the backend changes ordering or the `default` slug convention.
 */

/**
 * The canonical variant for a resume. Prefers the explicit `isDefault` flag,
 * falls back to the `default` slug convention, then to the first variant.
 */
export function getDefaultVariant(variants?: Variant[]): Variant | undefined {
  if (!variants?.length) return undefined;
  return (
    variants.find((v) => v.isDefault) ??
    variants.find((v) => v.slug === 'default') ??
    variants[0]
  );
}

/**
 * Versions sorted newest-first by `versionNumber`, independent of the order the
 * API returns them in. Returns a new array; never mutates the input.
 */
export function sortVersionsDesc(versions?: Version[]): Version[] {
  return [...(versions ?? [])].sort((a, b) => b.versionNumber - a.versionNumber);
}

/** The latest version of a list, by highest `versionNumber` (null if none). */
export function getLatestVersion(versions?: Version[]): Version | null {
  return sortVersionsDesc(versions)[0] ?? null;
}
