'use client';

import React from 'react';
import PdfFirstPage from '@/components/PdfFirstPage/PdfFirstPage';
import type { CardPreviewConfig } from '@/lib/cardPreviewDefaults';

interface ResumePreviewProps {
  pdfUrl?: string;
  title: string;
  /** Overrides for the shared card preview defaults. */
  config?: Partial<CardPreviewConfig>;
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
 * The shared PDF thumbnail. Renders page 1 to an image via pdf.js, so it shows
 * identically on every browser — including the Android Chrome / in-app webviews
 * that can't render a PDF inline in an iframe. The parent owns size, border and
 * rounding.
 */
export default function ResumePreview({
  pdfUrl,
  title,
  config,
  onEmptyClick,
  emptyTitle,
  emptySubtext,
}: ResumePreviewProps) {
  return (
    <PdfFirstPage
      pdfUrl={pdfUrl}
      title={title}
      config={config}
      onEmptyClick={onEmptyClick}
      emptyTitle={emptyTitle}
      emptySubtext={emptySubtext}
    />
  );
}
