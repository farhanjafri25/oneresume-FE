'use client';

import React, { useState } from 'react';
import { useDialKit } from '@/components/DialKit/useDialKit';
import PdfFirstPage from '@/components/PdfFirstPage/PdfFirstPage';
import { cardPreviewDefaults, type FitMode, type CoverAnchor } from '@/lib/cardPreviewDefaults';
import styles from './Playground.module.css';

const SAMPLE_URL = '/samples/sample-resume.pdf';
const BROKEN_URL = '/samples/does-not-exist.pdf';

export default function PlaygroundClient() {
  const [extraUrl, setExtraUrl] = useState('');
  const [showOldVsNew, setShowOldVsNew] = useState(false);

  const { values, panel } = useDialKit('Card preview', {
    aspectRatio: { type: 'number', value: cardPreviewDefaults.aspectRatio, min: 0.4, max: 1.4, step: 0.001 },
    fitMode: { type: 'select', value: cardPreviewDefaults.fitMode, options: ['contain', 'cover'] },
    coverAnchor: { type: 'select', value: cardPreviewDefaults.coverAnchor, options: ['top', 'center'] },
    renderScale: { type: 'number', value: cardPreviewDefaults.renderScale, min: 1, max: 4, step: 0.25 },
    cornerRadius: { type: 'number', value: cardPreviewDefaults.cornerRadius, min: 0, max: 24, step: 1 },
    cardWidth: { type: 'number', value: 320, min: 220, max: 460, step: 10 },
    previewPadding: { type: 'number', value: cardPreviewDefaults.previewPadding, min: 0, max: 32, step: 1 },
    letterboxBg: { type: 'color', value: '#ffffff' },
    showTitle: { type: 'toggle', value: true },
    showMeta: { type: 'toggle', value: true },
  });

  const config = {
    aspectRatio: values.aspectRatio,
    fitMode: values.fitMode as FitMode,
    coverAnchor: values.coverAnchor as CoverAnchor,
    renderScale: values.renderScale,
    cornerRadius: values.cornerRadius,
    previewPadding: values.previewPadding,
    letterboxBg: values.letterboxBg,
  };

  const urls = [SAMPLE_URL, SAMPLE_URL, BROKEN_URL, ...(extraUrl ? [extraUrl] : [])];

  return (
    <div className={styles.layout}>
      <div className={styles.controls}>
        {panel}
        <div className={styles.extraControls}>
          <label className={styles.urlRow}>
            <span>Paste a PDF URL</span>
            <input
              type="url"
              placeholder="https://…/resume.pdf"
              value={extraUrl}
              onChange={(e) => setExtraUrl(e.target.value)}
            />
          </label>
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={showOldVsNew}
              onChange={(e) => setShowOldVsNew(e.target.checked)}
            />
            <span>Compare old iframe vs new pdf.js</span>
          </label>
        </div>
      </div>

      <main className={styles.stage}>
        {showOldVsNew ? (
          <div className={styles.compareRow}>
            <figure className={styles.compareCell}>
              <figcaption>Old: native iframe</figcaption>
              <div className={styles.card} style={{ width: values.cardWidth }}>
                <div
                  className={styles.preview}
                  style={{ aspectRatio: String(values.aspectRatio) }}
                >
                  <iframe
                    src={`${SAMPLE_URL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    title="old preview"
                    className={styles.iframe}
                  />
                </div>
              </div>
            </figure>
            <figure className={styles.compareCell}>
              <figcaption>New: pdf.js image</figcaption>
              <div className={styles.card} style={{ width: values.cardWidth }}>
                <div className={styles.preview}>
                  <PdfFirstPage pdfUrl={SAMPLE_URL} title="new preview" config={config} />
                </div>
              </div>
            </figure>
          </div>
        ) : (
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${values.cardWidth}px, 1fr))` }}
          >
            {urls.map((url, i) => (
              <div key={`${url}-${i}`} className={styles.card}>
                <div className={styles.preview}>
                  <PdfFirstPage pdfUrl={url} title={`Sample ${i + 1}`} config={config} />
                </div>
                {values.showTitle && <h3 className={styles.cardTitle}>Sample resume {i + 1}</h3>}
                {values.showMeta && <p className={styles.cardMeta}>v1 · 14/06/2026</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
