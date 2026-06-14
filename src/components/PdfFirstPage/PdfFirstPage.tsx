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
  // Keyed by URL so a stale result/error never shows after pdfUrl changes — and
  // so we never have to reset state synchronously inside the render effect.
  const [result, setResult] = useState<{ url: string; dataUrl: string } | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

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

  // Render once in view (or when the URL / renderScale changes). State is only
  // ever set from the async callbacks, never synchronously — the displayed
  // status is derived below from whether the result/error matches the current url.
  useEffect(() => {
    if (!hasPdf || !inView || !pdfUrl) return;
    const controller = new AbortController();
    const cssWidth = rootRef.current?.clientWidth || 320;
    renderFirstPageToDataUrl(pdfUrl, {
      cssWidth,
      renderScale: cfg.renderScale,
      signal: controller.signal,
    })
      .then(({ dataUrl }) => {
        if (!controller.signal.aborted) setResult({ url: pdfUrl, dataUrl });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailedUrl(pdfUrl);
      });
    return () => controller.abort();
  }, [hasPdf, inView, pdfUrl, cfg.renderScale]);

  // Only trust a result/error that belongs to the URL we're currently showing.
  const readyImage = result && result.url === pdfUrl ? result.dataUrl : null;
  const hasError = failedUrl === pdfUrl;

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
      {readyImage ? (
        // A client-rendered canvas data URL can't be optimized by next/image, so a plain <img> is correct.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={readyImage}
          alt={title}
          className={styles.image}
          style={{
            objectFit: cfg.fitMode,
            objectPosition: cfg.fitMode === 'cover' ? cfg.coverAnchor : 'center',
            borderRadius: cfg.cornerRadius,
          }}
        />
      ) : hasError ? (
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
