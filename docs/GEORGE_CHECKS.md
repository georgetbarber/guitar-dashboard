# George's checklist

<!-- Generated from apps/current/src/v8/georgeChecks.json by `npm run docs:checks`. Edit the JSON, not this file. -->

Things only a person with a guitar, the Pixel or a few days can check. Each takes
minutes. Agents never mark these as passed: every item stays `needs George` here.
Tick them in the app under **Settings › Things to check**, where the same list
keeps your ticks on this device and in sync. Leave a “Something's wrong here”
note if a check fails.

19 items, most valuable first within each group.

## On the laptop

### Keep a backup of your current data

- **Status:** needs George
- **Do:** Open Settings and choose “Export complete backup”. Keep the file somewhere safe. Do this once now and again before you try anything that restores or replaces data.
- **Pass:** A .guitar-academy file is saved and its size is not zero.
- **Where:** Settings
- **Why:** Completion brief §7.2: George has real data on the live site and his phone.
- **Added:** 2026-10-20 · Package 0 · `laptop-backup-first`

### Keyboard-only pass

- **Status:** needs George
- **Do:** Without the mouse, use Tab, Shift+Tab, Enter, Space, Escape and the arrow keys to go through Learn, a lesson, Play, Create, Explore and Settings. On a fretboard, move with the arrow keys.
- **Pass:** You can reach and operate everything, you can always see where focus is, dialogs keep focus inside and Escape closes them, and focus returns to where you were.
- **Where:** Learn › Continue
- **Why:** Phase 2A-4 accessibility review: manual keyboard pass not yet performed.
- **Added:** 2026-10-20 · Package 0 · `laptop-keyboard-pass`

### VoiceOver pass

- **Status:** needs George
- **Do:** Turn on VoiceOver (Cmd+F5) and go through Continue, one lesson step, the fretboard and Settings.
- **Pass:** Each control is announced with a sensible name, the fretboard announces string, fret, note and relationship, and nothing important is silent.
- **Where:** Learn › Continue
- **Why:** Phase 2A-4 accessibility review: screen-reader pass not yet performed.
- **Added:** 2026-10-20 · Package 0 · `laptop-screen-reader-pass`

### Read a lesson from where you play

- **Status:** needs George
- **Do:** Open either full lesson, tick “Music-stand view”, put the laptop where a music stand would be and sit with the guitar. Play the study while the reference runs.
- **Pass:** From your playing position you can read the count, the tab and the highlighted chord or fret without leaning in.
- **Where:** Learn › Course map
- **Why:** Completion brief Package 3: the player must work at music-stand distance.
- **Added:** 2026-10-23 · Package 3 · `laptop-music-stand-view`

### A deleted sketch stays deleted on the other device

- **Status:** needs George
- **Do:** Signed in on both devices, make a throwaway sketch, wait until it appears on the Pixel, then delete it on the laptop. Reopen the app on the Pixel.
- **Pass:** The sketch is gone on both devices and does not come back after either device reloads.
- **Where:** Create
- **Why:** Plan §12 boundary table: two devices editing and deleting.
- **Added:** 2026-10-20 · Package 0 · `laptop-cross-device-delete`

## With guitar

### Play the Unit 1 question and answer

- **Status:** needs George
- **Do:** Open Continue and start the one-note lesson. Play the two bars with the reference at 60 BPM, then try one repair (start, stop a ringing note, or hold the pulse through silence) and return to both bars.
- **Pass:** The note (open high E), counts, muting action and hand instruction match what you actually do on the guitar, and the repair you chose made the next attempt easier.
- **Where:** Learn › Continue
- **Why:** Phase 3 gate (log, 26 Sep); Phase 5 gate review item 2.
- **Added:** 2026-10-20 · Package 0 · `guitar-unit-1-pilot`

### Play the C-to-Am lesson

- **Status:** needs George
- **Do:** In the Course map, open Unit 6 and choose “Place it in time” (marked “full lesson”). Hear the exact music at 60 BPM, then play the four-count and two-count studies with it. Try the G-to-Em transfer once you have reported the unaided check.
- **Pass:** The chord shapes, fingers and the one moving finger match what your hand does, the synthesised guitar is in time with the count, and the two-count study is playable at its slowest tempo (40 BPM).
- **Where:** Learn › Course map · Unit 6 · Keep what stays: C to Am
- **Why:** Phase 6 lesson pipeline (Package 3); lesson drafted by an agent and not yet played on a guitar.
- **Added:** 2026-10-23 · Package 3 · `guitar-unit-6-c-am`

### Play the third-colour lesson

- **Status:** needs George
- **Do:** In the Course map, open Unit 10 and choose “Put it under the hands”. Play E–G–E and E–G♯–E on the high E string with the reference, then the reversed order and the F-root transfer.
- **Pass:** The frets shown (0–3–0, 0–4–0; then 1–4–1, 1–5–1 from F) are what you play, and the one-fret difference between minor and major third is clear by ear.
- **Where:** Learn › Course map · Unit 10 · One fret changes the third
- **Why:** Phase 6 lesson pipeline (Package 3); lesson drafted by an agent and not yet played on a guitar.
- **Added:** 2026-10-23 · Package 3 · `guitar-unit-10-thirds`

### Try the sustained-note pitch check with real input

- **Status:** needs George
- **Do:** In Strengthen, open the microphone check. Play open high E cleanly; then the B string by mistake; then a very soft pluck; then a loud, overloaded one; then stay silent. Do it once in a quiet room and once with ordinary background noise (a radio or TV on). If a result does not match what you played, use the “Something's wrong here” link under it.
- **Pass:** The clean and the soft E are identified as near E, the B string is named as a different note (never “near E”), and the overloaded and silent tries come back uncertain.
- **Where:** Learn › Strengthen
- **Why:** Phase 5 gate review item 1; thresholds retuned on synthetic input on 20 October (gate addendum, decision A6).
- **Added:** 2026-10-20 · Package 0 · `guitar-pitch-sustained`

### Try the two-pluck and E–G–E checks

- **Status:** needs George
- **Do:** In the same card, play two E plucks with a real silence between them, then without one. Then play E–G–E on the high string (frets 0–3–0), then once with the wrong middle fret (0–2–0), then with an extra pluck.
- **Pass:** The displayed order matches what you played; without a silence, with the wrong fret or with an extra pluck the result is uncertain or names the different note, never a match. Note any try where the room or the phone's volume made it say uncertain when you played cleanly.
- **Where:** Learn › Strengthen
- **Why:** Phase 5 gate review item 1; thresholds retuned on synthetic input on 20 October (gate addendum, decision A6).
- **Added:** 2026-10-20 · Package 0 · `guitar-pitch-sequences`

### One real review-to-retry journey

- **Status:** needs George
- **Do:** Record a temporary take in the Unit 1 lesson, compare it with the reference, and write what you intended, what you noticed and one change. Reopen it from Strengthen, do the suggested smaller exercise and return to both bars.
- **Pass:** The suggested exercise addresses the thing you noticed, and your next take is better in that one detail by your own judgement.
- **Where:** Learn › Strengthen
- **Why:** Phase 5 gate review item 2.
- **Added:** 2026-10-20 · Package 0 · `guitar-review-retry`

## On the Pixel

### Installed app shows Interval and opens

- **Status:** needs George
- **Do:** Open the installed app on the Pixel (or install it from Chrome's menu). Accept an update if one is offered.
- **Pass:** The home-screen name and icon are Interval's, and the app opens to your existing progress.
- **Where:** Learn › Continue
- **Why:** Rename and 1 October consolidation: installed app not yet checked.
- **Added:** 2026-10-20 · Package 0 · `pixel-install-and-name`

### Sign in and sync after the Firebase update

- **Status:** needs George
- **Do:** In Settings, sign in with Google on the Pixel. Make a small change on the laptop (for example, favourite an activity), then reopen the app on the Pixel.
- **Pass:** Sign-in works, the sync status reaches synced, and the change appears on the other device.
- **Where:** Settings
- **Why:** 1 October consolidation: sign-in and sync with the refreshed SDK not verified.
- **Added:** 2026-10-20 · Package 0 · `pixel-sign-in-sync`

### Playback sounds right and stops when backgrounded

- **Status:** needs George
- **Do:** Play the Unit 1 reference on the phone speaker and on headphones. While it plays, switch to another app, then come back.
- **Pass:** The count-in and notes sound steady and audible, playback stops when the app goes to the background, and nothing keeps playing or overlaps when you return.
- **Where:** Learn › Continue
- **Why:** Plan §10 real-device checks; Phase 3 log.
- **Added:** 2026-10-20 · Package 0 · `pixel-audio-background`

### A selected lesson works offline

- **Status:** needs George
- **Do:** In the Course map, open a unit in the stage you are working in and wait for “Ready offline on this device”. For a stage you are not in yet, tap “Save this stage for offline” first. Turn on aeroplane mode, close the app fully and reopen it. Open that unit's full lesson (Unit 6 or Unit 10) and play it.
- **Pass:** The app opens, the full lesson opens and plays, and anything you save is kept and appears after you reconnect.
- **Where:** Learn › Course map
- **Why:** Plan §10; Phase 2B-5 offline shell; Package 3 per-stage lesson packs.
- **Added:** 2026-10-20 · Package 0 · `pixel-offline-lesson`

### Refusing the microphone leaves the lesson usable

- **Status:** needs George
- **Do:** In the Unit 1 lesson, start a take and deny microphone access when Chrome asks.
- **Pass:** You see a clear message and can carry on with the lesson without the recording.
- **Where:** Learn › Continue
- **Why:** Plan §10; Phase 3 log.
- **Added:** 2026-10-20 · Package 0 · `pixel-microphone-denied`

### An update waits while you are working

- **Status:** needs George
- **Do:** After a new release, open the app while you are partway through writing a review or a sketch edit.
- **Pass:** The app offers the update rather than reloading by itself, and nothing you were typing is lost.
- **Where:** Learn › Continue
- **Why:** Plan §10; Phase 1D update policy.
- **Added:** 2026-10-20 · Package 0 · `pixel-update-during-work`

## After a few days

### Come back on a later day without help

- **Status:** needs George
- **Do:** On a different day from your first Unit 1 success, open Continue and do the later check it offers, and answer the changed concept example in Strengthen.
- **Pass:** You can do the phrase and answer the changed example without looking at the earlier answer.
- **Where:** Learn › Continue
- **Why:** Phase 5 gate review item 3.
- **Added:** 2026-10-20 · Package 0 · `days-delayed-recall`

### Notice what you came back to

- **Status:** needs George
- **Do:** After a week of normal use, look at which lessons or pieces you returned to by choice and which you avoided. Leave a feedback note on one of each.
- **Pass:** Two feedback notes exist: one on something you enjoyed returning to, one on something you avoided, each saying why.
- **Where:** Learn › Continue
- **Why:** Plan §10 personal trial, made non-blocking by the 20 October decisions.
- **Added:** 2026-10-20 · Package 0 · `days-which-lessons-stuck`
