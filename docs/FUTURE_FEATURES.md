# Future Features

This is the working backlog for additions that are intentionally not part of
the current Guitar Academy release. A feature belongs here before it becomes a
build task. The current app should remain relationship-first, playable, and
honest about what it can hear, display, and assess.

## Carried forward from the theory remediation plan

These were explicitly deferred from the completed review and are planned
future additions rather than missing fixes:

- [ ] Add triplet notation and explain how it relates to the pulse.
- [ ] Add optional swing audio, with a clear long-short eighth-note model.
- [ ] Add harmonic-minor and melodic-minor modes only when their teaching
      sequence and chord labelling are clear. The current raised-leading-tone
      V/V7 treatment in minor remains the deliberately smaller step.
- [ ] Extend the current narrow starting samples into a fuller diagnostic
      placement system that recommends units from observed playing evidence,
      without treating guitar-free answers or self-reports as physical mastery.
- [ ] Author and review specific musical episodes for all 48 units. Unit 1 has
      the live structured pilot; two contrasting Phase 6 drafts remain unshipped.
      The other units still rely on outline-level activities.

## Learning and musical depth

- [ ] Add optional staff-pitch literacy without making notation a gate for the
      relationship-first path.
- [ ] Replace placeholder browser-synth examples with reviewed original
      performances where phrasing, tone, or articulation matters.
- [ ] Add more activity-specific assessment only where the result can be
      musically honest and reliable.
- [ ] Extend fingering-aware voicing search and transition ranking using
      observed hand-position data.
- [ ] Support alternate tunings through tuning-aware interval geometry.
- [ ] Add richer unit variations after the curriculum data model has been used
      and observed in practice.

## Play and open practice

- [x] Prompted free-play zone. A low-pressure space, separate from the
      structured path, where the app shows one instruction at a time and the
      learner just follows it — no deciding what to work on. Prompts rotate
      through short, playable actions: "play this chord", "copy this one-bar
      riff", "find this scale degree anywhere", "hold this groove". The appeal
      is exactly the removal of planning load: follow the screen and play.
      - Learner relationship: enjoyment and flow without choosing a topic; a
        fun, unstructured-but-guided space to just play.
      - Ability-synced: prompts are drawn only from competencies the learner has
        already met (with the occasional item one step ahead), using existing
        mastery evidence, so it never demands something unlearned.
      - Observable musical action: play the prompted chord / riff / degree /
        groove. A response is not required to keep the flow moving; any
        self-report or later mic check is optional.
      - Evidence: optional and clearly secondary. This space is for play, so
        anything recorded is marked low-stakes and never gates the path.
      - Modes worth prototyping: "chord roulette" (random diatonic chords in the
        current key), "riff echo" (short call-and-copy phrases), "degree hunt"
        (locate a scale degree on the neck), "groove keeper" (sustain a pulse or
        rhythm). Difficulty, key and prompt pool derive automatically from level.
      - Delivered as a dedicated Play tab, following explicit product direction
        that this should be a substantial recurring destination. It also remains
        linked from Today, starts in one tap, and keeps configuration hidden.

## Product and platform additions

- [x] Improve cross-device conflict resolution with per-field sketch timestamps,
      deletion protection, reconnect retries, and 1,500-record merge coverage.
- [x] Improve export/import for substantial Sketchbook histories with a validated
      binary archive that stores raw audio without base64 expansion.
- [x] Add encrypted transport and storage for explicitly selected
      finished-project takes. Audio stays device-only by default; only a take the
      learner chooses is uploaded to their authenticated Firebase Storage path.
- [x] Improve offline-first behaviour with complete shell precaching, visible
      connection state, reconnect sync, IndexedDB-first saves, and optional
      persistent browser storage.

## Guardrails

These are not planned additions unless a later review finds a reliable,
relationship-first way to implement them:

- Unreliable polyphonic chord recognition.
- Numerical creativity scores or progress based on clicks alone.
- Analytics or automatic recording uploads.
- Licensed repertoire as a dependency of the core curriculum.
- Further top-level workspaces without a clear recurring learner purpose. Play is
  the deliberate exception and remains contextually linked from Today.

## How to promote an item into development

Before implementation, write down the learner relationship, the observable
musical action, the owning domain logic, the evidence it records, and what can
remain hidden until it becomes useful. Then give the item a small acceptance
test and move it into the roadmap or a dated implementation plan.
