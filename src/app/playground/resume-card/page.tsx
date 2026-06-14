import type { Metadata } from 'next';
import PlaygroundClient from './PlaygroundClient';

export const metadata: Metadata = {
  title: 'Resume card playground',
  robots: { index: false, follow: false },
};

export default function ResumeCardPlaygroundPage() {
  return <PlaygroundClient />;
}
