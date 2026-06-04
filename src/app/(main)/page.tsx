import React from 'react';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import CallToAction from '@/components/landing/CallToAction';
import styles from '@/components/landing/landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <Hero />
      <Features />
      <CallToAction />
    </div>
  );
}
