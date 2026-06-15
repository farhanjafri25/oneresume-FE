/**
 * Data for the resume-styled 404 page. Kept separate from the component so the
 * copy and the list of styles live in one place (no hardcoding scattered through
 * JSX) and the same content renders under every visual style.
 */

export type StyleId = 'minimal' | 'classic' | 'mono';

/** Drives both the style switcher tabs and the CSS class applied to the sheet. */
export const STYLES: { id: StyleId; label: string }[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'classic', label: 'Classic' },
  { id: 'mono', label: 'Mono' },
];

/** How long each style stays on screen before auto-rotating to the next. */
export const ROTATE_MS = 5000;

export type ResumeSection =
  | { heading: string; kind: 'summary'; body: string }
  | {
      heading: string;
      kind: 'experience';
      entries: { role: string; org: string; period: string; detail: string }[];
    }
  | { heading: string; kind: 'skills'; items: string[] };

/**
 * The 404 written as a résumé for the missing page. Tasteful and a little
 * playful — no all-caps, no emojis (per the product's UI conventions).
 */
export const RESUME: {
  name: string;
  title: string;
  contact: string[];
  sections: ResumeSection[];
} = {
  name: '404',
  title: 'Page Not Found',
  contact: ['oneresume', 'ref: 404', 'status: missing'],
  sections: [
    {
      heading: 'Summary',
      kind: 'summary',
      body:
        'A page that could not be located at this address. Last seen confidently ' +
        'linked from somewhere, now nowhere to be found. Open to relocation — ' +
        'ideally back to a URL that still exists.',
    },
    {
      heading: 'Experience',
      kind: 'experience',
      entries: [
        {
          role: 'Missing Page',
          org: 'This URL',
          period: 'Present',
          detail: 'Returns a 404 to every visitor with remarkable composure and consistency.',
        },
        {
          role: 'Broken Link',
          org: 'Somewhere upstream',
          period: 'Earlier',
          detail: 'Pointed here with great confidence and zero accuracy.',
        },
      ],
    },
    {
      heading: 'Skills',
      kind: 'skills',
      items: [
        'Disappearing without notice',
        'Redirecting blame',
        'Being found again (eager to learn)',
      ],
    },
  ],
};
