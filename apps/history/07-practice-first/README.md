# Guitar Academy — Current Application

This is iteration 07 (V7), the active product and the only application that
should receive new feature development. It evolved from iteration 06 without
discarding its tested music, guitar, learning, or playing foundations.

For the full journey, read [Project History](../../../docs/PROJECT_HISTORY.md).

## Product Focus

The app makes real guitar practice the primary activity while preserving a
shared tonal context across eleven workspaces:

| Workspace | Learner purpose |
| --- | --- |
| Dashboard | Orient and choose a useful next action |
| Learn | Build prerequisite-aware understanding |
| Explore | Relate one pitch to tonic, scale, chord, sound, and fretboard |
| Fretboard | Map movable intervals, octaves, inversions, and compact shapes |
| Harmony | Build chords and understand Roman numerals and function |
| Progressions | Follow functional movement through time |
| Ear | Hear relationships after establishing a tonic |
| Practice | Retrieve theory and complete instrument-led coach prompts |
| Play Lab | Discover chords, compare connections, record, and build progressions |
| Play Along | Apply exact displayed voicings in time |
| My Path | Set goals, genres, priorities, and practice time |

## What Iteration 07 Adds

- Continuous Mixed Coach, Note Hunt, Interval Moves, Chord-Tone Targets, and
  Triad Shapes sessions
- Foundation, Moving, and Challenge difficulty ranges
- Hint, reveal, self-assessment, accuracy, and useful streak feedback
- Next-chord suggestions grounded in diatonic, resolution, borrowed,
  modal/rock, and blues relationships
- Nearby compact voicings that can be heard, loaded, or added directly
- User-progression analysis with Roman numerals recalculated for a new tonal centre
- Explicit `Key`, `Scale degree`, `Chord tone`, and `Interval` labels
- Context resets that prevent stale progression, ear, voicing, and playback state

## Run

Requirements: Node.js 20 or newer and npm.

```bash
cd apps/current
npm install
npm run dev
```

The app runs at [http://localhost:4184](http://localhost:4184). On macOS,
`./start.command` launches it and installs missing dependencies.

## Verify

```bash
npm test
npm run build
npm run test:e2e:install
npm run test:e2e
```

## Architecture

```text
src/
  app/          Application shell and workspace composition
  application/  Versioned state, commands, persistence, and derived model
  audio/        Playback, microphone, rhythm, and recording support
  components/   Shared fretboard, context, chord, shape, lesson, and help UI
  content/      Validated lessons and progression content
  core/
    instrument/ Guitar geometry, voicings, proximity, and movement
    music/      Tonal theory, discovery, chord connections, and analysis
  features/     Eleven learning and playing workspaces
  learning/     Learner evidence, quizzes, and coach prompt generation
  styles/       Responsive visual system
tests/e2e/      Desktop and mobile browser workflows
```

See [Current Architecture](../../../docs/ARCHITECTURE.md) for ownership and data
flow, and [`docs/`](docs/) for feature-specific diagnostics.

## Honest Limits

- Microphone pitch feedback is monophonic.
- Rhythm assessment expects separated attacks.
- Chord discovery recognises common triads, suspended and power chords, and
  common sevenths rather than exhaustive extensions or rootless jazz voicings.
- Generated shapes favour compact consecutive-string voicings and do not yet
  model fingering difficulty, alternate tunings, or a complete chord dictionary.
- Suggested connections are theory-grounded options, not claims that one
  progression is uniquely correct.
- Reference tones and progression playback are synthesised; recorded guitar
  remains local to the browser and is not uploaded.
