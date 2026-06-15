'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Button from '@/components/Button/Button';
import { transitions } from '@/lib/motion';
import { RESUME, ROTATE_MS, STYLES, type ResumeSection, type StyleId } from './notFoundContent';
import styles from './NotFound404.module.css';

function ResumeBody() {
  return (
    <article className={styles.sheet}>
      <header className={styles.head}>
        <h1 className={styles.name}>{RESUME.name}</h1>
        <p className={styles.title}>{RESUME.title}</p>
        <p className={styles.contact}>
          {RESUME.contact.map((item, i) => (
            <span key={item}>
              {i > 0 && <span className={styles.dot} aria-hidden="true" />}
              {item}
            </span>
          ))}
        </p>
      </header>

      {RESUME.sections.map((section) => (
        <section key={section.heading} className={styles.section}>
          <h2 className={styles.sectionHeading}>{section.heading}</h2>
          <SectionContent section={section} />
        </section>
      ))}
    </article>
  );
}

function SectionContent({ section }: { section: ResumeSection }) {
  if (section.kind === 'summary') {
    return <p className={styles.summary}>{section.body}</p>;
  }

  if (section.kind === 'experience') {
    return (
      <ul className={styles.entries}>
        {section.entries.map((entry) => (
          <li key={entry.role} className={styles.entry}>
            <div className={styles.entryTop}>
              <span className={styles.role}>{entry.role}</span>
              <span className={styles.period}>{entry.period}</span>
            </div>
            <div className={styles.org}>{entry.org}</div>
            <p className={styles.detail}>{entry.detail}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={styles.skills}>
      {section.items.map((item) => (
        <li key={item} className={styles.skill}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function NotFound404() {
  const [active, setActive] = useState<StyleId>(STYLES[0].id);

  // Auto-cycle through the résumé styles, but leave visitors who prefer reduced
  // motion on a single static style.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const id = window.setInterval(() => {
      setActive((current) => {
        const next = (STYLES.findIndex((s) => s.id === current) + 1) % STYLES.length;
        return STYLES[next].id;
      });
    }, ROTATE_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.stage}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            className={`${styles.frame} ${styles[active] ?? ''}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={transitions.base}
          >
            <ResumeBody />
          </motion.div>
        </AnimatePresence>
      </div>

      <Button href="/" className={styles.cta}>
        Back home
      </Button>
    </main>
  );
}
