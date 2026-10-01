# Interval

Interval is a relationship-first guitar-learning project. It teaches how
sound, intervals, scale degrees, chord tones, harmonic function, and fretboard
shapes connect, rather than presenting theory as facts to memorise.

The repository contains one current application and seven preserved development
milestones. Start with the current app; use the history when you want to
understand why the product and architecture changed.

## Start Here

1. Read the [project history](docs/PROJECT_HISTORY.md) for the complete journey.
2. Read the [learning model](docs/LEARNING_MODEL.md) for the teaching philosophy.
3. Open the [current application guide](apps/current/README.md) to run the app.
4. Use the [architecture](docs/ARCHITECTURE.md) and
   [development guide](docs/DEVELOPMENT.md) before changing code.
5. Review [lessons learned](docs/LESSONS_LEARNED.md) and the
   [roadmap](docs/ROADMAP.md) before proposing a large new feature.
6. Check [future features](docs/FUTURE_FEATURES.md) for the planned additions
   and deferred work backlog.
7. See [additional note takeaways](docs/additional-notes/README.md) for useful
   personal project thoughts that were checked against the current product.

## Run the Current App

Requirements: Node.js 20 or newer and npm.

```bash
cd apps/current
npm install
npm run dev
```

Open [http://localhost:4184](http://localhost:4184), or double-click
`start.command` at the repository root on macOS after installing dependencies.

## Publish GitHub, Web, and Mobile

Double-click `PUBLISH_LIVE.command` at the repository root. It shows the complete
change list, verifies the current app, keeps Firebase sync configured, pushes
`main` to GitHub, and waits for the live deployment to finish. The web and
installed mobile versions then update automatically. See the
[publishing guide](docs/PUBLISHING.md) for first-run authentication and recovery.

## Repository Map

```text
.
├── README.md                 First-stop project orientation
├── CONTRIBUTING.md           Safe contribution workflow
├── AGENTS.md                 Project rules for coding agents
├── start.command             macOS launcher for the current app
├── PUBLISH_LIVE.command      Verified GitHub and Firebase publisher
├── apps/
│   ├── README.md             Application directory guide
│   ├── current/              Current product (iteration 08 / V8)
│   └── history/              Seven runnable historical milestones
├── docs/
│   ├── README.md             Documentation index
│   ├── PROJECT_HISTORY.md     Origin, iteration timeline, and current state
│   ├── LEARNING_MODEL.md      Pedagogy and music-theory principles
│   ├── ARCHITECTURE.md        Current application structure and data flow
│   ├── LESSONS_LEARNED.md     Product and engineering conclusions
│   ├── DEVELOPMENT.md         Setup, testing, and working conventions
│   ├── ROADMAP.md             Evidence-based future directions
│   ├── additional-notes/      Relevant takeaways from informal project notes
│   └── reviews/               Detailed product-review source material
└── scripts/
    └── verify-all.sh          Validate every preserved iteration
```

## Current State

`apps/current` is iteration 08, the recommended and only active development
target. It is a curriculum-led system with 48 competency-paced units, one clear
daily session, production-based evidence, targeted practice, a guided Free Play
flow, relationship tools, and a durable local-first Sketchbook for composing,
recording, revising, and finishing original music.

The historical apps remain intentionally isolated. They are evidence of the
decisions made along the way, not packages that the current app imports.

## What Is Deliberately Not in Git

Installed dependencies, production builds, browser binaries, test reports,
TypeScript build caches, and operating-system metadata are generated locally
and ignored. Source, tests, documentation, dependency manifests, and lockfiles
are the portable project record.
