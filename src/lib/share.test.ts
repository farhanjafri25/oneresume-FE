import { describe, expect, it } from 'vitest';
import { ONECV_URL, ONECV_SHARE_MESSAGE, getProductUrl, SHARE_CHANNELS } from './share';

const channel = (id: string) => {
  const found = SHARE_CHANNELS.find((c) => c.id === id);
  if (!found) throw new Error(`no channel ${id}`);
  return found;
};

describe('getProductUrl', () => {
  it('returns the bare product URL by default', () => {
    expect(getProductUrl()).toBe(ONECV_URL);
  });

  it('appends a ref query param when provided', () => {
    expect(getProductUrl('nihal')).toBe('https://onecv.co/?ref=nihal');
  });
});

describe('SHARE_CHANNELS buildUrl', () => {
  const url = getProductUrl();

  it('X encodes the message and url together into the text param', () => {
    expect(channel('x').buildUrl(url, ONECV_SHARE_MESSAGE)).toBe(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${ONECV_SHARE_MESSAGE} ${url}`)}`,
    );
  });

  it('Threads encodes the message and url together into the text param', () => {
    expect(channel('threads').buildUrl(url, ONECV_SHARE_MESSAGE)).toBe(
      `https://www.threads.net/intent/post?text=${encodeURIComponent(`${ONECV_SHARE_MESSAGE} ${url}`)}`,
    );
  });

  it('LinkedIn passes only the url and ignores the message', () => {
    const href = channel('linkedin').buildUrl(url, ONECV_SHARE_MESSAGE);
    expect(href).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    );
    expect(href).not.toContain(encodeURIComponent(ONECV_SHARE_MESSAGE));
  });
});
