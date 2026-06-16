'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  XLogo,
  ThreadsLogo,
  LinkedinLogo,
  ShareNetwork,
  Link as LinkIcon,
  X as CloseIcon,
} from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { springs } from '@/lib/motion';
import {
  SHARE_CHANNELS,
  ONECV_SHARE_MESSAGE,
  getProductUrl,
  copyToClipboard,
  type ShareChannelId,
} from '@/lib/share';
import styles from './ShareWidget.module.css';

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

/** Channel id -> icon, kept here so `share.ts` stays framework-pure. */
const CHANNEL_ICONS: Record<ShareChannelId, IconComponent> = {
  x: XLogo,
  threads: ThreadsLogo,
  linkedin: LinkedinLogo,
};

// ease-out-cubic for micro-interactions (entering/exiting icon)
const ICON_EASE: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

/**
 * Floating "Share OneCV" referral widget — a bottom-right FAB that expands into a
 * menu for posting about the product on X / Threads / LinkedIn or copying the link.
 * Mirrors the app's dropdown convention (ResumeSwitcher): toggle state, click-outside
 * + Escape to close, and a spring entrance that respects reduced motion.
 */
export default function ShareWidget() {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const fabRef = useRef<HTMLButtonElement>(null);
  const productUrl = getProductUrl();

  // Close on outside-click or Escape. The FAB and card stop propagation so clicks
  // inside the widget don't bubble to this document-level listener.
  useEffect(() => {
    if (!open) return;
    const handleClick = () => setOpen(false);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(productUrl);
    if (ok) toast.success('Link copied');
    else toast.error("Couldn't copy the link. Please try again.");
    setOpen(false);
  };

  return (
    <div className={styles.root}>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.card}
            role="menu"
            aria-label="Share OneCV"
            onClick={(e) => e.stopPropagation()}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={springs.smooth}
            style={{ transformOrigin: 'bottom right' }}
          >
            <p className={styles.nudge}>Love OneCV? Pass it on.</p>

            <div className={styles.menuList}>
              {SHARE_CHANNELS.map((channel) => {
                const Icon = CHANNEL_ICONS[channel.id];
                return (
                  <a
                    key={channel.id}
                    className={styles.menuItem}
                    role="menuitem"
                    href={channel.buildUrl(productUrl, ONECV_SHARE_MESSAGE)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={18} className={styles.menuIcon} />
                    <span>{channel.label}</span>
                  </a>
                );
              })}

              <button type="button" className={styles.menuItem} role="menuitem" onClick={handleCopy}>
                <LinkIcon size={18} className={styles.menuIcon} />
                <span>Copy link</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        ref={fabRef}
        type="button"
        className={styles.fab}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? 'Close share menu' : 'Share OneCV'}
      >
        <span className={styles.fabIconWrap}>
          <AnimatePresence initial={false}>
            {open ? (
              <motion.span
                key="close"
                className={styles.fabIconSlot}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: 45 }}
                transition={{ duration: 0.15, ease: ICON_EASE }}
              >
                <CloseIcon size={22} weight="bold" />
              </motion.span>
            ) : (
              <motion.span
                key="share"
                className={styles.fabIconSlot}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: 45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -45 }}
                transition={{ duration: 0.15, ease: ICON_EASE }}
              >
                <ShareNetwork size={22} weight="bold" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </button>
    </div>
  );
}
