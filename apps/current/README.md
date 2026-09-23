# Guitar Academy V8 — Musical Freedom Learning System

V8 is the active application. It is a private, local-first guitar curriculum
designed to develop musical agency: hear an idea, understand its relationships,
find it on the instrument, vary it deliberately, and turn it into original music.

## Product shape

- **Learn** groups three related views: **Continue** presents the next balanced
  session fitted to the practice duration in Settings, **Course map** locates it within 48 units across eight
  stages, and **Strengthen** offers focused review from learning evidence.
  Continue names the current stage and unit; Course map uses status labels and
  keeps the activity detail for later units folded away until it is available.
  Strengthen stays empty until real attempts exist, then recommends only
  encountered skills and explains the evidence behind each suggestion.
- **Play** runs ability-matched, one-prompt-at-a-time groove, riff, degree and
  chord flows with no score or planning load.
- **Create** stores sketches, exact voicings, revisions and recorded takes locally.
- **Explore** connects tonal context, chromatic colour, harmony and fretboard position.

Every core unit includes listening, prediction, physical playing, rhythm,
relationship explanation, variation, creation, transfer and reflection. Assisted
attempts remain distinct from independent evidence; creative work is explained
and compared rather than graded.

## Pixel, offline use, and synchronisation

V8 is an installable PWA. With Firebase configured, Google Authentication and
Firestore synchronise progress, evidence, settings, and sketches across signed-in
devices. The app shell and a small structured-data cache remain available offline;
queued changes synchronise when connectivity returns. Complete manual backups can
still be exported and imported.

Recordings are different: a take remains temporary until explicitly retained and
stays on that device by default. From a finished project, a signed-in learner can
explicitly select one individual take to make available on their own devices;
unselected audio never uploads. Settings reports retained-audio usage and can
clear device copies without touching learning progress. Microphone feedback
remains limited to reliable monophonic pitch, separated rhythm attacks and
recorded self-comparison; V8 does not claim polyphonic performance recognition.
There are no analytics.

The private live deployment is available at
[learn-the-guitar.web.app](https://learn-the-guitar.web.app). Sign into that same
address with the same Google account on the laptop and Pixel to share progress.

Generated guitar layouts are called playable only after fingering feasibility
checks. Ambiguous harmony and pitches outside the active collection retain
multiple possible meanings rather than being labelled wrong.

## Run and verify

Use Node 22 (22.22.2 or newer in that release line) and Java 21 for the Firebase emulator checks. CI configures both explicitly.

```bash
npm ci
npm run dev
npm run lint
npm run format:check
npm test
npm run test:coverage
npm run test:rules
npm run build
npm run check:guest-bundle
npm run test:e2e:install
npm run test:e2e
```

Coverage reports are written to `coverage/` for the save, restore, sync and related interface code. The rendered tests use synthetic workspaces and mocked storage/SDK boundaries; the separate emulator and browser suites exercise the actual rules and browser persistence.

Lint checks the maintained application source and applies additional promise and unsafe-assignment rules to persistence and sync. Formatting checks newly added app code plus a small set of adopted critical files. Existing files outside that set keep their current layout until deliberately adopted; this prevents a repository-wide formatting change. Both checks run before the CI test suites and in the local publisher.

Both hosting workflows run the desktop and phone browser journeys before publication. The live workflow serialises publication without cancelling an active deployment and refuses a checkout that is no longer current `main`. These configured checks do not constitute evidence of a successful CI run.

The guest-bundle check follows the production manifest's static imports and fails if startup directly imports the account or Firebase chunk. An older installation with an account workspace or existing guest learning still checks for a retained login once; later signed-out visits skip that code. The service worker currently precaches all JavaScript, including account code; cache policy and transfer-size work remain in Phase 2B.

The app runs at [http://localhost:4184](http://localhost:4184).

See [`docs/curriculum-v8.md`](docs/curriculum-v8.md) for the curriculum contract.
See [`docs/pixel-sync-setup.md`](docs/pixel-sync-setup.md) for Firebase deployment,
moving existing laptop progress into sync, and installing on a Pixel.
