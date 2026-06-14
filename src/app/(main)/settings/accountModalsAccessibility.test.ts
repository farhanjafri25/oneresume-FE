import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const settingsDir = join(__dirname);

function readSettingsFile(file: string) {
  return readFileSync(join(settingsDir, file), 'utf8');
}

describe('account settings modals accessibility regressions', () => {
  test('uses mobile-safe input text sizing', () => {
    const css = readSettingsFile('accountModals.module.css');
    const inputRule = css.match(/\.input\s*\{([^}]+)\}/)?.[1] ?? '';

    expect(inputRule).toContain('font-size: 16px');
  });

  test('moves focus into each account modal when it opens', () => {
    const modals = [
      'EditProfileModal.tsx',
      'ChangePasswordModal.tsx',
      'DeleteAccountModal.tsx',
    ];

    for (const modal of modals) {
      const source = readSettingsFile(modal);

      expect(source).toContain("import { useFocusOnMount } from './useFocusOnMount';");
      expect(source).toMatch(/const \w+Ref = useFocusOnMount<HTMLInputElement>\(\);/);
      expect(source).toMatch(/<input\s+ref=\{\w+Ref\}/);
    }
  });
});
