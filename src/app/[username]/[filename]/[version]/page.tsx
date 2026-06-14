import React from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import styles from '../page.module.css';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr';
import { notFound } from 'next/navigation';
import Button from '@/components/Button/Button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default async function PublicResumeVersionPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; filename: string; version: string }>;
  searchParams: Promise<{ for?: string }>;
}) {
  const { username, filename, version } = await params;
  const { for: forParam } = await searchParams;

  // Capture original browser headers from Next.js request context
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const referer = headersList.get('referer') || '';
  const ip = headersList.get('x-forwarded-for') || '';
  const country = headersList.get('x-vercel-ip-country') || '';

  const forQuery = forParam ? `?for=${encodeURIComponent(forParam)}` : '';

  // Fetch from the public backend endpoint for specific version, forwarding browser context headers & campaign tag
  const res = await fetch(`${API_URL}/${username}/${filename}/${version}${forQuery}`, {
    headers: {
      'user-agent': userAgent,
      'referer': referer,
      'x-forwarded-for': ip,
      'x-vercel-ip-country': country,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();
  const fileUrl = data.fileUrl; // UploadThing PDF URL

  // Resume owner info — defensively read from the response (nested or flat),
  // falling back to the URL username and a generated avatar.
  const owner = data.user ?? data;
  const ownerName: string = owner.name || owner.username || username;
  const ownerAvatar: string =
    owner.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=random`;

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.barContent}>
          <div className={styles.left}>
            <Link href="https://onecv.co" className={styles.logo}>
              <img src="/logo.svg" alt="OneCV" className={styles.logoImg} />
            </Link>
            <span className={styles.divider}></span>
            <span className={styles.variantBadge}>
              {filename}
            </span>
          </div>
          {fileUrl && (
            <Button
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              className={styles.downloadBtn}
            >
              <DownloadSimple size={14} />
              Download PDF
            </Button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {fileUrl ? (
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&view=FitH`}
            className={styles.pdfPreview}
            title={`${username}'s Resume - ${filename} (${version})`}
          />
        ) : (
          <div className={styles.errorState}>No PDF preview available</div>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerUser}>
          <img src={ownerAvatar} alt={ownerName} className={styles.footerAvatar} />
          <span className={styles.footerName}>{ownerName}</span>
        </div>
        <Link href="https://onecv.co" className={styles.footerCta}>
          Create your resume on OneCV
        </Link>
      </footer>
    </div>
  );
}
