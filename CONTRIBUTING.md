# Contributing

## Choose the Right Target

Active product work belongs in `apps/current`. The folders under
`apps/history` are preserved milestones and should change only when repairing
their documentation, launchability, or an important factual error.

Before a substantial change, read:

- `docs/LEARNING_MODEL.md` for the teaching contract
- `docs/ARCHITECTURE.md` for code ownership and data flow
- `docs/LESSONS_LEARNED.md` for mistakes the project should not repeat
- `docs/ROADMAP.md` for current priorities and known boundaries

## Development Workflow

Use the [project workflow](docs/PROJECT_WORKFLOW.md) to distinguish local
commits, GitHub `main`, and the live Firebase deployment when changing tools or
machines. The root Finder commands open the local and live versions separately.

1. Install dependencies in the app you are changing with `npm install`.
2. Keep music and instrument rules in the domain layers, not in components.
3. Add or update a focused test when theory, fretboard, learning, or state logic changes.
4. Run `npm test` and `npm run build` in `apps/current`.
5. Run browser tests when navigation, responsive layout, microphone handling,
   recording, or multi-step user flows change.
6. Update the relevant Markdown guide when behaviour, architecture, limitations,
   or future expectations change.

To verify every historical snapshot as well as the current app, run:

```bash
./scripts/verify-all.sh
```

## Product Quality Bar

- Teach a relationship before adding another control.
- Connect visual, aural, theoretical, and physical representations.
- Require a learner action before reveal when the activity is meant to assess.
- Keep scale degree, chord tone, interval, note name, and Roman numeral labels distinct.
- Prefer a small playable region and a clear next action over full-neck density.
- State limitations rather than implying recognition or assessment the app cannot perform.

## Engineering Quality Bar

- Keep pure theory and guitar geometry independent of React and browser APIs.
- Derive UI labels from shared domain models; do not create competing theory constants.
- Preserve versioned local state and reset page state when musical context changes.
- Keep microphone and recording features opt-in and browser-local.
- Avoid coupling new content directly to page components.

## Commit Scope

Keep commits focused and describe the learner or maintainer outcome. Do not
commit `node_modules`, `dist`, Playwright browser downloads, test output, or
personal machine configuration.
