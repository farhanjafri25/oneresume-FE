'use client';

import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { springs } from '@/lib/motion';
import { useHoverable } from '@/lib/useHoverable';
import styles from './Tooltip.module.css';

interface TooltipProps {
  /** Text shown in the tooltip. Also becomes the trigger's accessible name. */
  label: string;
  children: React.ReactNode;
  /** When true, the tooltip never shows (e.g. a disabled action). */
  disabled?: boolean;
}

interface Coords {
  left: number;
  top: number;
}

/** Gap between the trigger and the tooltip, in px. */
const GAP = 8;
/** Minimum distance the tooltip keeps from the viewport edges, in px. */
const EDGE_MARGIN = 8;

/**
 * Lightweight tooltip that renders into a portal so it's never clipped by an
 * ancestor's `overflow: hidden`. Shows on hover (hover-capable pointers only)
 * and on keyboard focus. The label doubles as the trigger's accessible name via
 * `aria-describedby`, so icon-only buttons stay screen-reader friendly.
 */
export default function Tooltip({ label, children, disabled = false }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const hoverable = useHoverable();
  const tooltipId = useId();

  const show = () => {
    const el = triggerRef.current;
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, EDGE_MARGIN),
      window.innerWidth - EDGE_MARGIN,
    );
    setCoords({ left, top: rect.top - GAP });
  };

  const hide = () => setCoords(null);

  const visible = coords !== null && !disabled;

  return (
    <span
      ref={triggerRef}
      className={styles.trigger}
      onMouseEnter={hoverable ? show : undefined}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {visible && (
              <motion.span
                id={tooltipId}
                role="tooltip"
                className={styles.tooltip}
                style={{ left: coords.left, top: coords.top }}
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: springs.micro }}
                exit={{ opacity: 0, y: 4, scale: 0.96, transition: springs.micro }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </span>
  );
}
