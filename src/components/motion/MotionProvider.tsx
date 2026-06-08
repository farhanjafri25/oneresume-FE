'use client';

import { MotionConfig } from 'motion/react';

/**
 * Mounts MotionConfig with reducedMotion="user" so every motion animation in the
 * app automatically respects the OS prefers-reduced-motion setting (transforms
 * are dropped, transitions become instant). Mounted high in the tree from the
 * root layout; because it is a client component imported into a server component,
 * it does not turn the layout itself into a client component.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
