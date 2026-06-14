'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';
import type * as PdfjsModule from 'pdfjs-dist';

let pdfjsPromise: Promise<typeof PdfjsModule> | null = null;
async function getPdfjs(): Promise<typeof PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

interface PdfPreviewProps {
  fileUrl: string;
  title: string;
}

export default function PdfPreview({ fileUrl, title }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfDoc, setPdfDoc] = useState<PdfjsModule.PDFDocumentProxy | null>(null);

  useEffect(() => {
    let active = true;
    getPdfjs().then((pdfjs) => {
      if (!active) return;
      const loadingTask = pdfjs.getDocument({ url: fileUrl });
      loadingTask.promise.then((doc) => {
        if (!active) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      }).catch(console.error);
    });
    return () => { active = false; };
  }, [fileUrl]);

  if (!pdfDoc) {
    return <div className={styles.loadingState}>Loading preview...</div>;
  }

  return (
    <div className={styles.pagesContainer} aria-label={title}>
      {Array.from(new Array(numPages), (_, index) => (
        <PdfPage key={`page_${index + 1}`} pageNumber={index + 1} pdfDoc={pdfDoc} />
      ))}
    </div>
  );
}

function PdfPage({ pageNumber, pdfDoc }: { pageNumber: number; pdfDoc: PdfjsModule.PDFDocumentProxy }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let lastWidth = 0;
    let renderTask: PdfjsModule.RenderTask | null = null;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !wrapperRef.current) return;

      const containerWidth = wrapperRef.current.clientWidth;
      if (containerWidth === 0) return;
      lastWidth = containerWidth;

      // Cancel any in-flight render before reusing the canvas; PDF.js rejects
      // concurrent render() calls on the same canvas.
      renderTask?.cancel();

      const page = await pdfDoc.getPage(pageNumber);
      if (!active) return;

      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / unscaledViewport.width;

      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * dpr });

      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      renderTask = page.render({ canvasContext: ctx, viewport });
      try {
        await renderTask.promise;
      } catch (err) {
        // A cancelled render rejects with RenderingCancelledException; ignore it.
        if ((err as { name?: string })?.name !== 'RenderingCancelledException') {
          console.error(err);
        }
      }
    };

    renderPage();

    // Re-render when the container width changes (e.g. window resize or
    // mobile orientation change) so the page scales with its container.
    const observer = new ResizeObserver(() => {
      if (wrapperRef.current && wrapperRef.current.clientWidth !== lastWidth) {
        renderPage();
      }
    });
    if (wrapperRef.current) observer.observe(wrapperRef.current);

    return () => {
      active = false;
      renderTask?.cancel();
      observer.disconnect();
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div ref={wrapperRef} className={styles.pdfPage}>
      <canvas ref={canvasRef} className={styles.pdfCanvas} />
    </div>
  );
}
