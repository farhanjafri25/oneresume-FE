import React from 'react';
import styles from './page.module.css';
import { Download } from 'lucide-react';
import { notFound } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default async function PublicResumePage({ params }: { params: { username: string, variant: string } }) {
  // Fetch from the public backend endpoint
  const res = await fetch(`${API_URL}/${params.username}/${params.variant}`, {
    // Next.js config for revalidation or cache
    next: { revalidate: 60 }
  });

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();
  const fileUrl = data.fileUrl; // This is the UploadThing URL
  
  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.barContent}>
          <div className={styles.left}>
            <span className={styles.logo}>OneResume</span>
            <span className={styles.divider}></span>
            <span className={styles.name}>{params.username}</span>
            <span className={styles.variantBadge}>{params.variant} Variant</span>
          </div>
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={`btn-primary ${styles.downloadBtn}`}>
              <Download size={14} />
              Download PDF
            </a>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.resumePaper}>
          <header className={styles.resumeHeader}>
            <h1 className={styles.resumeName}>Alex Johnson</h1>
            <h2 className={styles.resumeRole}>Senior Software Engineer</h2>
            <div className={styles.contactInfo}>
              <span>📍 San Francisco, CA</span>
              <span>✉️ alex.j@example.com</span>
              <span>🔗 github.com/alexj</span>
            </div>
          </header>

          <div className={styles.resumeBody}>
            <div className={styles.mainColumn}>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>EXPERIENCE</h3>
                
                <div className={styles.experienceItem}>
                  <div className={styles.jobHeader}>
                    <div className={styles.jobTitleWrapper}>
                      <span className={styles.bullet}></span>
                      <h4 className={styles.jobTitle}>Lead Developer</h4>
                    </div>
                    <span className={styles.jobDate}>2021 - Present</span>
                  </div>
                  <h5 className={styles.companyName}>TechCorp Inc.</h5>
                  <ul className={styles.jobList}>
                    <li>Architected and deployed a microservices-based platform scaling to 2M+ active users.</li>
                    <li>Reduced API latency by 40% through aggressive caching and database optimization.</li>
                    <li>Mentored a team of 5 junior engineers, establishing rigorous code review practices.</li>
                  </ul>
                </div>

                <div className={styles.experienceItem}>
                  <div className={styles.jobHeader}>
                    <div className={styles.jobTitleWrapper}>
                      <h4 className={styles.jobTitle}>Full Stack Engineer</h4>
                    </div>
                    <span className={styles.jobDate}>2018 - 2021</span>
                  </div>
                  <h5 className={styles.companyName}>Innovate Solutions</h5>
                  <ul className={styles.jobList}>
                    <li>Spearheaded the migration of a legacy monolithic application to React and Node.js.</li>
                    <li>Implemented automated testing pipelines, increasing test coverage from 20% to 85%.</li>
                  </ul>
                </div>
              </section>
            </div>

            <div className={styles.sideColumn}>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>SKILLS</h3>
                <div className={styles.skillsGrid}>
                  <span className={styles.skillTag}>TypeScript</span>
                  <span className={styles.skillTag}>React</span>
                  <span className={styles.skillTag}>Node.js</span>
                  <span className={styles.skillTag}>Python</span>
                  <span className={styles.skillTag}>AWS</span>
                  <span className={styles.skillTag}>Docker</span>
                  <span className={styles.skillTag}>GraphQL</span>
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>EDUCATION</h3>
                <div className={styles.educationItem}>
                  <h4 className={styles.degree}>B.S. Computer Science</h4>
                  <p className={styles.university}>University of Technology</p>
                  <p className={styles.eduDate}>2014 - 2018</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
