'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { overlayFade, scaleIn } from '@/lib/motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Module class for the full-screen backdrop. */
  overlayClassName?: string;
  /** Module class for the centered content panel. */
  contentClassName?: string;
  /** id of the element labelling the dialog (for aria-labelledby). */
  labelledBy?: string;
}

/**
 * Reusable modal that owns the enter AND exit animation. Always render this
 * component with the `isOpen` prop — never do `{open && <Modal/>}`, since that
 * unmounts the AnimatePresence and kills the exit animation. The overlay fades
 * and the content scales, both on the app's signature easing.
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  overlayClassName,
  contentClassName,
  labelledBy,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={overlayClassName}
          variants={overlayFade}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          <motion.div
            className={contentClassName}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
