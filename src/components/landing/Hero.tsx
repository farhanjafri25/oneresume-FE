'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import styles from './landing.module.css';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { EASE_OUT_EXPO } from '@/lib/motion';

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — Landing hero
 *
 * Read top-to-bottom. Each value is ms after the section mounts.
 *
 *    0ms   waiting for mount / scroll into view
 *   80ms   headline fades up      (y 14 → 0)
 *  200ms   subtitle fades up      (y 14 → 0)
 *  320ms   CTA row fades up       (y 14 → 0)
 *  440ms   product mockup rises   (y 18 → 0, slower settle)
 *
 * One-shot branded entrance → signature ease-out-expo, not a spring.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  headline: 80,    // headline fades up
  subtitle: 200,   // subtitle fades up
  cta:      320,   // CTA row fades up
  mockup:   440,   // product mockup rises
};

/* Text + CTA — small rise, quick settle */
const COPY = {
  offsetY:  14,            // px each element rises from
  duration: 0.5,           // seconds
  ease:     EASE_OUT_EXPO, // brand signature ease-out-expo
};

/* Product mockup — larger element, slower settle */
const MOCKUP = {
  offsetY:  18,
  duration: 0.6,
  ease:     EASE_OUT_EXPO,
};

export default function Hero({ replayTrigger = 0 }: { replayTrigger?: number }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    setStage(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage(1), TIMING.headline));
    timers.push(setTimeout(() => setStage(2), TIMING.subtitle));
    timers.push(setTimeout(() => setStage(3), TIMING.cta));
    timers.push(setTimeout(() => setStage(4), TIMING.mockup));
    return () => timers.forEach(clearTimeout);
  }, [isInView, replayTrigger]);

  /* Fade-up motion props for an element that becomes visible at `visibleAt`. */
  const rise = (visibleAt: number, cfg = COPY) => ({
    initial: { opacity: 0, y: cfg.offsetY },
    animate: {
      opacity: stage >= visibleAt ? 1 : 0,
      y: stage >= visibleAt ? 0 : cfg.offsetY,
    },
    transition: { duration: cfg.duration, ease: cfg.ease },
  });

  return (
    <>
      <section ref={ref} className={styles.hero}>
        <motion.h1 className={styles.title} {...rise(1)}>
          Crafting Your Next <span className={styles.titleAccent}>Chapter.</span>
        </motion.h1>
        <motion.p className={styles.subtitle} {...rise(2)}>
          Say goodbye to "Can I get your updated Resume link?" <br></br>
          {/* A premium platform designed to elevate your professional journey. <br></br> */}
          Upload your resume, get a custom lifetime link, and track in real-time.
        </motion.p>

        <motion.div className={styles.ctaContainer} {...rise(3)}>
          <Link href="/dashboard" className="btn-primary">
            Build Your Resume <ArrowRight size={18} />
          </Link>
          <Link href="#features" className={styles.btnSecondary}>
            How it Works
          </Link>
        </motion.div>
      </section>

      <motion.section className={styles.mockupSection} {...rise(4, MOCKUP)}>
        <div className={styles.mockupContainer}>
          {/* We will just put a styled div as a placeholder for the mockup image */}
          <div style={{ padding: '60px', width: '100%', height: '100%', display: 'flex', gap: '20px', background: 'var(--background)' }}>
            <div style={{ flex: 1, background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '20px' }}>
              <div style={{ width: '60%', height: '24px', background: 'var(--surface)', borderRadius: '4px', marginBottom: '20px' }}></div>
              <div style={{ width: '100%', height: '12px', background: 'var(--surface)', borderRadius: '4px', marginBottom: '8px' }}></div>
              <div style={{ width: '80%', height: '12px', background: 'var(--surface)', borderRadius: '4px', marginBottom: '8px' }}></div>
              <div style={{ width: '90%', height: '12px', background: 'var(--surface)', borderRadius: '4px', marginBottom: '8px' }}></div>
            </div>
            <div style={{ width: '300px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '20px' }}>
              <div style={{ width: '100%', height: '40px', background: 'var(--surface)', borderRadius: '4px', marginBottom: '20px' }}></div>
              <div style={{ width: '100%', height: '40px', background: 'var(--surface)', borderRadius: '4px', marginBottom: '20px' }}></div>
              <div style={{ width: '100%', height: '40px', background: 'var(--surface)', borderRadius: '4px', marginBottom: '20px' }}></div>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
