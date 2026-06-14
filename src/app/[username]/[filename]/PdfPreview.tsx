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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Detect mobile device to switch to PDF.js rendering
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobileDevice(isMobile);

    if (!containerRef.current || isMobile) return;

    const updateLayout = () => {
      if (!containerRef.current) return;
      
      const screenWidth = window.innerWidth;
      const containerWidth = containerRef.current.clientWidth;
      
      if (screenWidth <= 768) {
        setScale(containerWidth / 595);
      } else {
        setScale(1);
      }
    };

    updateLayout();
    const observer = new ResizeObserver(() => updateLayout());
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLayout);
    };
  }, []);

  if (!mounted || isMobileDevice === null) return null;

  return (
    <div 
      ref={containerRef} 
      className={!isMobileDevice ? styles.desktopContainer : styles.pdfWrapper}
      style={!isMobileDevice && window.innerWidth <= 768 ? { height: `${842 * scale}px` } : undefined}
    >
      {isMobileDevice ? (
        <MobilePdfViewer fileUrl={fileUrl} />
      ) : (
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0&view=FitH`}
          title={title}
          className={window.innerWidth <= 768 ? styles.pdfIframe : styles.pdfPreview}
          style={window.innerWidth <= 768 ? { transform: `scale(${scale})` } : undefined}
        />
      )}
    </div>
  );
}

function MobilePdfViewer({ fileUrl }: { fileUrl: string }) {
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
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading preview...</div>;
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
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
    
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !wrapperRef.current) return;
      
      const page = await pdfDoc.getPage(pageNumber);
      if (!active) return;

      const containerWidth = wrapperRef.current.clientWidth;
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

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
    };

    renderPage();

    return () => { active = false; };
  }, [pdfDoc, pageNumber]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', maxWidth: '800px', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
    </div>
  );
}
