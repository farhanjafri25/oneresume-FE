'use client';

import { motion } from 'motion/react';
import { fadeUp, staggerContainer } from '@/lib/motion';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Per-child delay in seconds. */
  stagger?: number;
  /** Delay before the first child animates. */
  delayChildren?: number;
}

/**
 * Animates its children in sequence on mount. Each direct child should be a
 * <StaggerItem> (or any motion element using the `fadeUp` variant).
 */
export function StaggerContainer({ children, className, stagger, delayChildren }: ContainerProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}
