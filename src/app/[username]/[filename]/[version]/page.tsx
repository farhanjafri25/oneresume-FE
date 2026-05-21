import React from 'react';
import styles from '../page.module.css';
import { Download } from 'lucide-react';
import { notFound } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default async function PublicResumeVersionPage({
  params,
}: {
  params: Promise<{ username: string; filename: string; version: string }>;
}) {
  const { username, filename, version } = await params;

  // Fetch from the public backend endpoint for specific version
  const res = await fetch(`${API_URL}/${username}/${filename}/${version}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();
  const fileUrl = data.fileUrl; // UploadThing PDF URL

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.barContent}>
          <div className={styles.left}>
            <span className={styles.logo}>OneResume</span>
            <span className={styles.divider}></span>
            <span className={styles.name}>{username}</span>
            <span className={styles.variantBadge}>
              {filename} - {version.toUpperCase()}
            </span>
          </div>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-primary ${styles.downloadBtn}`}
            >
              <Download size={14} />
              Download PDF ({version.toUpperCase()})
            </a>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {fileUrl ? (
          <iframe
            src={fileUrl}
            className={styles.pdfPreview}
            title={`${username}'s Resume - ${filename} (${version})`}
          />
        ) : (
          <div className={styles.errorState}>No PDF preview available</div>
        )}
      </main>
    </div>
  );
}
