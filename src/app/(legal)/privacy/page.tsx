import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy · OneCV',
};

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <Link href="/" className={styles.logo}>
        <Image src="/logo.svg" alt="OneCV" className={styles.logoImg} width={116} height={30} priority />
      </Link>

      <main className={styles.content}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: June 2026</p>

        <div className={styles.body}>
          <p>
            Your privacy matters to us. This Privacy Policy explains what information OneCV collects,
            how we use it, and the choices you have. By using OneCV, you consent to the practices
            described here.
          </p>
          <p>
            This is a placeholder document. The full Privacy Policy will be published here before
            general availability. If you have questions in the meantime, please reach out to our team.
          </p>
          <p>
            We collect the information you provide when you create an account and the resume content
            you upload, and we use it solely to deliver the OneCV service to you.
          </p>
        </div>

        <Link href="/login" className={styles.back}>← Back to sign in</Link>
      </main>
    </div>
  );
}
