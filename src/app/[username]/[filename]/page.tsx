import React from 'react';
import { headers } from 'next/headers';
import styles from './page.module.css';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr';
import { notFound } from 'next/navigation';
import Button from '@/components/Button/Button';
import PdfPreview from './PdfPreview';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default async function PublicResumePage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ username: string; filename: string }>;
  searchParams: Promise<{ for?: string }>;
}) {
  const { username, filename } = await params;
  const { for: forParam } = await searchParams;

  // Capture original browser headers from Next.js request context
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const referer = headersList.get('referer') || '';
  const ip = headersList.get('x-forwarded-for') || '';
  const country = headersList.get('x-vercel-ip-country') || '';

  const forQuery = forParam ? `?for=${encodeURIComponent(forParam)}` : '';

  // Fetch from the public backend endpoint, forwarding browser context headers & campaign tag
  const res = await fetch(`${API_URL}/${username}/${filename}${forQuery}`, {
    headers: {
      'user-agent': userAgent,
      'referer': referer,
      'x-forwarded-for': ip,
      'x-vercel-ip-country': country,
    },
    next: { revalidate: 60 }
  });

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();
  const fileUrl = data.fileUrl; // This is the UploadThing URL
  
  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.barContent}>
          <div className={styles.left}>
            <span className={styles.logo}>OneCV</span>
            <span className={styles.divider}></span>
            <span className={styles.name} title={username}>{username}</span>
            <span className={styles.variantBadge} title={filename}>{filename}</span>
          </div>
          {fileUrl && (
            <Button href={`${API_URL}/${username}/${filename}/download${forQuery}`} target="_blank" rel="noopener noreferrer" size="sm" className={styles.downloadBtn}>
              <DownloadSimple size={14} />
              Download PDF
            </Button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {fileUrl ? (
          <PdfPreview
            fileUrl={fileUrl}
            title={`${username}'s Resume - ${filename}`}
          />
        ) : (
          <div className={styles.errorState}>No PDF preview available</div>
        )}
      </main>
    </div>
  );
}
