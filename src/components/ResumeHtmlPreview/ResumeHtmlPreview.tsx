'use client';

import React from 'react';
import { ArrowClockwise } from '@phosphor-icons/react/dist/ssr';
import styles from './ResumeHtmlPreview.module.css';

interface ResumeHtmlPreviewProps {
  /** Rendered resume HTML to show in the sandboxed iframe. */
  html: string;
  /** Whether a render is in flight (shows an overlay over any existing html). */
  loading?: boolean;
  /** Whether the last render failed (shows a retry affordance). */
  error?: boolean;
  /**
   * Zoom factor for the document. The iframe lays out at `container / scale`
   * px and is then transformed back down, so a smaller scale fits more of the
   * page (use ~0.5 for the hero, ~0.28 for thumbnails).
   */
  scale?: number;
  ariaLabel?: string;
  /** Copy shown before the first render completes. */
  emptyLabel?: string;
  onRetry?: () => void;
  className?: string;
  /**
   * Insets the page inside a "mat" so the resume reads as a lifted document
   * floating within the frame rather than bleeding to the border. The frame's
   * padding/background (from `className`) becomes the visible mat.
   */
  matted?: boolean;
}

/**
 * Shared, sandboxed, scaled HTML preview. Used for both the large live preview
 * and the small theme thumbnails so the scaling math lives in exactly one place.
 * The caller supplies the sized frame (aspect ratio, radius, shadow) via
 * `className`; this component only owns the iframe and its overlay states.
 */
export default function ResumeHtmlPreview({
  html,
  loading = false,
  error = false,
  scale = 0.5,
  ariaLabel = 'Resume preview',
  emptyLabel = 'Rendering layout…',
  onRetry,
  className,
  matted = false,
}: ResumeHtmlPreviewProps) {
  const sizePct = `${100 / scale}%`;
  const frameClass = [styles.frame, matted && styles.matted, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={frameClass}>
      <div className={styles.viewport}>
        {html ? (
          <iframe
            title={ariaLabel}
            srcDoc={html}
            sandbox="allow-scripts"
            className={styles.iframe}
            style={{
              width: sizePct,
              height: sizePct,
              transform: `scale(${scale})`,
            }}
          />
        ) : (
          !error && <div className={styles.empty}>{emptyLabel}</div>
        )}

        {error && (
          <div className={styles.errorState}>
            <span className={styles.errorText}>
              Couldn&apos;t render this layout.
            </span>
            {onRetry && (
              <button type="button" className={styles.retry} onClick={onRetry}>
                <ArrowClockwise size={14} />
                Retry
              </button>
            )}
          </div>
        )}

        {loading && html && (
          <div className={styles.overlay} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
