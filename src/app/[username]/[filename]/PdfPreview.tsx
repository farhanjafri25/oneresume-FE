'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';

interface PdfPreviewProps {
  fileUrl: string;
  title: string;
}

export default function PdfPreview({ fileUrl, title }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!containerRef.current) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (width < 820) {
        setScale(width / 820);
      } else {
        setScale(1);
      }
    };

    updateScale();

    const observer = new ResizeObserver(() => updateScale());
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const baseHeight = 1160; // Approximate A4 aspect ratio height for 820px width
  const scaledHeight = baseHeight * scale;

  const isDesktop = scale === 1;

  return (
    <div 
      ref={containerRef} 
      className={isDesktop ? styles.desktopContainer : styles.pdfWrapper}
      style={!isDesktop ? { height: `${scaledHeight}px` } : undefined}
    >
      {mounted && (
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0&view=FitH`}
          title={title}
          className={isDesktop ? styles.pdfPreview : styles.pdfIframe}
          style={!isDesktop ? { transform: `scale(${scale})` } : undefined}
        />
      )}
    </div>
  );
}
