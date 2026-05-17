'use client';

import React, { useState } from 'react';
import styles from './Dashboard.module.css';
import ResumeCard from '@/components/ResumeCard/ResumeCard';
import UploadModal from '@/components/UploadModal/UploadModal';
import { Plus } from 'lucide-react';
import { Resume, User } from '@/types';

interface DashboardViewProps {
  user: User;
  resumes: Resume[];
}

export default function DashboardView({ user, resumes }: DashboardViewProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {user.username}.</h1>
          <p className={styles.subtitle}>Here are your active master documents.</p>
        </div>
        <button 
          className={`btn-primary ${styles.newBtn}`}
          onClick={() => setIsUploadOpen(true)}
        >
          <Plus size={18} />
          New Masterpiece
        </button>
      </header>
      
      <div className={styles.grid}>
        {resumes.map(resume => (
          resume.variants?.map(variant => (
            <ResumeCard 
              key={variant.id}
              title={variant.slug === 'default' ? 'Master Resume' : `${variant.slug} Resume`}
              timeAgo={new Date(resume.createdAt).toLocaleDateString()}
              tags={[variant.slug]}
              imageUrl="https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop"
            />
          ))
        ))}

        {resumes.length === 0 && (
          <div className={styles.newVariantCard} onClick={() => setIsUploadOpen(true)}>
            <div className={styles.newVariantIcon}>
              <Plus size={24} />
            </div>
            <h3 className={styles.newVariantTitle}>Upload First Resume</h3>
            <p className={styles.newVariantDesc}>
              Get started by uploading your master PDF.
            </p>
          </div>
        )}
        
        {/* New Variant Card (only show if they have a master) */}
        {resumes.length > 0 && (
          <div 
            className={styles.newVariantCard}
            onClick={() => setIsUploadOpen(true)}
          >
            <div className={styles.newVariantIcon}>
              <Plus size={24} />
            </div>
            <h3 className={styles.newVariantTitle}>Create new variant</h3>
            <p className={styles.newVariantDesc}>
              Tailor your master document for a new role.
            </p>
          </div>
        )}
      </div>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
      />
    </div>
  );
}
