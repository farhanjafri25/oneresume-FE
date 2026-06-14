import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service · OneCV',
};

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <Link href="/" className={styles.logo}>
        <Image src="/logo.svg" alt="OneCV" className={styles.logoImg} width={116} height={30} priority />
      </Link>

      <main className={styles.content}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: June 2026</p>

        <div className={styles.body}>
          <p>
            Welcome to OneCV. These Terms of Service govern your access to and use of the OneCV
            website and services. By creating an account or using OneCV, you agree to these terms.
          </p>
          <p>
            This is a placeholder document. The full Terms of Service will be published here before
            general availability. If you have questions in the meantime, please reach out to our team.
          </p>
          <p>
            You are responsible for the accuracy of the information you provide and for maintaining
            the confidentiality of your account credentials.
          </p>
        </div>

        <Link href="/login" className={styles.back}>← Back to sign in</Link>
      </main>
    </div>
  );
}
