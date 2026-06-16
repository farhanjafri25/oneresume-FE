/**
 * Sharing OneCV (the product) — single source of truth for the share widget.
 *
 * Framework-pure: no React or icon imports, so it stays server-importable and
 * unit-testable. The widget resolves an icon per channel from `channel.id`.
 */

/** The product URL we invite users to share. */
export const ONECV_URL = 'https://onecv.co';

/** Pre-filled promo copy. Platforms with a composer (X, Threads) use this; LinkedIn ignores it. */
export const ONECV_SHARE_MESSAGE =
  'I built my resume with OneCV — clean, fast, and it actually looks good. Worth a look:';

export type ShareChannelId = 'x' | 'threads' | 'linkedin';

export interface ShareChannel {
  id: ShareChannelId;
  /** Visible row label. */
  label: string;
  /**
   * Builds the platform's share-intent URL. `message` is honoured by platforms
   * that support a pre-filled composer (X, Threads); LinkedIn is URL-only and
   * ignores it, building its preview from the page's OpenGraph metadata instead.
   */
  buildUrl: (productUrl: string, message: string) => string;
}

/**
 * The URL to share. `ref` is a forward-looking hook: pass a username later to
 * attribute referrals (`?ref=<username>`) without touching the widget. Default
 * behaviour shares the bare product URL.
 */
export function getProductUrl(ref?: string): string {
  if (!ref) return ONECV_URL;
  const url = new URL(ONECV_URL);
  url.searchParams.set('ref', ref);
  return url.toString();
}

/**
 * Data-driven share channels — adding, removing, or reordering a channel is a
 * one-line edit here; the widget renders whatever this array contains.
 */
export const SHARE_CHANNELS: ShareChannel[] = [
  {
    id: 'x',
    label: 'Share on X',
    buildUrl: (productUrl, message) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${message} ${productUrl}`)}`,
  },
  {
    id: 'threads',
    label: 'Share on Threads',
    buildUrl: (productUrl, message) =>
      `https://www.threads.net/intent/post?text=${encodeURIComponent(`${message} ${productUrl}`)}`,
  },
  {
    id: 'linkedin',
    label: 'Share on LinkedIn',
    // share-offsite accepts only `url`; LinkedIn ignores any text and builds the
    // preview from the target page's OpenGraph tags.
    buildUrl: (productUrl) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`,
  },
];

/**
 * Copy text to the clipboard. Returns whether it succeeded so the caller can fire
 * the right toast. Centralises the pattern otherwise duplicated inline across the app.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
