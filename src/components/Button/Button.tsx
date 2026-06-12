'use client';

import React, { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';
type Tone = 'default' | 'danger';

interface BaseProps {
  /** Visual style. `primary` matches the canonical Upload Resume pill. */
  variant?: Variant;
  size?: Size;
  /** `danger` recolours the button red for destructive actions. */
  tone?: Tone;
  fullWidth?: boolean;
  /** Shows an inline spinner and disables interaction. */
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ButtonAsAnchor = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

function classesFor(
  variant: Variant,
  size: Size,
  tone: Tone,
  fullWidth: boolean | undefined,
  className: string | undefined,
) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    tone === 'danger' && styles.danger,
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * The single button used across the product. Renders an `<a>` when `href` is
 * passed (download links), otherwise a `<button>` (defaults to type="button"
 * so it never submits a form unexpectedly).
 */
const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      tone = 'default',
      fullWidth,
      loading,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const classes = classesFor(variant, size, tone, fullWidth, className);
    const content = (
      <>
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {children}
      </>
    );

    if (props.href !== undefined) {
      const anchorProps = props as AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          aria-busy={loading || undefined}
          {...anchorProps}
        >
          {content}
        </a>
      );
    }

    const { type, disabled, ...buttonProps } =
      props as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type ?? 'button'}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...buttonProps}
      >
        {content}
      </button>
    );
  },
);

export default Button;
