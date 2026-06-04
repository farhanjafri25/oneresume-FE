import React from 'react';
import styles from './landing.module.css';
import { Sparkles, Brain, UploadCloud, BarChart3 } from 'lucide-react';

const featuresList = [
  {
    title: 'AI Resume Builder',
    description: 'Smart suggestions, auto-formatting, and keyword optimization to create a tailored resume effortlessly.',
    icon: <Sparkles size={24} />
  },
  {
    title: 'AI Resume Review',
    description: 'Instant feedback on content strength, readability, and alignment with industry standards using advanced AI analysis.',
    icon: <Brain size={24} />
  },
  {
    title: 'PDF Upload & One-Link Sharing',
    description: 'Upload existing resumes, instantly convert to editable formats, and share your profile via a professional, custom link.',
    icon: <UploadCloud size={24} />
  },
  {
    title: 'Version Control & Analytics',
    description: 'Manage multiple resume versions, track application status, and view analytics on resume views and downloads.',
    icon: <BarChart3 size={24} />
  }
];

export default function Features() {
  return (
    <section id="features" className={styles.featuresSection}>
      <h2 className={styles.featuresTitle}>
        Everything You Need to <span className={styles.titleAccent}>Stand Out</span>
      </h2>
      
      <div className={styles.grid}>
        {featuresList.map((feature, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.iconWrapper}>
              {feature.icon}
            </div>
            <h3 className={styles.cardTitle}>
              {/* Highlight part of the title if it has two words */}
              {feature.title.split(' ').map((word, i, arr) => (
                i === arr.length - 1 ? <span key={i} className={styles.titleAccent}>{word}</span> : <span key={i}>{word} </span>
              ))}
            </h3>
            <p className={styles.cardDesc}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
