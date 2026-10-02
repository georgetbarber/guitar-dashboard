# Guitar Academy

Guitar Academy is a relationship-first guitar-learning project. It teaches how
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

## Open the App from Finder

At the top of this folder, double-click:

| Command | What you see |
| --- | --- |
| `OPEN_LIVE.command` | The actual published website, plus this folder's Git branch and the latest GitHub deployment result. |
| `PREVIEW_LOCAL.command` | A local preview of the files in this Finder folder, including edits that have not been committed or published. |
| `SAVE_WORK.command` | Review all changed files and save them as a local Git commit with your own message. This does not publish. |
| `PUBLISH_LIVE.command` | A reviewed release to GitHub `main`, followed by GitHub checks and Firebase deployment. See the branch rules below. |

`start.command` remains an alias for the local preview. The live site and the
local preview keep separate browser data, including learning progress. Publishing
code does not copy browser data between them.

The local preview needs Node.js 22.22.2 or newer in the Node 22 release line
and npm. It installs the current app's dependencies on first use. From Terminal:

```bash
cd apps/current
npm ci
npm run dev
```

Open [http://localhost:4184](http://localhost:4184).

## Publish GitHub, Web, and Mobile

Read the [project workflow](docs/PROJECT_WORKFLOW.md) before the first release.
`PUBLISH_LIVE.command` checks for newer GitHub work, shows exactly what it will
include, and requires `PUBLISH` before pushing. GitHub then runs the release
checks and deploys to Firebase. The installed app offers the update when it
arrives. See the [publishing guide](docs/PUBLISHING.md) for setup and recovery.

## Repository Map

```text
.
├── README.md                 First-stop project orientation
├── CONTRIBUTING.md           Safe contribution workflow
├── AGENTS.md                 Project rules for coding agents
├── start.command             macOS launcher for the current app
├── OPEN_LIVE.command         Open the published website and show release status
├── PREVIEW_LOCAL.command     Open this folder's working version
├── SAVE_WORK.command         Review and commit changes locally
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
