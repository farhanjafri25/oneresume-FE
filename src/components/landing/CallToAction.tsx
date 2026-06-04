import React from 'react';
import styles from './landing.module.css';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CallToAction() {
  return (
    <section style={{ 
      width: '100%', 
      padding: '100px 24px', 
      textAlign: 'center',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)'
    }}>
      <h2 style={{ fontSize: '48px', fontWeight: 600, marginBottom: '24px' }}>
        Ready to <span className={styles.titleAccent}>Upgrade</span> Your Career?
      </h2>
      <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
        Join thousands of professionals who have already elevated their job search with OneResume.
      </p>
      <Link href="/signup" className="btn-primary" style={{ padding: '16px 32px', fontSize: '18px' }}>
        Get Started for Free <ArrowRight size={20} />
      </Link>
    </section>
  );
}
