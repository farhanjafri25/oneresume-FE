import type { Transition, Variants } from 'motion/react';

/**
 * Shared motion design tokens.
 *
 * The app's signature easing is cubic-bezier(0.16, 1, 0.3, 1) — an ease-out-expo
 * curve already used across CSS modals, toasts, and the nav pill. Keeping every
 * motion entrance on the same curve makes the JS animations feel native to the
 * existing CSS ones. Pure values only, so this file is safe to import from both
 * server and client modules.
 */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const transitions = {
  fast: { duration: 0.2, ease: EASE_OUT_EXPO } as Transition,
  base: { duration: 0.3, ease: EASE_OUT_EXPO } as Transition,
  slow: { duration: 0.4, ease: EASE_OUT_EXPO } as Transition,
};

/**
 * Apple-style springs (visualDuration + bounce) for INTERRUPTIBLE interactions —
 * modal open/close, hover/tap, toasts. Springs keep their velocity when
 * interrupted (a CSS/duration animation restarts from zero), so a modal the user
 * opens and closes rapidly stays smooth. bounce: 0 means no overshoot — natural
 * but still subtle and professional, matching the app's restrained aesthetic.
 */
export const springs = {
  micro: { type: 'spring', visualDuration: 0.18, bounce: 0 } as Transition, // hover/tap
  smooth: { type: 'spring', visualDuration: 0.32, bounce: 0 } as Transition, // modals/toasts
};

/** Fade + small upward translate — the app's default entrance. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
  exit: { opacity: 0, y: 12, transition: transitions.fast },
};

/**
 * Scale entrance for modal content (mirrors the scaleUp keyframe: 0.95 -> 1).
 * Paired with `overlayFade` — both share `springs.smooth` so the panel and its
 * backdrop move as one unit (emil's paired-elements rule).
 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: springs.smooth },
  exit: { opacity: 0, scale: 0.96, transition: springs.smooth },
};

/** Opacity fade for overlays/backdrops. Paired with `scaleIn`. */
export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: springs.smooth },
  exit: { opacity: 0, transition: springs.smooth },
};

/** Slide-up + fade for toasts (mirrors the slideIn keyframe). */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: springs.smooth },
  exit: { opacity: 0, y: 16, transition: springs.smooth },
};

/**
 * Stagger container. Children should use the `fadeUp` variant (or StaggerItem).
 * Keep the per-child delay small so a full grid settles quickly and never feels
 * sluggish.
 */
export const staggerContainer = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});
