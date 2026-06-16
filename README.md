# OneCV

> The last resume link you'll ever need.

OneCV is the web frontend for OneCV — share one personalised link, update your resume everywhere at once, and track every view. Built with [Next.js](https://nextjs.org) (App Router) and React 19.

## Features

- **Personalised share link** — a single public page at `/[username]/[filename]` that always serves your latest resume, with versioned URLs (`/[username]/[filename]/[version]`) when you need to point at a specific revision.
- **AI builder** — generate and refine resumes with AI.
- **AI review** — get a scored critique of a resume with actionable feedback.
- **Analytics** — track views per resume, visualised with [Recharts](https://recharts.org).
- **Variants & versions** — maintain multiple tailored versions of a resume and revert to any earlier one.
- **PDF upload & preview** — drop in a PDF (via [UploadThing](https://uploadthing.com)), rendered with `pdfjs-dist`.
- **Guided onboarding** and email + Google OAuth sign-in.

## Tech stack

| Concern   | Choice                                                  |
| --------- | ------------------------------------------------------- |
| Framework | Next.js 16 (App Router, Server Actions)                 |
| UI        | React 19, [Motion](https://motion.dev), Phosphor icons  |
| Charts    | Recharts                                                |
| PDF       | pdfjs-dist                                               |
| Uploads   | UploadThing                                             |
| Toasts    | Sonner                                                  |
| Testing   | Vitest                                                  |

The frontend talks to a separate backend API (see `src/lib/api.ts`) using Server Components and Server Actions, attaching the auth token from cookies.

## Getting started

### Prerequisites

- Node.js 20+
- The OneCV backend API running and reachable

### Setup

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```bash
# Base URL of the backend API
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Google OAuth client ID (for Google sign-in)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Optional: backend request timeout in ms (default 60000)
API_TIMEOUT_MS=60000
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                     |
| --------------- | ------------------------------- |
| `npm run dev`   | Start the development server    |
| `npm run build` | Production build                |
| `npm run start` | Serve the production build      |
| `npm run lint`  | Run ESLint                      |
| `npm run test`  | Run the test suite with Vitest  |

## Project structure

```
src/
  app/
    (auth)/        login & signup
    (legal)/       privacy & terms
    (main)/        dashboard & settings (resume, ai-builder, ai-review, analytics, variants)
    (onboarding)/  guided onboarding flow
    [username]/    public share pages
    actions/       server actions (auth, resume, ai, upload, onboarding, account, user)
  components/      shared UI (Button, Tabs, ResumeHtmlPreview, Stepper, etc.)
  lib/             API client, PDF helpers, utilities
  types/           shared TypeScript types
```

## Testing

```bash
npm run test
```

Tests live alongside the code they cover (e.g. `src/lib/pdf/pdfFirstPage.test.ts`) and run on [Vitest](https://vitest.dev).
