# Development Guide

## Requirements

- Node.js 22.22.2 or newer in the Node 22 release line
- npm
- Java 21 for the Firebase rules emulator
- Python 3 only for the original prototype validator
- A Chromium-compatible browser for end-to-end tests

## Current App Setup

```bash
cd apps/current
npm ci
npm run dev
```

The development server uses `http://localhost:4184`.

## Current App Checks

```bash
cd apps/current
npm test
npm run build
npm run test:e2e:install
npm run test:e2e
```

The browser-install step downloads a local Chromium build under an ignored
folder. Microphone-denial handling is included in the browser workflow; tests do
not upload audio.

## Verify the Entire Repository

```bash
./scripts/verify-all.sh
```

The script validates the dependency-free prototype and runs unit tests and
production builds for every React iteration. On a fresh clone it installs each
locked dependency set first, using an ignored repository-local npm cache.

## Working with Historical Apps

Historical snapshots are independently runnable and have their own README,
package manifest, port, and tests. They intentionally do not import the current
app or one another. Use them for comparison, product archaeology, or regression
reference; put new product work in `apps/current`.

## Dependency Policy

Each React app owns its manifest. Iterations with a lockfile should use
`npm install` or `npm ci`; generated `node_modules` directories are never
committed. Production output, Playwright browsers/reports, test results, and
TypeScript build metadata are also ignored.

## Documentation Policy

- Update `PROJECT_HISTORY.md` when a new major iteration is preserved.
- Update `ARCHITECTURE.md` when source ownership or data flow changes.
- Update `LEARNING_MODEL.md` only when the teaching contract genuinely changes.
- Update `LESSONS_LEARNED.md` when evidence overturns or adds a durable conclusion.
- Update `ROADMAP.md` when priorities or honest limitations change.
- Keep low-level feature notes beside the app they describe.

## Release Readiness

Before treating the current app as shareable:

1. Unit tests pass.
2. Production build succeeds.
3. Relevant browser flows pass at desktop and mobile widths.
4. Theory changes have explicit expected mappings in tests.
5. New controls have a real supported behaviour and a learner purpose.
6. Microphone/audio limitations and privacy behaviour remain accurate.
7. Documentation matches the shipped product.
