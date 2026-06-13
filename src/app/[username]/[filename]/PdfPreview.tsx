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
  const [isMobileView, setIsMobileView] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!containerRef.current) return;

    const updateLayout = () => {
      if (!containerRef.current) return;
      
      const screenWidth = window.innerWidth;
      const containerWidth = containerRef.current.clientWidth;
      
      // Standard A4 dimensions in points/pixels are 595 x 842
      if (screenWidth <= 768) {
        setIsMobileView(true);
        setScale(containerWidth / 595);
      } else {
        setIsMobileView(false);
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

  const baseHeight = 842; // Exact A4 aspect ratio height
  const scaledHeight = baseHeight * scale;

  return (
    <div 
      ref={containerRef} 
      className={!isMobileView ? styles.desktopContainer : styles.pdfWrapper}
      style={isMobileView ? { height: `${scaledHeight}px` } : undefined}
    >
      {mounted && (
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0&view=FitH`}
          title={title}
          className={!isMobileView ? styles.pdfPreview : styles.pdfIframe}
          style={isMobileView ? { transform: `scale(${scale})` } : undefined}
        />
      )}
    </div>
  );
}
