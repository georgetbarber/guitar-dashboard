# Guitar Academy improvement plan

**Status: draft for review. No implementation has started under this plan.**

Prepared 10 September 2026. Covers the supplied engineering audit and the [design and learning audit](/Users/georgethomasbarber/Developer/guitar-dashboard/docs/reviews/2026-09-10-design-and-learning-audit.md). The existing [Learning Effectiveness Backlog](/Users/georgethomasbarber/Developer/guitar-dashboard/docs/LEARNING_EFFECTIVENESS_BACKLOG.md) supplies additional content acceptance criteria.

The intended outcome is a dependable guitar-learning companion that helps George hear something he wants to make, learn it with useful support, understand its relationships, develop his own version, and retain the ability later.

This is the proposed implementation sequence, not a claim that the existing roadmap or application has already changed. All work below is pending. Each audit finding has an explicit destination in the coverage register near the end.

## 1. Scope and delivery approach

Complete the engineering fixes and the firm product recommendations from both audits. Extend the improved teaching approach across all eight existing stages, including the material represented by all 48 current units. Units 1–12 are the first content milestone, not the endpoint.

Work in the existing `apps/current` application. Preserve the four primary destinations—Learn, Play, Create and Explore—and the established visual identity. Reuse validated music, guitar, audio and storage components where their contracts fit. Avoid a new application version tree or a broad rewrite.

Ship the work in small, independently verifiable increments. One teaching episode should work end to end before its delivery pattern is expanded. Content may be reordered or split where prerequisites demand it; retain mappings from existing unit and activity IDs so progress and saved work survive.

“Fix everything” includes verification, recovery, accessibility, content quality and clear documentation. It does not mean implementing every speculative future feature. Optional ideas from the design audit have explicit evaluation points in Phase 8. A full DAW, unreliable chord recognition, a general chat tutor, leaderboards and hundreds of generated lessons remain outside the recommendation.

Drafting this plan changes documentation only. Implementation, commits and publication are separate actions. Do not push or deploy without George's explicit instruction.

## 2. Milestones and dependencies

| Phase | Deliverable | Depends on | Completion gate |
| --- | --- | --- | --- |
| 0 | Verified starting point and recovery fixtures | — | Existing changes inventoried; audit claims reconciled; baseline recorded. |
| 1 | Reliable saving, importing, syncing and updates | 0 | Failure tests preserve work and expose truthful status. |
| 2 | Accessible foundations and dependable release checks | 0; integrate with 1 | Core journeys pass keyboard, mobile and release checks. |
| 3 | First complete musical learning episode | 1; relevant 2 checks | Hear → practise → repair → vary → save → recall works for one study. |
| 4 | Connected Learn, Play, Explore and Create | 3 | The same music and session context survive every handoff. |
| 5 | Precise progress, placement and assessment | Core models from 3; integrate with 4 | Recommendations use the relevant capability and honest evidence. |
| 6 | Fully authored curriculum and repertoire | Pilot evaluation of 3–5 | Content released in reviewed batches through all eight stages. |
| 7 | Personal trial, final consolidation and release readiness | Trials start at 3; final gate after 6 | Retention, transfer, real-device recovery and full regression evidence recorded. |
| 8 | Selected extensions from the design audit | Stable core and learner observations | Each extension earns inclusion through a useful, tested journey. |

Phases are dependency groups, not single giant changes. Accessibility and reliability are tested throughout. Content preparation can start while implementation proceeds, but bulk authoring should use the proven episode format. Later testing must not defer a failure test needed to trust an earlier milestone.

There is no reliable calendar estimate yet. Engineering can be divided into bounded work packages; recorded demonstrations, musical review and delayed learner checks depend on real availability and elapsed time. Estimate the next milestone after Phase 0, then revise after the first teaching pilot.

## 3. Phase 0 — establish a recoverable starting point

- Record the current branch, tracked and untracked changes, active entry points, routes and verification commands. Review the existing bounds, sync, security-header and publishing-script changes without overwriting or assuming they are finished.
- Reproduce the engineering findings against the current checkout. Classify each as confirmed, partially fixed, already fixed or requiring further evidence. Preserve the original finding and attach the current result.
- Run current unit tests, build and browser journeys. Establish a working supported Java runtime for local emulator tests if available; otherwise run them in the configured CI environment and state that distinction. Never use `sudo` or broaden filesystem access.
- Record dependency findings anew. The supplied audit's 94 unit tests, 32 browser tests and 18 development advisories are historical observations, not current pass criteria or fixed counts.
- Prepare synthetic small and large workspaces, older archive fixtures, malformed records, recording blobs, conflicting device updates and deletion cases. Use test-owned data for destructive recovery tests.
- Establish an additive recovery snapshot for implementation and migration work. Do not stage, commit, delete or reset unrelated files as a convenience.

**Deliverables:** audit status register, baseline results, migration/recovery fixtures and a short first implementation scope. Likely areas: tests, repository/store boundaries, Firebase rules, scripts and CI.

## 4. Phase 1 — make the existing app trustworthy

Implement these as separate changes with regression evidence.

**1A. Saving and identity**

- Expose distinct local states: saving, saved, failed with retry. Keep cloud status separate: offline/queued, synchronising, synced or needs attention.
- A successful render or dispatched action must not imply durable storage. Keep unsaved changes available while retrying; offer a recoverable export when the normal store fails.
- Replace timestamp-derived entity identities with stable random IDs for new sketches, chord events, takes, revisions and evidence. Preserve existing IDs and references. Repeated delivery of the same operation reuses its ID.

**1B. Validation and bounded data**

- Validate local persisted state, imported archives and incoming cloud data before use. Include nested arrays, timestamps, musical context, chord/voicing data, take references and schema versions.
- Enforce client limits and independent server rules for all relevant fields and nested structures. Test tags, chords, melody, sections, takes, revisions, reflections and deletion records as well as text and tempo.
- Do not silently discard user music to fit a cloud document. Prevent new invalid edits visibly, preserve oversized legacy material locally, and provide an export or reviewed migration path.
- Isolate invalid cloud records so one rejected document does not permanently stall unrelated valid work. Retry transient failures; surface permanent validation failures with an actionable explanation.
- Define document-size and history growth strategy. If histories need separate records, migrate them compatibly. Never prune deletion records merely to meet a size cap while an old device could resurrect deleted work.

**1C. Transactional restore and migration**

- Validate the entire archive before activation: version, metadata, bounds, references and recording integrity. Show what will be restored and which workspace is affected.
- Stage state and blobs in an inactive workspace generation. Activate only once all required writes are durable. On interruption or failure, keep the previous workspace usable; remove incomplete staging safely on recovery.
- Clean superseded recordings only after successful activation and according to the retained recovery policy. Shared or externally referenced blobs must not be removed accidentally.
- Distinguish local restore from cloud merge or replacement. A local import must not silently delete or overwrite account history or upload recordings.
- Test legacy import, round-trip export, corrupt archives, missing blobs, quota failure, cancellation, restart at each stage and large histories.

**1D. Safe application updates**

- Replace immediate service-worker reload with update-ready handling. Defer activation while recording, importing or holding unsaved edits; apply at a safe boundary.
- Correct the emitted `/sw.js` cache-header target and test the built worker path.
- Persist durable session and edit state. During a crash, do not promise recovery of unretained audio unless chunk persistence is actually implemented; make its temporary state clear.
- Test an update during recording/editing, an offline restart, and old/new clients sharing a workspace.

**1E. Correct current promises**

- Honour the selected 10–90-minute session duration in the existing planner as an interim correction, using valid task selections and honest duration labels. The final session design arrives in Phase 4.
- Make a new sketch inherit its source musical context; expose consistent root and mode choices using shared theory data.
- Immediately replace misleading transformation actions with explicitly described prompts where no transformation exists. Implement real, reversible transformations in Phase 4.
- State when evidence is learner-reported. Make creative completion point to an existing saved artifact without implying the app has evaluated its quality.
- Resolve the “append-only” evidence contract. Recommended: immutable ordinary observations with explicit correction/retraction records; deliberately supported history/account erasure is a separate documented operation. Align rules, UI and tests with that contract.

**Gate:** failure injection does not lose the previous durable workspace; saves and sync never falsely report success; malformed data is handled visibly; each confirmed trust failure has a targeted regression check. Local transactions are not described as atomic across Firebase and browser storage.

## 5. Phase 2 — repair accessibility and release foundations

**2A. Immediate interface corrections**

- Remove the mobile settings/new-sketch collision and cramped nested Learn navigation. Check narrow screens, zoom and long labels.
- Correct text, controls and focus contrast to applicable WCAG AA requirements; retain the palette with adjusted colour roles.
- Implement dialog focus entry, containment, Escape where appropriate, restoration and background inertness. Preserve an explicit safe exit when work is in progress.
- Implement a proper keyboard fretboard: one entry point, arrow-key movement, clear focus and meaningful string/fret/note/relationship announcements.
- Add automated accessibility checks and manual keyboard/screen-reader checks for core journeys. Carry these checks into the new player.
- Supply intended fonts locally with appropriate licences, or choose and document reliable system fonts. Test their effect on layout and caching.
- Remove “V8” and internal build language from normal learner-facing copy; retain diagnostics in About/Settings.

**2B. Build and release reliability**

- Run browser journeys in CI alongside relevant unit, build and Firebase rules checks. Ensure the supported Java runtime is configured consistently.
- Add deployment concurrency protection and a policy that prevents an older eligible build from replacing a newer release. Validate against the existing workflows before choosing cancellation behaviour.
- Introduce linting, formatting and meaningful coverage visibility. Start with changed files and critical domains; avoid a repository-wide formatting diff or a meaningless global percentage target.
- Review and update vulnerable development dependencies in compatible groups, with current advisories checked at implementation time. Do not force an unreviewed bulk upgrade.
- Lazy-load Firebase when the user requests sync/sign-in. Verify that guest startup omits the cloud chunk and sign-in remains usable.
- Measure startup transfer and offline cache size. Define a lightweight app shell plus deliberate lesson/media caching; large demonstration files must not inflate every first load. Show when a selected lesson is ready offline.
- Include historical iteration 07 in the repository verification script. Repair inaccurate app-directory documentation and the two reported historical README links as narrowly scoped preservation fixes.

**Gate:** desktop and phone journeys, keyboard operation and dialogs are usable; CI exercises the real UI; rules tests have evidence; loading/sync changes preserve offline use. Deployment headers and live update behaviour receive a final live check only when publication is authorised.

## 6. Phase 3 — prove one complete teaching experience

Build a single episode around **a one-note rhythmic question and answer**, adapting the existing early sound/time material. It offers an achievable starting point without assuming chord knowledge. Choose exact notes, counts, stops, tempo range and physical actions during content authoring.

**3A. Minimal shared learning model**

- Introduce structured musical material: stable ID/version, tuning, tonal context, metre, events with register and durations, rests/articulation and reviewed guitar positions. Keep performed reference media separate but linked to the same version.
- Describe an episode through the necessary teaching moves, precise capability targets, success criteria, likely obstacles, repair branches, variations and transfer contexts. Do not require nine separate activities for every topic.
- Add a persistent session cursor and attempt identity. Record assistance actually present, assessment method and material/context version.
- Map older records conservatively. Keep legacy progress and work accessible; do not fabricate granular mastery from broad historical evidence.

**3B. Shared practice player**

- Put one clear instruction, playable material, one listening cue and essential controls together, including at phone dimensions and music-stand distance.
- Deliver exact reference playback, count-in, pulse, adjustable tempo, whole-study/selected-section looping and an immediate stop.
- Synchronise count, tab and local fretboard highlighting with the same event timing. Use an audio-clock-based schedule; test cancellation and prevent overlapping players.
- Offer demonstration bars followed by learner bars. Keep replay and slowdown available without navigating.
- Provide optional local recording and paired playback for a specific comparison. Keep recording, retention and upload choices separate.
- For recorded references, provide reviewed tempo variants initially or a validated pitch-preserving playback method. Do not change playback rate and silently change pitch. Structured practice synthesis is not a substitute for a reviewed technique demonstration.

**3C. Actual teaching and recovery**

- Separate Learn it, Practise it and Try it unaided. Demonstration and help are expected during teaching; independent checks deliberately remove the relevant cues.
- Author at least three useful obstacle branches, such as understanding the task, controlling release and keeping the pulse. Each provides changed material or support, then returns to the original phrase.
- Let a struggling learner use an easier version, take a break or schedule a return without claiming the original skill was mastered.
- End with a small personal variation saved from the current material and one concrete observation. Include a later unaided check before calling the pilot complete.

**Gate:** a learner can begin, hear the exact example, repeat it, recover from a specific obstacle, make a variation and return later without outside coaching. All content must pass musical and physical review; code checks alone cannot establish those claims.

## 7. Phase 4 — connect the whole product around the music

**4A. Learn and the session journey**

- Lead with audible musical destinations and one editable personal goal. Keep the beginner default and optional starting-point choice; add brief demonstrated placement through Phase 5.
- Make Continue show a meaningful musical objective, current material and next action. Move completion totals and accounting into secondary views.
- Persist one session plan across Continue, activities, repairs and detours. “Next” follows that plan; it does not drift into the full unit sequence.
- Choose a coherent amount of work for the available time: recall, targeted work, musical use, optional capture and a clear ending. Budget guidance is not a forced countdown.
- Add a shorter return session after a gap, familiar favourites and delayed recall. End with an evidence-appropriate account of what happened and the next useful step.

**4B. Explore in context**

- Open an explanation of the exact phrase, chord or note currently being practised. Preserve key, metre, tempo, selected region and the return location.
- Link sound, interval/degree/chord role, spelling and physical location without conflating their roots of reference.
- Implement focused controlled comparisons, including moving 3 to ♭3 while retaining root and rhythm. Keep the wider reference tools available through progressive disclosure.
- Put explanations of terms at their point of use. Review simplistic emotional labels and replace them with accurate structures and open listening comparisons.

**4C. Create from actual material**

- “Make it mine” opens a new editable version of the current music, with its musical context and source link retained. Do not require naming, harmony or theory labels before capturing sound.
- Begin with one useful edit; disclose arrangement and richer harmony when relevant. The complete creative workflow remains available without presenting it as eight obligations.
- Implement and validate all six current experiment intentions: change harmony while retaining rhythm; change rhythm while retaining harmony; hold a common tone; alter one interval; transpose; and form a related B section.
- Each operation has a valid material domain, an explicit preview, an audible comparison, confirmation through the normal edit action, undo and a preserved original. If a common tone or playable transposition is unavailable, offer alternatives rather than claiming success.
- Make transposition distinguish pitch movement from a playable guitar realisation, including open strings, tuning boundaries and register limits.
- Support before/after take comparison and deliberate finishing without numerical creativity scores. Annotations remain annotations; they must not masquerade as musical changes.

**4D. Free Play with continuing support**

- Reuse the player for stable backing, count-in, useful loops, repeat and optional automatic advance at musical boundaries. Stay ungraded and allow free skipping.
- Match prompts to specific available capabilities and offer easier alternatives. Permit the learner to explore with help without granting untested capability.
- Preserve a promising fragment during the flow, including its material and context, and carry it to Create.
- Make completion wording reflect what was actually reported or captured; clicking through is not proof of playing.

**Gate:** complete a session → Explore detour → resumed attempt → Free Play variation → saved sketch → later reopening journey with the same material intact. Navigation, browser history, refresh and offline interruption must not silently change the lesson or lose the session cursor.

## 8. Phase 5 — make feedback and progression useful and honest

- Build a small capability catalogue covering the pilot first, then extend it with curriculum authoring. Distinguish listening, naming, locating, timing and playing actions.
- Derive readiness from relevant evidence: capability, assessment method, support, actual context, date and content version. A high unit number or reflection cannot imply physical readiness.
- Use factual progress descriptions and dated checks. Preserve previous achievements; recommend a refresh without treating absence as failure. Handle learner-local dates and timezone changes explicitly.
- Schedule short delayed recall in Continue. Use actual changed examples for transfer and record the attempted conditions rather than inferring them from settings.
- Make Strengthen choose the right repair for an obstacle, then return to its musical application. Avoid repeatedly assigning the same unsuccessful task without adaptation.
- Offer optional placement sampling pulse, sound control, ear, fretboard and chord knowledge separately. Explain the recommendation and permit a different starting choice; no untested skill becomes mastered.
- Add exact-answer checks for interval, degree, chord tone and Roman numeral tasks where appropriate. Withhold answer-bearing labels during the relevant check.
- Add microphone assessment in increasing difficulty: sustained monophonic pitch, separated attacks, then suitable short monophonic sequences. Establish input quality and latency handling; return uncertain when the signal is unsuitable.
- Use recorded comparison and structured self-review for phrasing, muting, tension, tone and creative intention. Do not infer these from unreliable pitch recognition. Teacher-observed evidence requires an actual identified observation, not an automatic source label.

**Gate:** tests show that assisted practice, a correct diagram answer, self-reported playing and measured pitch remain distinguishable. Delayed checks and real-input trials support every assessment claim. Mixed-version sync preserves the evidence distinction.

## 9. Phase 6 — author the full course and a repertoire worth keeping

First add two contrasting pilot episodes to the sound/time episode: a major/minor-third comparison and a manageable chord-transition/phrase-variation episode. Use them to test different teaching problems before bulk authoring.

Then author in batches: **Units 1–12 → 13–24 → 25–36 → 37–48**, reconciling the numbering if reviewed prerequisites require changes. Every existing unit gets a disposition: fully revised, merged with a named replacement, or explicitly superseded with its learning outcome preserved elsewhere. No later stage disappears into an indefinite backlog.

For each episode supply:

- Exact musical events, strings/frets or reviewed voicings, rhythm and practical tempo range.
- An inviting purpose, audible destination, appropriate demonstration and at least two musically distinct studies or contextual variations per unit.
- The variable being changed, relevant capabilities, honest success criteria, likely errors and specific repairs.
- A cue-fading sequence, a retrieval task and a real transfer context.
- A route into a complete musical performance or personal artifact.
- Content version, author/reviewer provenance and review status: draft, reviewed or trialled. Review status and learner access locks are separate concepts.

Build a small growing repertoire with layered parts: one-note participation, accompaniment, melody/riff and later expressive variations. Keep favourites and return to earlier music with deeper understanding. Provide stylistically different grooves through audible rhythmic and articulation differences. Include at least one substantial performance or original artifact at each stage boundary.

Audit and fill physical coverage deliberately: open/movable/barre chords, strumming, picking, muting, chord changes, position shifts, slides, hammer-ons, pull-offs, bends, vibrato, palm muting, accents, fingerstyle where appropriate, phrasing, and ensemble timing. Include readable rhythm, triplets and actual swing playback; offer richer tab and optional staff literacy without gating the relationship path.

Technique demonstrations need the relevant hands visible, normal and slow examples, and a musical use. Use reviewed original or appropriately licensed material with provenance. Agents can draft studies, diagrams, scripts and asset specifications; recorded physical demonstrations and playability approval need real guitar performance and competent review. Missing assets stay visibly provisional and block claims of completed coverage.

**Gate for each batch:** theory review, physical playability, audio/display correspondence, accessibility, useful failure recovery and an uncoached learner attempt. Automating the content validator is necessary but insufficient. Units 1–12 may become ready earlier; full-course completion requires disposition and reviewed coverage through the final stage.

## 10. Phase 7 — prove the result and prepare a controlled release

**Learner evaluation begins after Phase 3.** Run a roughly two-week personal trial on two or three capabilities George wants and does not already perform reliably. Capture a baseline, observe use without live coaching, revisit after a delay, and try changed examples. A saved recording is optional and explicit. Track interruptions, useful repairs, retention, transfer and voluntary return to the music. Do not introduce background analytics.

Use the findings to revise the player and authoring pattern before scaling. A small personal trial informs usefulness for George; it does not prove general educational effectiveness or guarantee an improvement in a fixed number of days.

**Finish the repository and release work:**

- Perform an import/reachability review of retained V7 UI. Move genuinely obsolete application code into history only after proving it is not used. Keep shared theory/audio/instrument code and meaningful tests in the active app. Historical changes remain preservation-only.
- Reconcile README files, learning model, architecture, curriculum contract, roadmap, future-feature statuses, setup and publishing guidance with actual implemented behaviour. Preserve audits as dated evidence.
- Run the complete applicable verification suite, including legacy migration, large-history backup, rules, cloud conflicts/deletions, offline, browser navigation, accessibility and audio/display checks.
- Test on George's actual laptop and Pixel when available: installed PWA, background/foreground, audio output, microphone denial, offline practice, save/reopen, cross-device changes and an update while work is active.
- Prepare a release note, exact change set, known limitations, backup/rollback procedure and compatible client/rules rollout sequence. Do not roll back to an app that cannot safely read newly written state.
- Publish only when requested. After authorised publication, verify the deployed worker and security headers, primary journey, sign-in, sync and update behaviour. Distinguish local, emulator, CI and live evidence.

**Core completion:** every firm audit recommendation is fixed or explicitly superseded by a verified design; all curriculum material has a reviewed disposition; no undisclosed provisional content is presented as finished; important failure paths have evidence; and George has tested the central playing journey.

## 11. Phase 8 — evaluate the optional extensions explicitly

The second audit described these as later possibilities. Include their evaluation in the programme, while keeping them out of the core completion claim until their value and dependencies are established.

| Extension | Proposed scope | Admission test |
| --- | --- | --- |
| No-guitar companion | Short ear/relationship rounds using the same music, linked to a later guitar task. | Useful on the phone; never grants physical-playing mastery. |
| Bring your own music | Manually specified song/reference link or private recording, chosen excerpt and practice aim. No automatic transcription dependency. | User can work on a chosen fragment without losing provenance or privacy. |
| Hands-free controls | Keyboard playback shortcuts first; optional compatible pedal mapping later. | Reduces real practice interruptions; shortcuts do not interfere with text input. |
| Contextual AI explanation | Explain the selected reviewed material or offer an alternate explanation; preserve source and uncertainty. | Demonstrably helps where authored help fails; requires a separate explicit data/provider/cost design before integration. No automatic grading or upload. |

Alternate tunings and additional harmonic/melodic-minor systems remain separate existing backlog items unless needed by the reviewed course. They were not firm recommendations of these two audits. This avoids silently treating every historical idea as part of “everything”.

## 12. Project frame: data, authority and recovery

This frame defines the important contracts before Phase 3. Refine the exact schema during that phase; do not build a universal lesson framework in advance.

| Entity | Authority and identity | Lifecycle and essential rule |
| --- | --- | --- |
| Musical material | Versioned authored source or user-owned sketch revision; stable ID | Draft/reviewed material; derived sound and views agree with its events. Editing creates a deliberate revision. |
| Episode | Reviewed content version referencing material and capabilities | Teaching → practice → check, with explicit repairs, return and exit. |
| Session | Locally durable plan and cursor; learner controls continuation | Planned → active ↔ paused → ended/completed. Refresh and detours preserve the intended next action. |
| Observation | Stable attempt/observation ID, method and actual context | Immutable observation, optionally corrected/retracted through explicit records. No inference becomes observed fact. |
| Capability summary | Derived, versioned policy over compatible observations | Fresh/needs-revisit and support-specific descriptions; no invented historical mastery. |
| Sketch/revision | User-owned material with stable references | Captured → edited → compared → deliberately finished; previous material is recoverable. |
| Recording | Device-owned blob plus explicit metadata | Recording → temporary → retained/discarded; optional deliberate cloud copy is a separate state. |
| Restore operation | Workspace-scoped operation ID and staging generation | Validating → staging → ready → activated; cancellation/failure retains the previous active workspace. |
| Sync operation | Account/workspace-scoped stable IDs and versions | Queued → sending → acknowledged or retryable/permanent failure; reconcile unknown outcomes. |

**Sources and inputs.** Learner edits, self-reports and goal choices are user input, not proof of a measured performance. Archives, stored data and cloud snapshots are untrusted structured inputs. Microphone output may be noisy or unavailable. Content is authoritative only for its reviewed version. Updates, network reconnects and duplicate callbacks may arrive during any workflow.

**Important invariants:**

- UI success, local durability, cloud acknowledgement and learning success are separate states.
- Derived progress is reproducible from evidence and policy; duplicate events cannot advance it twice.
- A recorded check stores the cues and context actually used. Theory answers cannot grant physical technique.
- Tempo changes preserve pitch; transposition deliberately changes pitch and recalculates spelling and guitar realisation.
- Partial import cannot replace a working workspace. Local activation and remote synchronisation are separate transactions.
- No recording uploads automatically. Account identity and workspace ownership are checked before sync.
- Invalid edits or oversize data cannot silently destroy music; conflicting or legacy records retain a recovery path.
- Old clients cannot reverse newer deletions or discard fields they do not understand. Rollout compatibility is tested explicitly.

| Boundary/failure | Planned response | Required evidence |
| --- | --- | --- |
| Browser storage fails or fills | Retain dirty work, expose failure, retry/export; preserve previous durable snapshot | Repository failure tests and browser reload/recovery journey |
| Archive staging is interrupted | Keep old generation active; resume safely or remove test-owned incomplete staging | Restart/cancellation tests at each activation boundary |
| Cloud succeeds but acknowledgement is lost | Reconcile stable IDs/versions; retry without duplicate observations | Duplicate delivery and unknown-outcome tests |
| Two devices edit/delete offline | Apply documented conflict/deletion policy; surface unresolved conflict | Emulator/integration tests and later real-device trial |
| New schema meets an old client | Compatible reader/writer policy; block unsafe overwrite; preserve backup | Mixed-version fixtures and staged rollout rehearsal |
| Audio is interrupted or loops overlap | Cancel scheduled sound, retain session cursor, resume with a count-in | Player lifecycle and device background/foreground checks |
| Input audio is unsuitable | Return uncertain; offer demonstration/self-comparison | Noisy, silent, polyphonic and latency-varied assessment cases |
| Help or retry repeats | Preserve distinct attempts; never count replays as new success | Evidence-policy tests |
| Update arrives during retained or temporary work | Defer activation until safe; show temporary-audio limits | Browser/PWA update journey |

Automatic retry is for safe, repeatable operations with bounded backoff. Permanent invalid-input failures require correction, not endless resubmission. Deletion of user-owned material, account-history replacement and external publication retain explicit user control. Routine low-risk implementation choices do not need repeated approval.

## 13. Coverage register: supplied engineering audit

These IDs identify findings for future implementation tracking. “Phase” names the planned home, not completion. Verify the finding first in Phase 0; an already-fixed result needs evidence rather than another patch.

| ID | Finding | Phase |
| --- | --- | --- |
| B01 | Practice duration ignored | 1E interim; 4A final session design |
| B02 | Invisible local-save failure | 1A |
| B03 | Update reload during recording/editing | 1D |
| B04 | Non-transactional, shallowly validated import and orphaned blobs | 1B–1C |
| B05 | Create transformation controls only append prose | 1E truthful interim; 4C real operations |
| B06 | 48 units/432 templated activities lack authored depth | 3, 6 |
| B07 | “Evidence”/“Secure” overstate reported actions; creative artifact unchecked | 1E, 3A, 5 |
| B08 | Persisted/imported/cloud structures trusted too readily | 1B–1C |
| B09 | Incomplete array/history/tombstone bounds | 1B |
| B10 | Sketch ignores shared tonal context; inconsistent roots/modes | 1E, 4B–4C |
| B11 | Mobile settings/Create overlap; cramped Learn tabs | 2A |
| B12 | Insufficient text contrast | 2A and all new screens |
| B13 | Incomplete dialog focus, Escape, restoration and inertness | 2A |
| B14 | Exhausting fretboard keyboard traversal | 2A |
| B15 | Missing automated accessibility checks | 2A–2B |
| B16 | Intended fonts not supplied | 2A |
| B17 | Internal version copy in learner experience | 2A |
| B18 | Guest startup loads Firebase unnecessarily | 2B |
| B19 | Large initial/PWA cache footprint | 2B; media caching in 3/6 |
| B20 | Worker header targets wrong filename | 1D; live verification 7 |
| B21 | Browser tests absent from CI | 2B |
| B22 | Deployment race/concurrency protection absent | 2B |
| B23 | No linting, formatting, accessibility or coverage gate | 2A–2B |
| B24 | Verification script omits history iteration 07 | 2B |
| B25 | App-directory README identifies wrong active version/count | 2B; final reconciliation 7 |
| B26 | Two broken historical README links | 2B preservation fix |
| B27 | Unreachable old UI remains in active source | 7 after reachability review |
| B28 | Timestamp-derived IDs can collide | 1A |
| B29 | Append-only evidence contract conflicts with client deletion | 1E |
| B30 | Development dependency advisories | 0 current assessment; 2B upgrades |
| B31 | Firebase rules tests not locally verified; Java unavailable on normal path | 0, 2B |
| B32 | Real-device/live behaviour not verified | 7; publication only when requested |

## 14. Coverage register: design and learning audit

| ID | Recommendation | Phase |
| --- | --- | --- |
| D01 | Audible destination, personal musical aim and inviting entry | 3, 4A, 5 |
| D02 | Playing-first visual hierarchy and contextual terminology | 2A, 3B, 4B |
| D03 | Authored episodes with appropriate teaching moves | 3A–3C, 6 |
| D04 | Specific repair branches and recovery from repeated struggle | 3C, 5 |
| D05 | Separate teaching, practice and unaided checks; fade actual cues | 3C, 5 |
| D06 | Granular capabilities, honest progress, delayed recall and transfer | 3A, 5 |
| D07 | Coherent duration-aware sessions, re-entry and meaningful ending | 1E, 4A |
| D08 | Earlier application, growing repertoire, layered parts and style | 3, 6 |
| D09 | Carry material/context across areas; prefilled creative variation | 4 |
| D10 | Shared practice player, demonstrations and appropriate assessment | 3B, 5, 6 |
| D11 | Test several kinds of episodes before extending Units 1–12 | 3, 6 pilot gate |
| D12 | Before/after evidence and roughly two-week personal trial | 3B, 7 starting early |
| D13 | Optional no-guitar, own-music, hands-free and contextual AI ideas | 8 explicit evaluation |

## 15. How implementation will be tracked

For each work package keep: scope, linked B/D finding IDs, dependencies, changed areas, status, acceptance evidence, migration impact and remaining limitations. Suggested statuses: pending, in progress, implemented, verified locally, verified in CI, needs musical/device/learner review, released, or superseded with a reason.

“Implemented” does not close a finding that still needs its relevant verification. Each implementation session should leave a runnable app and update this record with what changed, what passed and the exact next package. Keep local documentation and release claims aligned with that evidence.

The next executable package, once George asks to begin, is **Phase 0 followed by Phase 1A: establish the baseline, then make saving status and failure recovery trustworthy**. That provides a safer foundation for every subsequent change.
