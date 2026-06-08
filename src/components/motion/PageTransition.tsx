'use client';

import { motion } from 'motion/react';
import { fadeUp } from '@/lib/motion';

/**
 * Fade-up page container. Drop-in replacement for the `.container { animation:
 * fadeIn }` blocks on page-level layouts. Safe to import into a server component
 * page — only this wrapper is client.
 */
export default function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeUp} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}
