'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { CheckCircle, WarningCircle, Info } from '@phosphor-icons/react/dist/ssr';

/**
 * App-wide toast surface. Mounted once in the root layout; components fire toasts
 * via `import { toast } from 'sonner'`. Styled to the brand (cream surface, muted
 * border) rather than Sonner's defaults, with Phosphor icons matching the app —
 * green check for success, red warning for errors.
 */
export default function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={10}
      toastOptions={{
        style: {
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          // Match the app's typeface rather than Sonner's default stack.
          fontFamily: 'inherit',
          fontSize: '14px',
          fontWeight: 500,
        },
      }}
      icons={{
        success: <CheckCircle size={18} weight="fill" color="#10b981" />,
        error: <WarningCircle size={18} weight="fill" color="#ef4444" />,
        info: <Info size={18} weight="fill" color="var(--primary)" />,
      }}
    />
  );
}
