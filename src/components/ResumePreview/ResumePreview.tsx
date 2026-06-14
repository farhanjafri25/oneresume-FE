'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { UploadSimple, FileText } from '@phosphor-icons/react/dist/ssr';
import styles from './ResumePreview.module.css';

interface ResumePreviewProps {
  pdfUrl?: string;
  title: string;
  /**
   * Click handler for the empty (no-PDF) placeholder. When omitted the
   * placeholder is non-interactive (e.g. on the dashboard card, where the whole
   * card already links to the detail page).
   */
  onEmptyClick?: () => void;
  emptyTitle?: string;
  emptySubtext?: string;
}

/**
 * The shared PDF thumbnail. Fills its parent (the parent owns size, border, and
 * rounding), so the dashboard card and the resume detail hero can render the
 * same preview at different scales.
 *
 * Some browsers (notably Android Chrome) can't render a PDF inline in an iframe.
 * We detect inline support and show a branded "Tap to open" fallback instead.
 * The server snapshot is false so SSR and the first client render agree, then it
 * upgrades to the live preview where supported.
 */
export default function ResumePreview({
  pdfUrl,
  title,
  onEmptyClick,
  emptyTitle = 'No PDF uploaded',
  emptySubtext = 'Click to upload your masterpiece',
}: ResumePreviewProps) {
  const [loadedPdfUrl, setLoadedPdfUrl] = useState<string | null>(null);
  const isPdfLoaded = loadedPdfUrl === pdfUrl;

  const canInlinePdf = useSyncExternalStore(
    () => () => {},
    () => navigator.pdfViewerEnabled === true,
    () => false,
  );

  const hasPdf = Boolean(pdfUrl && pdfUrl !== '#');

  const activateEmpty = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (!onEmptyClick) return;
    event.stopPropagation();
    event.preventDefault();
    onEmptyClick();
  };

  let body: React.ReactNode;
  if (!hasPdf) {
    body = (
      <div
        className={styles.placeholder}
        role={onEmptyClick ? 'button' : undefined}
        tabIndex={onEmptyClick ? 0 : undefined}
        onClick={onEmptyClick ? activateEmpty : undefined}
        onKeyDown={
          onEmptyClick
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  activateEmpty(event);
                }
              }
            : undefined
        }
        style={{ cursor: onEmptyClick ? 'pointer' : 'default' }}
      >
        <UploadSimple size={32} className={styles.placeholderIcon} />
        <span className={styles.placeholderText}>{emptyTitle}</span>
        <span className={styles.placeholderSubtext}>{emptySubtext}</span>
      </div>
    );
  } else if (!canInlinePdf) {
    body = (
      <div className={styles.fallback}>
        <div className={styles.fallbackTile}>
          <FileText size={24} className={styles.fallbackIcon} />
        </div>
        <span className={styles.fallbackSubtext}>Tap to open</span>
      </div>
    );
  } else {
    body = (
      <>
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          className={styles.iframe}
          title={title}
          onLoad={() => setLoadedPdfUrl(pdfUrl ?? null)}
        />
        <div
          className={`${styles.skeleton} ${isPdfLoaded ? styles.skeletonHidden : ''}`}
          aria-hidden="true"
        />
      </>
    );
  }

  return <div className={styles.preview}>{body}</div>;
}
