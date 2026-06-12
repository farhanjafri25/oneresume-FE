'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Tabs.module.css';

export type TabItem = {
  /** Stable identifier used to match the active tab and as the React key. */
  id: string;
  label: React.ReactNode;
  /** When present the tab renders as a navigation <Link>; otherwise a <button>. */
  href?: string;
};

export interface TabsProps {
  items: TabItem[];
  /** Controlled active tab id. `undefined` hides the highlight pill entirely. */
  activeId?: string;
  /** Fired on tab activation (selection for buttons, side-effect for links). */
  onTabClick?: (id: string) => void;
  /** Equal-width tabs: always, only under 768px, or never (hug content). */
  fill?: 'always' | 'mobile' | 'never';
  /** Track chrome: recessed inset well, or frosted header pill. */
  variant?: 'inset' | 'frosted';
  /** Escape hatch merged onto the track root for layout/positioning. */
  className?: string;
  /** Accessible name for the tab group. */
  ariaLabel?: string;
}

/**
 * The app's default tab control: a sliding clip-path "pill" that animates over
 * the active tab. Fully controlled — the parent owns which tab is active, so the
 * same component serves both pathname-driven navigation (links) and state-driven
 * toggles (buttons).
 */
export default function Tabs({
  items,
  activeId,
  onTabClick,
  fill = 'always',
  variant = 'inset',
  className,
  ariaLabel,
}: TabsProps) {
  const clipRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLElement | null>(null);

  // Slide the highlight pill over the active tab via clip-path. Recomputes on
  // active change and whenever the track resizes (font load, layout, viewport)
  // so the pill never drifts out of alignment.
  useEffect(() => {
    const container = clipRef.current;
    if (!container) return;

    const updateClip = () => {
      const active = activeRef.current;
      if (!active) {
        container.style.clipPath = 'inset(0 100% 0 0 round 9999px)';
        return;
      }
      const { offsetLeft, offsetWidth } = active;
      const left = (offsetLeft / container.offsetWidth) * 100;
      const right = 100 - ((offsetLeft + offsetWidth) / container.offsetWidth) * 100;
      container.style.clipPath = `inset(0 ${right.toFixed(2)}% 0 ${left.toFixed(2)}% round 9999px)`;
    };

    updateClip();

    const observer = new ResizeObserver(updateClip);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeId, items]);

  const setActiveRef = (node: HTMLAnchorElement | HTMLButtonElement | null) => {
    activeRef.current = node;
  };

  const renderTab = (item: TabItem, isOverlay: boolean) => {
    const isActive = item.id === activeId;
    const ref = !isOverlay && isActive ? setActiveRef : undefined;
    const handleClick = isOverlay ? undefined : () => onTabClick?.(item.id);

    return (
      <li key={item.id}>
        {item.href ? (
          <Link
            href={item.href}
            ref={ref}
            className={styles.tab}
            onClick={handleClick}
            tabIndex={isOverlay ? -1 : undefined}
            aria-hidden={isOverlay ? true : undefined}
            aria-current={!isOverlay && isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ) : (
          <button
            type="button"
            ref={ref}
            className={styles.tab}
            onClick={handleClick}
            tabIndex={isOverlay ? -1 : undefined}
            aria-hidden={isOverlay ? true : undefined}
            aria-pressed={isOverlay ? undefined : isActive}
          >
            {item.label}
          </button>
        )}
      </li>
    );
  };

  return (
    <div
      className={className ? `${styles.tabs} ${className}` : styles.tabs}
      data-variant={variant}
      data-fill={fill}
    >
      <ul className={styles.list} aria-label={ariaLabel}>
        {items.map((item) => renderTab(item, false))}
      </ul>

      {/* Highlight pill: a duplicate, white-text list revealed over the active
          tab via clip-path. aria-hidden + inert to keyboard/AT. */}
      <div aria-hidden className={styles.clip} ref={clipRef}>
        <ul className={`${styles.list} ${styles.overlay}`}>
          {items.map((item) => renderTab(item, true))}
        </ul>
      </div>
    </div>
  );
}
