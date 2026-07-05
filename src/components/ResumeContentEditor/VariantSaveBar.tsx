'use client';

import React from 'react';
import { FloppyDisk, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import Button from '@/components/Button/Button';
import styles from './ResumeContentEditor.module.css';

interface VariantSaveBarProps {
  title: string;
  slug: string;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  error?: string | null;
  /** e.g. "Build & save variant" (builder) / "Save as new variant" (editor). */
  saveLabel: string;
  /** e.g. "Generating PDF…" / "Saving…". */
  savingLabel: string;
}

/**
 * Sticky bar naming a variant (title + URL slug) and saving it, shared by the
 * AI builder's edit step and the resume editor. Save errors surface inline
 * above the fields.
 */
export default function VariantSaveBar({
  title,
  slug,
  onTitleChange,
  onSlugChange,
  onSave,
  saving,
  error,
  saveLabel,
  savingLabel,
}: VariantSaveBarProps) {
  return (
    <div className={styles.bottomBar}>
      {error && (
        <div className={styles.errorAlert}>
          <WarningCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      <div className={styles.bottomBarRow}>
        <div className={styles.bottomBarField}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Variant title</span>
            <input
              type="text"
              className={styles.inputField}
              placeholder="e.g. Google frontend resume"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.bottomBarField}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>URL slug</span>
            <input
              type="text"
              className={styles.inputField}
              placeholder="e.g. google-frontend"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.bottomBarButton}>
          <Button
            loading={saving}
            onClick={onSave}
            disabled={!title.trim() || !slug.trim()}
          >
            {!saving && <FloppyDisk size={16} />}
            {saving ? savingLabel : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
