import React from 'react';
import styles from './ResumeCard.module.css';
import { Link2, Upload, MoreVertical } from 'lucide-react';

interface ResumeCardProps {
  title: string;
  timeAgo: string;
  tags: string[];
  imageUrl: string;
  onUploadClick?: () => void;
}

export default function ResumeCard({ title, timeAgo, tags, imageUrl, onUploadClick }: ResumeCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img src={imageUrl} alt={title} className={styles.image} />
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.time}>{timeAgo}</span>
        </div>
        
        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
        
        <div className={styles.footer}>
          <button className={styles.actionBtn}>
            <Link2 size={16} />
            Copy Link
          </button>
          
          <div className={styles.rightActions}>
            <button className={styles.iconBtn} onClick={onUploadClick} title="Upload new version">
              <Upload size={16} />
            </button>
            <button className={styles.iconBtn}>
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
