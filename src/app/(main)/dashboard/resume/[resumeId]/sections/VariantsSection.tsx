'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkle, Link as LinkIcon, ArrowSquareOut, Plus } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import Button from '@/components/Button/Button';
import { Resume, Variant } from '@/types';
import { getLatestVersion } from '@/lib/versions';
import styles from '../ResumeDetailView.module.css';

interface VariantsSectionProps {
  resume: Resume;
  username: string;
  variants: Variant[];
}

export default function VariantsSection({ resume, username, variants }: VariantsSectionProps) {
  const copyLink = (variantSlug: string) => {
    const url = `${window.location.origin}/${username}/${resume.slug}/${variantSlug}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(`Link for "${variantSlug}" copied to clipboard!`))
      .catch(() => toast.error("Couldn't copy link. Please try again."));
  };

  if (variants.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Sparkle size={40} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>No tailored variants yet</h3>
        <p className={styles.emptyText}>
          Create role-specific variants (like &ldquo;frontend&rdquo; or &ldquo;backend&rdquo;) by generating one with
          AI on top of this resume.
        </p>
        <Button href={`/dashboard/ai-builder/${resume.id}`}>
          <Sparkle size={16} />
          Tailor with AI
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.variantList}>
      {variants.map((variant) => {
        const latest = getLatestVersion(variant.versions);
        const publicUrl = `/${username}/${resume.slug}/${variant.slug}`;
        return (
          <div key={variant.id} className={styles.variantRow}>
            <div className={styles.variantInfo}>
              <span className={styles.variantName}>{variant.slug}</span>
              <span className={styles.variantMeta}>{latest ? `v${latest.versionNumber}` : 'No PDF'}</span>
            </div>
            <div className={styles.variantActions}>
              <Button variant="secondary" size="sm" onClick={() => copyLink(variant.slug)}>
                <LinkIcon size={14} />
                Copy link
              </Button>
              {latest && (
                <Button variant="secondary" size="sm" href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ArrowSquareOut size={14} />
                  Open
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <Link href={`/dashboard/ai-builder/${resume.id}`} className={styles.variantAddRow}>
        <Plus size={16} />
        New variant with AI
      </Link>
    </div>
  );
}
