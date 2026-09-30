# Project Instructions

## Purpose

This repository contains a guitar-learning dashboard. Teach music through
relationships rather than rote memorisation. The goal is not merely to display
notes, scales, and chords, but to help learners understand how they connect.

## Learning Philosophy

Prioritise relationship-first learning:

- Intervals relative to a root
- Scale degrees relative to a tonal centre
- Chord tones relative to a chord root
- Roman numerals relative to a key
- Harmonic function
- Fretboard shapes as physical interval structures
- Movable patterns across the guitar neck
- Links between sound, theory, and hand position

Help learners hear, see, name, compare, play, predict, and transfer musical
relationships.

## Pedagogy

- Prefer understanding over memorisation.
- Prefer progressive disclosure over dashboard clutter.
- Use worked examples and guided comparison before open-ended complexity.
- Connect visual, aural, theoretical, and physical understanding.
- Avoid cosmetic-only controls or features that imply unsupported depth.
- Establish basic relationships before introducing advanced theory.

## Music-Theory Quality

- Keep musical labels correct and consistent.
- Validate interval, scale-degree, chord-tone, Roman-numeral, fretboard, and
  audio mappings where practical.
- Do not duplicate theory constants unnecessarily.
- Mark a feature as limited or defer it if it cannot be musically correct.

## Guitar-Learning Quality

- Connect theory to the physical guitar.
- Prioritise fretboard geography, octave shapes, triads, inversions, voicings,
  movable patterns, and sound-action relationships.
- Visualisations must support understanding and playing, not decoration alone.

## Engineering

- Treat `apps/current` as the active product. Use `apps/history` only for
  comparison or narrowly scoped preservation fixes.
- Preserve working code unless a targeted refactor is clearly safer.
- Prefer small, high-impact improvements over broad rewrites.
- Keep music and domain logic separate from UI where practical.
- Add tests or validation scripts for music logic where practical.
- Keep each application runnable locally.

## Safety

- Work only inside this repository.
- Do not use `sudo` or request full disk access.
- Do not access files outside this repository.
- Do not read SSH keys, browser data, keychains, tokens, passwords, or personal
  files.
- Do not push to GitHub unless explicitly asked.
- Before starting work, run `git fetch origin` and compare this branch with
  `origin/main`. If GitHub is ahead, say so and bring it in before building on
  an older version.
