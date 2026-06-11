import React from 'react';
import styles from './landing.module.css';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CallToAction() {
  return (
    <section className={styles.ctaSection}>
      <h2 className={styles.ctaTitle}>
        Ready to <span className={styles.titleAccent}>Upgrade</span> Your Career?
      </h2>
      <p className={styles.ctaSubtitle}>
        Join thousands of professionals who have already elevated their job search with OneCV.
      </p>
      <Link href="/signup" className={`btn-primary ${styles.ctaBtn}`}>
        Get Started for Free <ArrowRight size={20} />
      </Link>
    </section>
  );
}
