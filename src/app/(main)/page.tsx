import React from 'react';
import styles from './page.module.css';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          The Last Resume Link You'll<br />Ever Need
        </h1>
        <p className={styles.subtitle}>
          For professionals who demand precision. Share one link, update everywhere, and<br />
          track every view with OneResume.
        </p>
        
        <Link href="/dashboard" className={`btn-primary ${styles.cta}`}>
          Elevate Your Career <ArrowRight size={18} />
        </Link>
      </section>
      
      <section className={styles.mockupSection}>
        <div className={styles.mockupContainer}>
          {/* We use a placeholder that resembles the tablet mockup from the design */}
          <div className={styles.tabletMockup}>
            <div className={styles.tabletScreen}>
              <div className={styles.resumeHeader}>
                <h2>RESUME</h2>
              </div>
              <div className={styles.resumeBody}>
                <div className={styles.line}></div>
                <div className={styles.line}></div>
                <div className={styles.line}></div>
              </div>
            </div>
          </div>
          <div className={styles.glow}></div>
        </div>
      </section>
    </div>
  );
}
