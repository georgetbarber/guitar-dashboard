# Documentation Guide

Use this directory as the durable explanation of the project. App-specific
implementation details remain beside the relevant app; cross-project decisions
live here.

## Read in This Order

1. [Project history](PROJECT_HISTORY.md) — how the project began, all seven
   iterations, and where it is now.
2. [Learning model](LEARNING_MODEL.md) — what the product is trying to teach and
   the constraints that follow.
3. [Architecture](ARCHITECTURE.md) — how the current app turns those principles
   into code.
4. [Lessons learned](LESSONS_LEARNED.md) — conclusions from the successive
   prototypes and reviews.
5. [Development](DEVELOPMENT.md) — setup, commands, testing, and repository
   conventions.
6. [Roadmap](ROADMAP.md) — evidence-based next directions and non-goals.
7. [Future features](FUTURE_FEATURES.md) — the planned additions and deferred
   work backlog.
8. [Learning effectiveness backlog](LEARNING_EFFECTIVENESS_BACKLOG.md) — the
   remaining product changes needed to make attempts, feedback, physical
   instruction and musical transfer more effective.
9. [Additional note takeaways](additional-notes/README.md) — useful ideas
   distilled from informal project notes and checked against the current app.
10. [Draft implementation plan](IMPLEMENTATION_PLAN.md) — phased work covering
    the September 2026 engineering and design/learning audits, with acceptance
    gates and a complete findings register. This is proposed work, not shipped behaviour.

## Detailed Source Material

- [Stage 1 product and learning review](reviews/stage-1-product-learning-review.md)
  is the detailed critique that established the beginner learning sequence and
  progressive-disclosure requirements.
- `apps/current/docs/` contains current feature diagnostics and playing-layer
  notes.
- Each folder under `apps/history/` has a README describing that milestone in
  its original context.
- `additional-notes/` preserves relevant thoughts from informal notes without
  copying superseded requests into the active backlog.

Documentation should be updated in the same change as any behaviour or
architecture that makes it inaccurate.
