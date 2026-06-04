import React from 'react';
import styles from './landing.module.css';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Crafting Your Next <span className={styles.titleAccent}>Chapter.</span>
        </h1>
        <p className={styles.subtitle}>
          The premium resume platform powered by AI to elevate your professional journey.
          Upload your Resume, tailor with AI, and track every view.
        </p>
        
        <div className={styles.ctaContainer}>
          <Link href="/dashboard" className="btn-primary">
            Build Your Resume <ArrowRight size={18} />
          </Link>
          <Link href="#features" className={styles.btnSecondary}>
            How it Works
          </Link>
        </div>
      </section>
      
      <section className={styles.mockupSection}>
        <div className={styles.mockupContainer}>
          {/* We will just put a styled div as a placeholder for the mockup image */}
          <div style={{ padding: '60px', width: '100%', height: '100%', display: 'flex', gap: '20px', background: '#ebe5d9' }}>
            <div style={{ flex: 1, background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '20px' }}>
              <div style={{ width: '60%', height: '24px', background: '#f4f0e9', borderRadius: '4px', marginBottom: '20px' }}></div>
              <div style={{ width: '100%', height: '12px', background: '#f4f0e9', borderRadius: '4px', marginBottom: '8px' }}></div>
              <div style={{ width: '80%', height: '12px', background: '#f4f0e9', borderRadius: '4px', marginBottom: '8px' }}></div>
              <div style={{ width: '90%', height: '12px', background: '#f4f0e9', borderRadius: '4px', marginBottom: '8px' }}></div>
            </div>
            <div style={{ width: '300px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '20px' }}>
              <div style={{ width: '100%', height: '40px', background: '#f4f0e9', borderRadius: '4px', marginBottom: '20px' }}></div>
              <div style={{ width: '100%', height: '40px', background: '#f4f0e9', borderRadius: '4px', marginBottom: '20px' }}></div>
              <div style={{ width: '100%', height: '40px', background: '#f4f0e9', borderRadius: '4px', marginBottom: '20px' }}></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
