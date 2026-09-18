# Phase 2A-4 accessibility evidence — 18 September 2026

This package addresses B12 (contrast) and B15 (automated accessibility coverage) in `apps/current`. It follows the merged Phase 2A-3 phone layout. The separate visual restyling work was not incorporated.

## What changed

- Added axe-core Playwright checks for onboarding, the core learning screens, an active Play flow, a populated Create sketch, Settings and activity dialogs in light and dark themes on desktop and Pixel-sized Chromium. The checks select WCAG 2.0, 2.1 and 2.2 A/AA rules; axe's automated result is not a whole-product WCAG conformance claim.
- The first run found text contrast failures across both themes. Darkened light-theme coral, moss and muted text roles; used dark text on light dark-theme action and fretboard colours; and replaced opacity on locked cards with a dashed border so their content stays readable. The same check now finds no automated A/AA violations in those states.
- Increased the phone navigation labels and save status to 12px. Corrected the Settings motion checkbox from a full-row input to an 18px control with a readable label.
- Added a separate control-border colour so inputs remain identifiable without darkening every decorative border. Focus rings are solid 3px; controls on dark surfaces use a light ring. Browser checks measure the phone labels, checkbox size, focus-ring contrast and a Settings control border in both themes.

The ratios used for these checks are [WCAG 2.2 text contrast](https://www.w3.org/TR/WCAG22/#contrast-minimum) (4.5:1 for ordinary text) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast) (3:1 against adjacent colours for required control and focus information).

## Verification

- `npm test`: 247 passed in 32 files.
- `npm run test:coverage`: passed; overall statement coverage 69.41%, branch coverage 55.96%. This is the current coverage reading, not an accessibility score.
- `npm run build`: passed. Vite still warns that the Firebase chunk exceeds 500 kB; package B24 remains separate.
- `npm run test:e2e`: 58 passed across desktop and mobile Chromium, including the new axe scans and legibility checks. Browser emulation does not establish behaviour on a real phone.
- The previous browser suite already exercises dialog focus containment, Escape and restoration, and fretboard arrow-key movement. This package adds visible focus and contrast assertions. A human keyboard pass and a screen-reader pass have **not** been performed; those remain required before claiming the Phase 2A manual accessibility gate is complete.

No deployment or real-device check was performed for this package. The working-tree changes should be reviewed alongside, but kept distinct from, the separate restyling work.
