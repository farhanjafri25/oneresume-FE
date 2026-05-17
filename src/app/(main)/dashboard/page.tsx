'use client';

import React, { useState } from 'react';
import styles from './Dashboard.module.css';
import ResumeCard from '@/components/ResumeCard/ResumeCard';
import UploadModal from '@/components/UploadModal/UploadModal';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, Alex.</h1>
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
        <ResumeCard 
          title="Senior Product Designer" 
          timeAgo="2h ago" 
          tags={['Frontend', 'Design']} 
          imageUrl="https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop"
        />
        <ResumeCard 
          title="UX Lead - Tech" 
          timeAgo="3d ago" 
          tags={['Management']} 
          imageUrl="https://images.unsplash.com/photo-1542626991-cbc4e32524cc?q=80&w=600&auto=format&fit=crop"
        />
        
        {/* New Variant Card */}
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
      </div>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
      />
    </div>
  );
}
