'use client';

import React, { useEffect, useRef, useState } from 'react';
import { UploadSimple, FileText } from '@phosphor-icons/react/dist/ssr';
import { renderFirstPageToDataUrl } from '@/lib/pdf/pdfFirstPage';
import { cardPreviewDefaults, type CardPreviewConfig } from '@/lib/cardPreviewDefaults';
import styles from './PdfFirstPage.module.css';

interface PdfFirstPageProps {
  pdfUrl?: string;
  title: string;
  /** Overrides for the shared card preview defaults. */
  config?: Partial<CardPreviewConfig>;
  /** Click handler for the empty (no-PDF) placeholder. */
  onEmptyClick?: () => void;
  emptyTitle?: string;
  emptySubtext?: string;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Renders page 1 of a PDF to an <img>, so it shows identically on every browser
 * (no dependency on a native PDF viewer). Renders lazily on scroll-into-view.
 */
export default function PdfFirstPage({
  pdfUrl,
  title,
  config,
  onEmptyClick,
  emptyTitle = 'No PDF uploaded',
  emptySubtext = 'Click to upload your masterpiece',
}: PdfFirstPageProps) {
  const cfg = { ...cardPreviewDefaults, ...config };
  const hasPdf = Boolean(pdfUrl && pdfUrl !== '#');

  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [image, setImage] = useState<string | null>(null);

  // Reveal-on-scroll: don't touch pdf.js until the card is near the viewport.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !hasPdf) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasPdf]);

  // Render once in view (or when the URL / renderScale changes).
  useEffect(() => {
    if (!hasPdf || !inView || !pdfUrl) return;
    const controller = new AbortController();
    setStatus('loading');
    const cssWidth = rootRef.current?.clientWidth || 320;
    renderFirstPageToDataUrl(pdfUrl, {
      cssWidth,
      renderScale: cfg.renderScale,
      signal: controller.signal,
    })
      .then(({ dataUrl }) => {
        if (controller.signal.aborted) return;
        setImage(dataUrl);
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });
    return () => controller.abort();
  }, [hasPdf, inView, pdfUrl, cfg.renderScale]);

  const activateEmpty = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (!onEmptyClick) return;
    event.stopPropagation();
    event.preventDefault();
    onEmptyClick();
  };

  const boxStyle: React.CSSProperties = {
    aspectRatio: String(cfg.aspectRatio),
    borderRadius: cfg.cornerRadius,
    background: cfg.letterboxBg,
    padding: cfg.previewPadding,
  };

  if (!hasPdf) {
    return (
      <div className={styles.box} style={boxStyle}>
        <div
          className={styles.placeholder}
          role={onEmptyClick ? 'button' : undefined}
          tabIndex={onEmptyClick ? 0 : undefined}
          onClick={onEmptyClick ? activateEmpty : undefined}
          onKeyDown={
            onEmptyClick
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') activateEmpty(event);
                }
              : undefined
          }
          style={{ cursor: onEmptyClick ? 'pointer' : 'default' }}
        >
          <UploadSimple size={32} className={styles.placeholderIcon} />
          <span className={styles.placeholderText}>{emptyTitle}</span>
          <span className={styles.placeholderSubtext}>{emptySubtext}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={styles.box} style={boxStyle}>
      {status === 'ready' && image ? (
        <img
          src={image}
          alt={title}
          className={styles.image}
          style={{
            objectFit: cfg.fitMode,
            objectPosition: cfg.fitMode === 'cover' ? cfg.coverAnchor : 'center',
            borderRadius: cfg.cornerRadius,
          }}
        />
      ) : status === 'error' ? (
        <div className={styles.fallback}>
          <div className={styles.fallbackTile}>
            <FileText size={24} className={styles.fallbackIcon} />
          </div>
          <span className={styles.fallbackSubtext}>Preview unavailable</span>
        </div>
      ) : (
        <div className={styles.skeleton} aria-hidden="true" />
      )}
    </div>
  );
}
